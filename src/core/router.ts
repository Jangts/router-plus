import { describeSource } from './state-inspection.js';
import { attachBindingHost, type PreparedScope } from './native-bindings.js';
/**
 * Router Plus assembly.
 *
 * The instance owns the fixed page catalog, navigation orchestration, instances, state,
 * interaction, plugins and the global facade. Framework adapters provide a connection; the core
 * never imports React, Vue, Router libraries or DOM renderers.
 */
import {
  stateFields,
  validState,
  sameState,
  queryKeys,
  sameQueryState,
  decodeQuery,
  restoreQuery,
} from './state-fields.js';
import { createCatalogRuntime, type CatalogRuntime } from './catalog.js';
import { dispatchCommand } from './commands.js';
import { executeSequence, type SequenceSource } from './sequence.js';
import type { CommandHost } from './commands.js';
import { EventBus } from './events.js';
import { attachGlobal } from './global.js';
import { readHistoryState, writeHistoryState, type HistoryRecord } from './history.js';
import { RetentionManager } from './instances.js';
import { InteractionEngine } from './interaction.js';
import { LinkRegistry, resolveLink as resolveLinkTarget } from './links.js';
import { defaultMatcher, type RouteMatcher } from './matcher.js';
import { buildPageContext, contextForPlan, runGuardList } from './navigation.js';
import { PluginRegistry } from './plugins.js';
import { createMemoryStateAdapter, StateEngine } from './state.js';
import type {
  CommandResult,
  CommandSequenceOptions,
  CommandSequenceResult,
  StateInspection,
  TargetAnchor,
  CreateRouterPlusOptions,
  FocusOptions,
  GlobalGuard,
  HighlightOptions,
  HighlightRenderer,
  InstanceHost,
  LinkResolution,
  LinkTarget,
  NavigationPlan,
  NavigationResult,
  NavigateOptions,
  PageContext,
  PageDefinition,
  PageInstance,
  PageMatch,
  PageStateAdapter,
  PageStateBridge,
  StateField,
  PageTarget,
  RetentionStrategy,
  RouterCommand,
  RouterConnection,
  RouterEvent,
  RouterLocation,
  RouterPlus,
  RouterPlusPlugin,
  RouterPlusPluginApi,
  ScrollOptions,
  ScrollStrategy,
  TargetRef,
  TargetResolver,
  TargetRuntime,
  TourOptions,
  TourStep,
} from './types.js';
import {
  createNavigationId,
  isPlainObject,
  normalizePathname,
  splitHref,
  toErrorMessage,
} from './util.js';

export const ROUTER_PLUS_VERSION = '0.4.6';
export const ROUTER_PLUS_API_VERSION = 1;

interface GuardEntry {
  readonly guard: GlobalGuard;
  readonly priority: number;
  readonly order: number;
}

function normalizeLocation(location: RouterLocation): RouterLocation {
  const parts = splitHref(`${location.pathname}${location.search}${location.hash}`);
  const pathname = normalizePathname(parts.pathname || '/');
  const search = parts.search && !parts.search.startsWith('?') ? `?${parts.search}` : parts.search;
  const hash = parts.hash && !parts.hash.startsWith('#') ? `#${parts.hash}` : parts.hash;
  return { ...location, pathname, search, hash };
}

export class RouterPlusImpl implements RouterPlus, CommandHost {
  private readonly options: CreateRouterPlusOptions;
  private matcher: RouteMatcher = defaultMatcher;
  private readonly catalog: CatalogRuntime;
  private readonly links = new LinkRegistry();
  private readonly bus = new EventBus();
  private readonly state: StateEngine;
  private readonly interaction: InteractionEngine;
  private readonly plugins: PluginRegistry;
  private readonly retention = new RetentionManager();
  private readonly globalGuards: GuardEntry[] = [];
  private readonly retentionStrategies: RetentionStrategy[] = [];
  private readonly instanceKeyStrategies = new Map<
    string,
    import('./types.js').InstanceKeyStrategy
  >();
  private readonly stateAdapters = new Map<string, PageStateAdapter>();
  private readonly highlightRenderers: HighlightRenderer[] = [];
  private readonly actions = new Map<string, import('./types.js').NavigationActionHandler>();
  private readonly hosts = new Map<string, Set<InstanceHost>>();
  private readonly routeTransformers: import('./types.js').RouteTransformer[] = [];
  private readonly scopes = new Map<
    string,
    { context: PageContext; alive: boolean; facade: RouterPlus }
  >();
  private readonly hostTasks = new Map<InstanceHost, Promise<unknown>>();
  private stopInterception: (() => void) | null = null;
  private readonly historyStateKey: string;
  private readonly detachGlobal: () => void;

  private connection: RouterConnection | null = null;
  private unsubscribeConnection: (() => void) | null = null;
  private location: RouterLocation = { pathname: '/', search: '', hash: '', action: 'initial' };
  private context: PageContext;
  private historyRecord: HistoryRecord | null = null;
  private running: Promise<CommandResult> | null = null;
  private activeController: AbortController | null = null;
  private readonly observedNavigations = new Map<string, PageContext | null>();
  private lastSignature = '';
  private pluginFailure: string | null = null;
  private disposed = false;
  private disposal: Promise<void> | null = null;
  private readonly pendingPlugins = new Set<Promise<void>>();
  private pluginQueue: Promise<unknown> = Promise.resolve();

  readonly version = ROUTER_PLUS_VERSION;
  readonly apiVersion = ROUTER_PLUS_API_VERSION;
  readonly ready: Promise<void>;

  constructor(options: CreateRouterPlusOptions) {
    const requested = options.apiVersion ?? ROUTER_PLUS_API_VERSION;
    if (requested !== ROUTER_PLUS_API_VERSION) {
      throw new Error(`Unsupported Router Plus API version: ${requested}`);
    }
    this.options = options;
    if (
      options.pageLink &&
      (options.pageLink.pathKey ?? 'path') === (options.pageLink.tabKey ?? 'tab')
    )
      throw new Error('Page link path and tab keys must differ');
    this.matcher = options.matcher ?? defaultMatcher;
    this.routeTransformers.push(...(options.routeTransformers ?? []));
    this.historyStateKey = options.historyStateKey ?? 'routerPlus';
    this.location = normalizeLocation(
      options.initialSnapshot?.location ?? options.initialLocation ?? this.location,
    );
    this.catalog = createCatalogRuntime(options.pages, this.matcher, options.pageLink?.tabKey);
    this.historyRecord = readHistoryState(this.location.state, this.historyStateKey);
    this.context = buildPageContext(
      this.location,
      this.catalog,
      this.matcher,
      options.pageLink,
      this.historyRecord,
      this.instanceKeyStrategies,
    );
    this.diagnoseStateQuery(this.context);
    this.state = new StateEngine({
      adapter: options.state ?? createMemoryStateAdapter(),
      namespace: this.historyStateKey,
      getContext: () => this.context,
      getDefinition: (pageId) => this.definitionOf(pageId),
      emit: (event) => this.bus.emit(event),
      bridgeChanged: (context, key, value) => {
        if (context.instance?.stateKey !== this.context.instance?.stateKey) return;
        const field = stateFields(this.definitionOf(context.pageId))[key];
        if (
          !field ||
          field.navigation === false ||
          sameQueryState(key, field, this.context.values[key], value)
        )
          return;
        if (!validState(field, value)) {
          this.bindingDiagnostic(new Error(`Invalid external state: ${key}`), 'state.bridge');
          return;
        }
        void this.setState(value, key).then((result) => {
          if (!result.ok)
            this.bindingDiagnostic(
              new Error(`State address update failed: ${key}: ${result.reason}`),
              'state.bridge',
            );
        });
      },
      codec: options.stateCodec,
      persistenceFailure: options.persistenceFailure,
      diagnostic: (error, stage) => this.bindingDiagnostic(error, stage),
      defer: (effect) => this.deferBinding(effect),
      getAdapter: (name) => this.stateAdapters.get(name),
    });

    this.interaction = new InteractionEngine({
      getRoot: (context) => {
        for (const host of this.hosts.get(context.instance?.stateKey ?? '') ?? []) {
          const root = host.root?.();
          if (root) return root;
        }
        return null;
      },
      getContext: () => this.context,
      emit: (event) => this.bus.emit(event),
    });
    attachBindingHost(this, {
      committed: (source) => this.sourceCommitted(source, this.context),
      prepare: (context) => this.prepareScope(context),
      batch: (run) => this.bindingBatch(run),
      own: (stop) => this.ownBinding(stop),
      bind: (id, source, rules, global) => this.bindSource(this.context, id, source, rules, global),
    });
    this.plugins = new PluginRegistry((record) => this.createPluginApi(record));

    for (const registration of options.actions ?? []) {
      this.registerNavigationAction(registration.id, registration.handler);
    }

    this.detachGlobal =
      options.globalKey === false ||
      typeof globalThis === 'undefined' ||
      typeof (globalThis as { window?: unknown }).window === 'undefined'
        ? () => undefined
        : attachGlobal(this, options.globalKey ?? '__ROUTER_PLUS__');
    const initialRestore = options.initialSnapshot
      ? this.state.restore(options.initialSnapshot.state, this.context)
      : Promise.resolve();
    this.ready = Promise.all([initialRestore, this.installInitialPlugins()]).then(() => undefined);
    if (options.hmr) {
      options.hmr.dispose(() => {
        void this.dispose().catch((error: unknown) => this.bindingDiagnostic(error, 'hmr.dispose'));
      });
    }
  }

  private async installInitialPlugins(): Promise<void> {
    const plugins = this.options.plugins ?? [];
    if (plugins.length === 0) return;
    try {
      await this.plugins.installMany(plugins);
    } catch (error) {
      this.pluginFailure = toErrorMessage(error);
    }
  }

  private notReady(): CommandResult | null {
    if (this.disposed) return { ok: false, reason: 'cancelled', message: 'Router Plus disposed' };
    if (this.pluginFailure) return { ok: false, reason: 'not-ready', message: this.pluginFailure };
    if (this.pendingPlugins.size || !this.plugins.ready)
      return { ok: false, reason: 'not-ready', message: '插件仍在安装' };
    return null;
  }

  private definitionOf(pageId: string | null): PageDefinition | undefined {
    return pageId ? this.catalog.byId.get(pageId) : undefined;
  }

  private resolveContext() {
    return {
      origin: this.options.origin,
      runtime: this.catalog,
      registry: this.links,
      pageLink: this.options.pageLink,
      matcher: this.matcher,
      location: this.location,
    };
  }

  private createPluginApi(record: (dispose: () => void) => void): RouterPlusPluginApi {
    let guardOrder = this.globalGuards.length;
    return {
      registerLinkProtocol: (protocol) => {
        record(this.links.register(protocol));
      },
      registerStateAdapter: (name, adapter) => {
        if (this.stateAdapters.has(name))
          throw new Error(`State adapter already registered: ${name}`);
        this.stateAdapters.set(name, adapter);
        record(() => {
          if (this.stateAdapters.get(name) === adapter) this.stateAdapters.delete(name);
        });
      },
      registerGuard: (guard, options) => {
        if (this.globalGuards.some((entry) => entry.guard.id === guard.id)) {
          throw new Error(`Guard already registered: ${guard.id}`);
        }
        const entry: GuardEntry = { guard, priority: options?.priority ?? 0, order: guardOrder++ };
        this.globalGuards.push(entry);
        this.globalGuards.sort(
          (left, right) => right.priority - left.priority || left.order - right.order,
        );
        record(() => {
          const index = this.globalGuards.indexOf(entry);
          if (index >= 0) this.globalGuards.splice(index, 1);
        });
      },
      registerRetentionStrategy: (strategy) => {
        if (this.retentionStrategies.some((item) => item.id === strategy.id)) {
          throw new Error(`Retention strategy already registered: ${strategy.id}`);
        }
        this.retentionStrategies.push(strategy);
        record(() => {
          const index = this.retentionStrategies.indexOf(strategy);
          if (index >= 0) this.retentionStrategies.splice(index, 1);
        });
      },
      registerInstanceKeyStrategy: (name, strategy) => {
        if (this.instanceKeyStrategies.has(name))
          throw new Error(`Instance key strategy already registered: ${name}`);
        this.instanceKeyStrategies.set(name, strategy);
        record(() => {
          if (this.instanceKeyStrategies.get(name) === strategy)
            this.instanceKeyStrategies.delete(name);
        });
      },
      registerTargetResolver: (kind: string, resolver: TargetResolver) => {
        record(this.interaction.registerTargetResolver(kind, resolver));
      },
      registerRouteTransformer: (transformer) => {
        if (this.routeTransformers.some((item) => item.id === transformer.id))
          throw new Error(`Duplicate route transformer: ${transformer.id}`);
        this.routeTransformers.push(transformer);
        record(() => {
          const index = this.routeTransformers.indexOf(transformer);
          if (index >= 0) this.routeTransformers.splice(index, 1);
        });
      },
      registerHighlightRenderer: (renderer, root) => {
        if (this.highlightRenderers.length)
          throw new Error('Highlight renderer already registered');
        const target = root ?? (typeof document !== 'undefined' ? document.body : undefined);
        if (!target) throw new Error('A renderer requires a DOM root');
        let mounted = false;
        let stop = () => {};
        record(() => {
          stop();
          const index = this.highlightRenderers.indexOf(renderer);
          if (index >= 0) this.highlightRenderers.splice(index, 1);
          this.bus.emit({ type: 'renderer', custom: false });
          if (mounted) renderer.destroy();
        });
        // Rollback also owns resources allocated before a mount callback throws.
        mounted = true;
        renderer.mount(target);
        this.highlightRenderers.push(renderer);
        renderer.render(this.interaction.getHighlight());
        stop = this.bus.subscribe((event) => {
          if (event.type === 'highlight') renderer.render(event.state);
        });
        this.bus.emit({ type: 'renderer', custom: true });
      },
      registerNavigationAction: (id, handler) => {
        record(this.registerNavigationAction(id, handler));
      },
      registerScrollStrategy: (strategy: ScrollStrategy) => {
        record(this.interaction.registerScrollStrategy(strategy));
      },
      registerTargetRuntime: (runtime: TargetRuntime) => {
        this.interaction.setTargetRuntime(runtime);
        record(() => this.interaction.setTargetRuntime(null));
      },
    };
  }

  get hasCustomRenderer(): boolean {
    return this.highlightRenderers.length > 0;
  }

  get connected(): boolean {
    return this.connection !== null;
  }

  get pages() {
    return this.catalog.catalog;
  }

  connect(connection: RouterConnection): () => void {
    this.disconnect();
    this.connection = connection;
    if (connection.matcher) {
      this.matcher = connection.matcher;
      this.catalog.setMatcher(this.matcher);
    }
    this.stopInterception =
      connection.intercept?.((target) => this.checkNativeTransition(target)) ?? null;
    this.unsubscribeConnection = connection.subscribe((change) => this.handleChange(change));
    this.applyLocation(normalizeLocation(connection.initial), true, 'initial', false);
    return () => {
      if (this.connection === connection) this.disconnect();
    };
  }

  disconnect(): void {
    const cleanups = [this.stopInterception, this.unsubscribeConnection];
    // Clear ownership before invoking user callbacks, which may throw or reenter disconnect.
    this.stopInterception = null;
    this.unsubscribeConnection = null;
    this.connection = null;
    for (const cleanup of cleanups) {
      try {
        cleanup?.();
      } catch (error) {
        this.bindingDiagnostic(error, 'connection.cleanup');
      }
    }
  }

  reportLocation(location: RouterLocation): void {
    this.handleChange({ location: normalizeLocation(location), source: 'native' });
  }

  private handleChange(change: import('./types.js').CommittedChange): void {
    const signature = this.signatureOf(change.location);
    if (signature === this.lastSignature) return;
    this.applyLocation(
      { ...change.location, navigationId: change.navigationId ?? change.location.navigationId },
      true,
      change.source,
      change.source !== 'plus' && !change.navigationId && !change.location.navigationId,
    );
    const operation = change.navigationId ?? change.location.navigationId;
    if (operation && this.observedNavigations.has(operation))
      this.observedNavigations.set(operation, this.context);
  }

  private readonly bindingFrames: Map<string | (() => void), () => void>[] = [];
  private readonly pendingBindingSources = new Set<PageStateBridge>();
  private readonly bindingCleanups = new Set<() => void>();

  /** Defer observations and restoration until the complete registration is installed. */
  private deferBinding(effect: () => void, key?: string): void {
    const frame = this.bindingFrames.at(-1);
    if (frame) frame.set(key ?? effect, effect);
    else effect();
  }
  private bindingBatch(run: () => void): void {
    if (this.disposed) throw new Error('Router Plus disposed');
    const effects = new Map<string | (() => void), () => void>();
    this.bindingFrames.push(effects);
    try {
      run();
    } catch (error) {
      this.bindingFrames.pop();
      if (!this.bindingFrames.length) this.pendingBindingSources.clear();
      throw error;
    }
    if (this.bindingFrames.length > 1) {
      this.bindingFrames.pop();
      for (const [key, effect] of effects) this.bindingFrames.at(-1)!.set(key, effect);
    } else {
      this.pendingBindingSources.clear();
      try {
        // Keep the committing frame visible: address rebuilding can replace queued restores.
        while (effects.size) {
          const [key, effect] = effects.entries().next().value!;
          effects.delete(key);
          effect();
        }
      } finally {
        this.bindingFrames.pop();
      }
    }
  }
  private bindingDiagnostic(error: unknown, stage: string): void {
    try {
      this.options.onDiagnostic?.(error, stage);
    } catch {
      /* A diagnostic sink cannot interrupt source cleanup. */
    }
  }
  private ownBinding(release: () => void): () => void {
    let cleanup: (() => void) | undefined = release;
    const stop = () => {
      const current = cleanup;
      cleanup = undefined;
      this.bindingCleanups.delete(stop);
      try {
        current?.();
      } catch (error) {
        this.bindingDiagnostic(error, 'state.cleanup');
      }
    };
    this.bindingCleanups.add(stop);
    return stop;
  }
  private bindSource(
    context: PageContext,
    id: string,
    source: PageStateBridge,
    rules: StateField,
    global: boolean,
  ): () => void {
    let stop: (() => void) | undefined;
    try {
      this.bindingBatch(() => {
        this.pendingBindingSources.add(source);
        stop = global
          ? this.bindGlobalSource(id, source, rules)
          : this.registerBridgeFor(context, id, source, rules);
      });
    } catch (error) {
      try {
        stop?.();
      } catch (cleanupError) {
        this.bindingDiagnostic(cleanupError, 'state.cleanup');
      }
      this.bindingDiagnostic(error, 'state.registration');
      throw error;
    }
    return this.ownBinding(stop!);
  }

  private readonly globalSources = new Map<
    string,
    {
      source: PageStateBridge;
      rules: StateField;
      stop?: () => void;
      restoring: boolean;
      published?: boolean;
    }
  >();

  /** Publish lifecycle metadata from the existing indexes, with no parallel source registry. */
  private sourceCommitted(source: PageStateBridge, context: PageContext): void {
    for (const [id, entry] of this.globalSources)
      if (entry.source === source && entry.published)
        this.bus.emit({
          type: 'state.committed',
          source: describeSource(id, source, entry.rules, null),
        });
    this.state.committed(source, context);
  }

  /** Global stores retain native ownership and live until this router is disposed. */
  private bindGlobalSource(id: string, source: PageStateBridge, rules: StateField): () => void {
    if (this.disposed) throw new Error('Router Plus disposed');
    if (this.globalSources.has(id)) throw new Error(`Duplicate global source: ${id}`);
    const entry = { source, rules, restoring: false } as {
      source: PageStateBridge;
      rules: StateField;
      stop?: () => void;
      restoring: boolean;
      published?: boolean;
    };
    if (queryKeys(id, rules).length && !source.write)
      throw new Error(`Readonly query source: ${id}`);
    const owned = queryKeys(id, rules);
    // Global query ownership also applies when there are no registered pages.
    for (const [key, existing] of this.globalSources)
      if (queryKeys(key, existing.rules).some((name) => owned.includes(name)))
        throw new Error(`Duplicate global query ownership: ${id}`);
    for (const definition of this.catalog.definitions) {
      if (Object.hasOwn(definition.states!, id))
        throw new Error(`Global source conflicts with page state: ${id}`);
      for (const [key, field] of Object.entries(definition.states!))
        if (queryKeys(key, field).some((name) => owned.includes(name)))
          throw new Error(`Duplicate global query ownership: ${id}`);
    }
    const stop = () => {
      if (this.globalSources.get(id) !== entry) return;
      this.globalSources.delete(id);
      for (const definition of this.catalog.definitions)
        if (queryKeys(id, rules).length)
          delete (definition.states as Record<string, StateField>)[id];
      try {
        entry.stop?.();
      } finally {
        if (entry.published)
          this.bus.emit({
            type: 'state.unregistered',
            source: describeSource(id, source, rules, null),
          });
      }
    };
    this.globalSources.set(id, entry);
    let subscribing = true;
    try {
      if (queryKeys(id, rules).length)
        for (const definition of this.catalog.definitions)
          Object.defineProperty(definition.states, id, {
            configurable: true,
            enumerable: true,
            value: { ...rules, navigation: true },
          });
      entry.stop = source.subscribe?.(() => {
        // Native onMount/initial notifications must not overwrite address restoration.
        const initializing = subscribing;
        this.deferBinding(() => {
          if (this.globalSources.get(id) !== entry) return;
          this.bus.emit({ type: 'state', context: this.context, key: id, value: source.read() });
          if (
            !initializing &&
            !entry.restoring &&
            queryKeys(id, rules).length &&
            !sameQueryState(id, rules, source.read(), this.context.values[id])
          )
            void this.setState(source.read(), id).then((result) => {
              if (!result.ok)
                this.bindingDiagnostic(
                  new Error(`Global source sync failed: ${id}: ${result.reason}`),
                  'state.global',
                );
            });
        });
      });
      subscribing = false;
      this.deferBinding(() => {
        if (this.globalSources.get(id) !== entry) return;
        entry.published = true;
        this.bus.emit({
          type: 'state.registered',
          source: describeSource(id, source, rules, null),
        });
      });
      if (this.context.instance)
        this.deferBinding(
          () => this.applyLocation(this.location, false, 'native', false),
          'address',
        );
      return stop;
    } catch (error) {
      stop();
      throw error;
    }
  }

  private async syncGlobalSources(context: PageContext): Promise<void> {
    for (const [id, entry] of this.globalSources) {
      if (
        !entry.source.write ||
        !queryKeys(id, entry.rules).length ||
        sameQueryState(id, entry.rules, entry.source.read(), context.values[id])
      )
        continue;
      entry.restoring = true;
      try {
        await entry.source.write(
          restoreQuery(id, entry.rules, new URLSearchParams(context.search), entry.source.read()),
        );
      } catch (error) {
        // A failed native write from an unregistered source cannot poison a newer restore.
        if (!this.disposed && this.globalSources.get(id) === entry) throw error;
      } finally {
        entry.restoring = false;
      }
    }
  }

  private readonly stateRestores = new Set<Promise<void>>();
  private readonly stateRestoreFailures = new Map<string, unknown>();

  private scheduleStateRestore(context: PageContext): void {
    this.deferBinding(() => this.runStateRestore(context), `restore:${context.instance!.stateKey}`);
  }

  private runStateRestore(context: PageContext): void {
    const key = context.instance!.stateKey;
    const task = this.state
      .syncNavigation(context)
      .then(() => this.syncGlobalSources(context))
      .then(() => {
        this.stateRestoreFailures.delete(key);
      })
      .catch((error) => {
        this.stateRestoreFailures.set(key, error);
        this.bindingDiagnostic(error, 'state.navigation.restore');
      })
      .finally(() => this.stateRestores.delete(task));
    this.stateRestores.add(task);
  }

  private readonly historySignatures = new WeakMap<object, number>();
  private historySignatureSequence = 0;

  private diagnoseStateQuery(context: PageContext): void {
    const query = new URLSearchParams(context.search);
    for (const [id, field] of Object.entries(stateFields(this.definitionOf(context.pageId)))) {
      if (!queryKeys(id, field).some((key) => query.has(key))) continue;
      try {
        const value = decodeQuery(id, field, query);
        if (!validState(field, value))
          throw Object.assign(new Error(`Invalid query state: ${id}`), {
            category: 'state.query.invalid',
            allowed: field.values,
            actual: Object.fromEntries(queryKeys(id, field).map((key) => [key, query.getAll(key)])),
          });
      } catch (error) {
        this.bindingDiagnostic(error, 'state.query.decode');
      }
    }
  }

  private signatureOf(location: RouterLocation): string {
    const record =
      typeof location.state === 'object' && location.state !== null
        ? (location.state as Record<string, unknown>)[this.historyStateKey]
        : undefined;
    let identity = 0;
    if (record && typeof record === 'object') {
      identity = this.historySignatures.get(record) ?? ++this.historySignatureSequence;
      this.historySignatures.set(record, identity);
    }
    return `${location.revision ?? ''}|${location.navigationId ?? ''}|${location.pathname}|${location.search}|${location.hash}|${location.entryKey ?? ''}|${identity}`;
  }

  private applyLocation(
    raw: RouterLocation,
    emitLocation: boolean,
    _source: import('./types.js').CommittedChange['source'],
    emitNavigation: boolean,
  ): void {
    const location = normalizeLocation(raw);
    const signature = this.signatureOf(location);
    if (signature === this.lastSignature && emitLocation) return;
    const previous = this.context;
    const previousInstance = previous.instance;
    this.lastSignature = signature;
    this.location = location;
    this.historyRecord = readHistoryState(location.state, this.historyStateKey);
    this.context = buildPageContext(
      location,
      this.catalog,
      this.matcher,
      this.options.pageLink,
      this.historyRecord,
      this.instanceKeyStrategies,
    );
    this.diagnoseStateQuery(this.context);
    const bound = this.context.instance
      ? this.scopes.get(this.context.instance.stateKey)
      : undefined;
    if (bound) bound.context = this.context;
    this.state.updateContext(this.context);
    if (this.context.instance) this.scheduleStateRestore(this.context);
    this.manageRetention(previousInstance);
    if (previousInstance?.stateKey !== this.context.instance?.stateKey) {
      try {
        if (previousInstance && this.isRetained(previousInstance))
          this.definitionOf(previousInstance.pageId)?.guards?.onRetain?.(previous);
        if (this.context.instance?.retained)
          this.definitionOf(this.context.pageId)?.guards?.onRestore?.(this.context);
      } catch (error) {
        this.bindingDiagnostic(error, 'instance.lifecycle');
      }
    }
    if (previousInstance?.stateKey !== this.context.instance?.stateKey) {
      if (previousInstance)
        for (const host of this.hosts.get(previousInstance.stateKey) ?? [])
          this.scheduleHost(host, () => host.deactivate?.());
      if (this.context.instance)
        for (const host of this.hosts.get(this.context.instance.stateKey) ?? [])
          this.scheduleHost(host, () => host.activate?.());
    }
    if (emitLocation) this.bus.emit({ type: 'location', context: this.context });
    const end = this.shouldEndInteraction(previous, this.context);
    this.interaction.handleNavigation(this.context, end);
    if (emitNavigation) {
      const result: NavigationResult = {
        status: 'committed',
        navigationId: location.navigationId ?? '',
        location,
        context: this.context,
      };
      this.bus.emit({ type: 'navigation', from: previous, to: this.context, result });
    }
  }

  private shouldEndInteraction(previous: PageContext, next: PageContext): boolean {
    const policy = this.options.interactionOnNavigation ?? 'end';
    if (policy === 'keep') return false;
    if (typeof policy === 'function') return policy(next);
    return (
      previous.pathname !== next.pathname || previous.instance?.stateKey !== next.instance?.stateKey
    );
  }

  private manageRetention(previousInstance: PageInstance | null): void {
    const next = this.context.instance;
    if (next) {
      const definition = this.definitionOf(next.pageId);
      if (definition?.retain) {
        const retained = this.retention
          .list(next.pageId)
          .find((item) => item.instanceKey === next.instanceKey);
        if (!retained) {
          const instance = { ...next, retained: true };
          this.retention.add(instance);
          this.bus.emit({ type: 'retain', instance });
        } else {
          this.retention.touch(next);
        }
        this.context = { ...this.context, instance: { ...next, retained: true } };
        const release = new Map<string, PageInstance>();
        if (typeof definition.retain === 'object') {
          for (const instance of this.retention.decide(definition, { ...next, retained: true })) {
            release.set(instance.instanceKey, instance);
          }
        }
        for (const strategy of this.retentionStrategies) {
          for (const key of strategy.decide(this.retention.list(next.pageId), {
            ...next,
            retained: true,
          })) {
            const instance = this.retention
              .list(next.pageId)
              .find((item) => item.instanceKey === key);
            if (instance) release.set(instance.instanceKey, instance);
          }
        }
        for (const instance of release.values()) {
          if (instance.instanceKey !== next.instanceKey) this.releaseInstance(instance);
        }
      }
    }
    if (
      previousInstance &&
      previousInstance.stateKey !== next?.stateKey &&
      !this.isRetained(previousInstance)
    ) {
      this.releaseInstance(previousInstance);
    }
  }

  private isRetained(instance: PageInstance): boolean {
    return this.retention
      .list(instance.pageId)
      .some((item) => item.instanceKey === instance.instanceKey);
  }

  private releaseInstance(instance: PageInstance): void {
    this.retention.remove(instance);
    this.state.disposeInstance(instance);
    this.stateRestoreFailures.delete(instance.stateKey);
    const scope = this.scopes.get(instance.stateKey);
    if (scope) scope.alive = false;
    this.scopes.delete(instance.stateKey);
    this.interaction.releaseScope(instance.stateKey);
    const hosts = this.hosts.get(instance.stateKey);
    if (hosts) {
      for (const host of hosts) {
        try {
          this.scheduleHost(host, async () => {
            await host.deactivate?.();
            await host.dispose?.();
          });
        } catch {
          // Host cleanup failures must not block the release event.
        }
      }
      hosts.clear();
      this.hosts.delete(instance.stateKey);
    }
    this.bus.emit({ type: 'release', instance });
  }

  execute(command: RouterCommand): Promise<CommandResult>;
  execute(
    commands: readonly RouterCommand[],
    options?: CommandSequenceOptions,
  ): Promise<CommandSequenceResult>;
  async execute(
    command: RouterCommand | readonly RouterCommand[],
    options?: CommandSequenceOptions,
  ): Promise<CommandResult | CommandSequenceResult> {
    if (Array.isArray(command)) return this.sequence(this, command, options);
    const notReady = this.notReady();
    if (notReady) return notReady;
    return dispatchCommand(this, command as RouterCommand);
  }

  /** Resolve longest installed parent IDs for Store field paths; entries own identity. */
  private sequenceSource(facade: RouterPlus, id: string): SequenceSource | undefined {
    const descriptors = facade.inspectState();
    const descriptor =
      descriptors.find((item) => item.id === id) ??
      descriptors
        .filter((item) => id.startsWith(`${item.id}/`))
        .sort((a, b) => b.id.length - a.id.length)[0];
    if (!descriptor) return;
    if (descriptor.scope === 'global') {
      const entry = this.globalSources.get(descriptor.id);
      if (entry?.published) return { identity: entry, bridge: entry.source };
    } else {
      const entry = this.state.source(descriptor.id, facade.getContext());
      if (entry) return { identity: entry, bridge: entry.bridge };
    }
  }

  /** Keep grouped execution on the same command table and installed-source indexes. */
  private sequence(
    facade: RouterPlus,
    commands: readonly RouterCommand[],
    options?: CommandSequenceOptions,
  ) {
    return executeSequence(
      facade,
      commands,
      options,
      (owner, id) => this.sequenceSource(owner, id),
      () => this.disposed,
      (listener) => this.bus.subscribe(listener),
      () => this.context.instance?.stateKey,
      () => this.scope(this.context),
    );
  }

  async use(plugin: RouterPlusPlugin): Promise<void> {
    if (this.disposed) throw new Error('Router Plus disposed');
    const task = this.pluginQueue.then(async () => {
      await this.ready;
      if (this.disposed || this.pluginFailure)
        throw new Error(this.pluginFailure ?? 'Router Plus disposed');
      await this.plugins.install(plugin);
    });
    this.pluginQueue = task.catch(() => undefined);
    this.pendingPlugins.add(task);
    try {
      await task;
    } finally {
      this.pendingPlugins.delete(task);
    }
  }

  async unuse(id: string, options: { readonly cascade?: boolean } = {}): Promise<void> {
    const task = this.pluginQueue.then(async () => {
      await this.ready;
      await this.plugins.uninstall(id, options.cascade ?? false);
    });
    this.pluginQueue = task.catch(() => undefined);
    this.pendingPlugins.add(task);
    try {
      await task;
    } finally {
      this.pendingPlugins.delete(task);
    }
  }

  registerGuard(guard: GlobalGuard, options: { readonly priority?: number } = {}): () => void {
    if (this.globalGuards.some((entry) => entry.guard.id === guard.id)) {
      throw new Error(`Guard already registered: ${guard.id}`);
    }
    const entry: GuardEntry = {
      guard,
      priority: options.priority ?? 0,
      order: this.globalGuards.length,
    };
    this.globalGuards.push(entry);
    this.globalGuards.sort(
      (left, right) => right.priority - left.priority || left.order - right.order,
    );
    return () => {
      const index = this.globalGuards.indexOf(entry);
      if (index >= 0) this.globalGuards.splice(index, 1);
    };
  }

  private resolveOrFailure(
    target: LinkTarget,
  ): { resolution: LinkResolution } | { failure: CommandResult } {
    const outcome = resolveLinkTarget(target, this.resolveContext());
    if (!outcome.ok) {
      return { failure: { ok: false, reason: outcome.reason, message: outcome.message } };
    }
    return { resolution: outcome.resolution };
  }

  resolveLink(target: LinkTarget): LinkResolution | null {
    const outcome = resolveLinkTarget(target, this.resolveContext());
    return outcome.ok ? outcome.resolution : null;
  }

  resolveTarget(target: PageTarget): NavigationPlan | null {
    const outcome = resolveLinkTarget(target, this.resolveContext());
    if (!outcome.ok || outcome.resolution.kind === 'action') return null;
    return outcome.resolution;
  }

  resolveHref(target: PageTarget): string | null {
    const plan = this.resolveTarget(target);
    return plan?.kind === 'page' ? plan.href : null;
  }

  match(pathname: string): PageMatch | null {
    return this.catalog.catalog.byPath(pathname);
  }

  private openExternal(href: string): void {
    const opener =
      this.options.openExternal ??
      ((value: string) => {
        const scope = globalThis as unknown as {
          window?: { open?: (url: string, target?: string, features?: string) => unknown };
        };
        scope.window?.open?.(value, '_blank', 'noopener,noreferrer');
      });
    try {
      opener(href);
    } catch {
      // Opening an external address is best effort; the command still reports the plan.
    }
  }

  async navigate(target: PageTarget, options: NavigateOptions = {}): Promise<CommandResult> {
    const notReady = this.notReady();
    if (notReady) return notReady;
    const resolved = this.resolveOrFailure(target);
    if ('failure' in resolved) return resolved.failure;
    const resolution = resolved.resolution;
    if (resolution.kind === 'action')
      return this.executeAction(resolution.actionId, resolution.payload);
    if (resolution.kind === 'external') {
      this.openExternal(resolution.href);
      return { ok: true, value: { external: true, href: resolution.href } };
    }
    return this.performNavigation(resolution, options, 'push');
  }

  async replace(target: PageTarget, options: NavigateOptions = {}): Promise<CommandResult> {
    return this.navigate(target, { ...options, replace: true });
  }

  private async performNavigation(
    plan: Extract<NavigationPlan, { kind: 'page' }>,
    options: NavigateOptions,
    mode: 'push' | 'replace',
    source?: () => PageContext,
  ): Promise<CommandResult> {
    if (!this.connection)
      return { ok: false, reason: 'not-connected', message: '尚未连接导航端口' };
    const previous = this.options.navigationStrategy === 'serial' ? this.running : null;
    const controller = new AbortController();
    if (this.options.navigationStrategy !== 'serial') {
      this.activeController?.abort(new Error('Navigation superseded'));
    }
    this.activeController = controller;
    const navigationId = createNavigationId();
    this.observedNavigations.set(navigationId, null);
    const task = previous
      ? previous.then(
          () => this.runNavigation(navigationId, plan, options, mode, controller.signal, source),
          () => this.runNavigation(navigationId, plan, options, mode, controller.signal, source),
        )
      : this.runNavigation(navigationId, plan, options, mode, controller.signal, source);
    let tracked: Promise<CommandResult>;
    tracked = task.finally(() => {
      this.observedNavigations.delete(navigationId);
      if (this.activeController === controller) this.activeController = null;
      if (this.running === tracked) this.running = null;
    });
    this.running = tracked;
    return tracked;
  }

  private async runNavigation(
    navigationId: string,
    initialPlan: Extract<NavigationPlan, { kind: 'page' }>,
    options: NavigateOptions,
    mode: 'push' | 'replace',
    signal: AbortSignal,
    source?: () => PageContext,
  ): Promise<CommandResult> {
    let from: PageContext;
    try {
      from = source ? source() : this.context;
    } catch {
      return { ok: false, reason: 'cancelled', navigationId, committed: false };
    }
    const fromDefinition = this.definitionOf(from.pageId);
    try {
      const leave = await runGuardList(
        this.globalGuards.map((entry) => entry.guard),
        fromDefinition,
        'beforeLeave',
        from,
        signal,
      );
      if (leave.kind === 'block') {
        return {
          ok: false,
          reason: 'blocked',
          message: leave.message,
          stage: 'beforeLeave',
          committed: false,
          navigationId,
        };
      }
      if (leave.kind === 'redirect') {
        // A redirect from a leave guard is treated as replacing the requested target.
        const resolved = this.resolveOrFailure(leave.target);
        if ('failure' in resolved) return resolved.failure;
        if (resolved.resolution.kind === 'external') {
          this.openExternal(resolved.resolution.href);
          return { ok: true, value: { external: true, href: resolved.resolution.href } };
        }
        if (resolved.resolution.kind === 'action') {
          return this.executeAction(resolved.resolution.actionId, resolved.resolution.payload);
        }
        initialPlan = resolved.resolution;
      }

      let plan = initialPlan;
      let toContext = contextForPlan(
        plan,
        this.catalog,
        this.matcher,
        this.options.pageLink,
        this.location,
        this.instanceKeyStrategies,
        plan.tab,
        plan.values,
      );
      let redirects = 0;
      for (;;) {
        signal.throwIfAborted();
        const toDefinition = this.definitionOf(toContext.pageId);
        const enter = await runGuardList(
          this.globalGuards.map((entry) => entry.guard),
          toDefinition,
          'beforeEnter',
          toContext,
          signal,
        );
        if (enter.kind === 'block') {
          return {
            ok: false,
            reason: 'blocked',
            message: enter.message,
            stage: 'beforeEnter',
            committed: false,
            navigationId,
          };
        }
        if (enter.kind === 'allow') break;
        redirects += 1;
        if (redirects > 5) {
          return {
            ok: false,
            reason: 'failed',
            message: '重定向次数过多',
            stage: 'beforeEnter',
            committed: false,
            navigationId,
          };
        }
        const resolved = this.resolveOrFailure(enter.target);
        if ('failure' in resolved) return resolved.failure;
        if (resolved.resolution.kind === 'external') {
          this.openExternal(resolved.resolution.href);
          return { ok: true, value: { external: true, href: resolved.resolution.href } };
        }
        if (resolved.resolution.kind === 'action') {
          return this.executeAction(resolved.resolution.actionId, resolved.resolution.payload);
        }
        plan = resolved.resolution;
        toContext = contextForPlan(
          plan,
          this.catalog,
          this.matcher,
          this.options.pageLink,
          this.location,
          this.instanceKeyStrategies,
          plan.tab,
          plan.values,
        );
      }

      const parts = splitHref(plan.href);
      const instance = toContext.instance;
      const record: HistoryRecord = {
        version: 1,
        pageId: toContext.pageId,
        path: parts.pathname,
        instanceKey: instance?.instanceKey ?? '',
        stateKey: instance?.stateKey ?? '',
        historyKey: instance?.historyKey ?? '',
        tab: toContext.tab,
        values: Object.fromEntries(
          Object.entries(toContext.values).filter(
            ([id]) => !queryKeys(id, stateFields(this.definitionOf(toContext.pageId))[id]).length,
          ),
        ),
      };
      const stateValue = options.state !== undefined ? options.state : plan.state;
      const historyState = writeHistoryState(stateValue, record, this.historyStateKey);
      const replace = mode === 'replace' || options.replace === true || plan.replace === true;
      const requestOptions: NavigateOptions = { ...options, replace };
      signal.throwIfAborted();
      const receipt = await this.connection!.commit({
        navigationId,
        href: plan.href,
        path: parts.pathname,
        tab: plan.tab,
        state: historyState,
        options: requestOptions,
        signal,
      });
      if (signal.aborted && receipt.status !== 'committed') {
        return {
          ok: false,
          reason: 'cancelled',
          message: '导航已取消',
          navigationId,
          committed: false,
        };
      }
      if (receipt.status === 'blocked') {
        return {
          ok: false,
          reason: 'blocked',
          message: receipt.message,
          stage: 'commit',
          committed: false,
          navigationId,
        };
      }
      if (receipt.status === 'cancelled') {
        return {
          ok: false,
          reason: 'cancelled',
          message: receipt.message,
          navigationId,
          committed: false,
        };
      }
      if (receipt.status === 'failed') {
        return {
          ok: false,
          reason: 'failed',
          message: receipt.message ?? (receipt.error ? toErrorMessage(receipt.error) : undefined),
          navigationId,
          committed: false,
        };
      }
      if (receipt.status === 'noop') {
        return {
          ok: false,
          reason: 'noop',
          message: receipt.message ?? '历史没有移动',
          navigationId,
          committed: false,
        };
      }

      const committedLocation = normalizeLocation(
        receipt.location ?? {
          pathname: parts.pathname,
          search: parts.search,
          hash: parts.hash,
          state: historyState,
          navigationId,
          action: replace ? 'replace' : 'push',
        },
      );
      const observed = this.observedNavigations.get(navigationId);
      const alreadyApplied =
        Boolean(observed) ||
        (this.location.navigationId === navigationId &&
          this.location.pathname === committedLocation.pathname &&
          this.location.search === committedLocation.search &&
          this.location.hash === committedLocation.hash);
      if (!alreadyApplied) this.applyLocation(committedLocation, true, 'plus', false);
      const committedContext = observed ?? this.context;
      await Promise.all(this.stateRestores);
      const restoreError = committedContext.instance
        ? this.stateRestoreFailures.get(committedContext.instance.stateKey)
        : undefined;
      if (restoreError)
        return {
          ok: false,
          reason: 'failed',
          message: toErrorMessage(restoreError),
          navigationId,
          committed: true,
        };
      if (signal.aborted) return { ok: false, reason: 'cancelled', navigationId, committed: true };

      const result: NavigationResult = {
        status: 'committed',
        navigationId,
        location: committedContext.location,
        context: committedContext,
        redirected: redirects > 0,
      };
      this.bus.emit({ type: 'navigation', from, to: committedContext, result });

      const targetDefinition = this.definitionOf(committedContext.pageId);
      if (targetDefinition?.guards?.afterEnter) {
        try {
          await targetDefinition.guards.afterEnter({
            context: committedContext,
            page: targetDefinition,
            signal,
          });
        } catch (error) {
          return {
            ok: false,
            reason: 'failed',
            message: toErrorMessage(error),
            stage: 'afterEnter',
            committed: true,
            navigationId,
          };
        }
      }
      return { ok: true, value: result };
    } catch (error) {
      if (signal.aborted) {
        return {
          ok: false,
          reason: 'cancelled',
          message: '导航已取消',
          navigationId,
          committed: false,
        };
      }
      return {
        ok: false,
        reason: 'failed',
        message: toErrorMessage(error),
        navigationId,
        committed: false,
      };
    }
  }

  private async traversed(
    label: string,
    action:
      | ((
          connection: RouterConnection,
        ) => Promise<import('./types.js').CommitResult> | import('./types.js').CommitResult)
      | undefined,
  ): Promise<CommandResult> {
    if (!this.connection)
      return { ok: false, reason: 'not-connected', message: '尚未连接导航端口' };
    if (!action)
      return { ok: false, reason: 'unsupported-command', message: `连接不支持 ${label}` };
    const navigationId = createNavigationId();
    try {
      const receipt = await action(this.connection);
      if (receipt.status === 'committed') {
        if (!receipt.location)
          return {
            ok: false,
            reason: 'noop',
            message: '连接未返回地址回执',
            navigationId,
            committed: false,
          };
        if (this.signatureOf(receipt.location) !== this.lastSignature)
          this.applyLocation(receipt.location, true, 'traversal', true);
        return { ok: true, value: { ...receipt, navigationId } };
      }
      if (receipt.status === 'noop') {
        return {
          ok: false,
          reason: 'noop',
          message: receipt.message ?? '历史没有移动',
          navigationId,
          committed: false,
        };
      }
      if (receipt.status === 'blocked') {
        return {
          ok: false,
          reason: 'blocked',
          message: receipt.message,
          navigationId,
          committed: false,
        };
      }
      if (receipt.status === 'cancelled') {
        return {
          ok: false,
          reason: 'cancelled',
          message: receipt.message,
          navigationId,
          committed: false,
        };
      }
      return {
        ok: false,
        reason: 'failed',
        message: receipt.message ?? (receipt.error ? toErrorMessage(receipt.error) : undefined),
        navigationId,
        committed: false,
      };
    } catch (error) {
      return {
        ok: false,
        reason: 'failed',
        message: toErrorMessage(error),
        navigationId,
        committed: false,
      };
    }
  }

  async back(): Promise<CommandResult> {
    return this.traversed(
      'back',
      (connection) => connection.back?.() ?? { status: 'failed', message: '连接不支持 back' },
    );
  }

  async forward(): Promise<CommandResult> {
    return this.traversed(
      'forward',
      (connection) => connection.forward?.() ?? { status: 'failed', message: '连接不支持 forward' },
    );
  }

  async go(delta: number): Promise<CommandResult> {
    return this.traversed(
      'go',
      (connection) => connection.go?.(delta) ?? { status: 'failed', message: '连接不支持 go' },
    );
  }

  getContext(): PageContext {
    return this.context;
  }

  getInstance(): PageInstance | null {
    return this.context.instance;
  }

  private globalPath(id: string): { id: string; keys: string[] } | null {
    if (this.globalSources.has(id)) return { id, keys: [] };
    const parts = id.split('/');
    for (let end = parts.length - 1; end > 0; end--) {
      const prefix = parts.slice(0, end).join('/');
      if (this.globalSources.has(prefix)) return { id: prefix, keys: parts.slice(end) };
    }
    return null;
  }

  getState<T = unknown>(key = 'default'): T {
    try {
      const path = this.globalPath(key);
      if (path) {
        let value = this.globalSources.get(path.id)!.source.read();
        for (const part of path.keys) {
          if (!value || typeof value !== 'object' || !Object.hasOwn(value, part))
            return undefined as T;
          value = (value as Record<string, unknown>)[part];
        }
        return value as T;
      }
      return this.state.read<T>(key);
    } catch {
      return undefined as T;
    }
  }

  private readonly pendingStateValues = new Map<string, Map<string, { value: unknown }>>();

  /** Merge concurrent source changes before committing a single address projection. */
  private async navigateState(
    value: unknown,
    id: string,
    context: PageContext,
    facade: RouterPlus,
  ): Promise<CommandResult> {
    const global = this.globalSources.get(id),
      current = global
        ? () => !this.disposed && this.globalSources.get(id) === global
        : this.state.bridgeGuard(id, context);
    const scopeKey = context.instance!.stateKey;
    const pending = this.pendingStateValues.get(scopeKey) ?? new Map<string, { value: unknown }>();
    this.pendingStateValues.set(scopeKey, pending);
    const request = { value };
    pending.set(id, request);
    try {
      const values = { ...context.values, ...this.state.navigationValues(context) };
      for (const [key, source] of this.globalSources)
        if (queryKeys(key, source.rules).length && validState(source.rules, source.source.read()))
          values[key] = source.source.read();
      for (const [key, entry] of pending) values[key] = entry.value;
      const result = await facade.navigate(
        { path: context.path, values },
        { replace: true, state: context.location.state },
      );
      return current()
        ? result
        : {
            ok: false,
            reason: 'cancelled',
            navigationId: result.ok ? undefined : result.navigationId,
            committed: result.ok || result.committed,
          };
    } finally {
      if (pending.get(id) === request) pending.delete(id);
      if (!pending.size) this.pendingStateValues.delete(scopeKey);
    }
  }

  async setState(value: unknown, key = 'default'): Promise<CommandResult> {
    if (this.disposed) return { ok: false, reason: 'cancelled' };
    try {
      const path = this.globalPath(key);
      if (path?.keys.length) {
        const root = this.getState<Record<string, unknown>>(path.id);
        const update = (
          current: Record<string, unknown>,
          keys: string[],
        ): Record<string, unknown> => {
          const [head, ...tail] = keys;
          if (!Object.hasOwn(current, head)) throw new Error(`Unknown store field: ${key}`);
          return {
            ...current,
            [head]: tail.length ? update(current[head] as Record<string, unknown>, tail) : value,
          };
        };
        return this.setState(update(root, path.keys), path.id);
      }
      const global = this.globalSources.get(key);
      if (global && !validState(global.rules, value))
        return { ok: false, reason: 'invalid-target' };
      if (global && !queryKeys(key, global.rules).length) {
        if (!global.source.write) return { ok: false, reason: 'state-readonly' };
        try {
          await global.source.write(value);
          return this.globalSources.get(key) === global && !this.disposed
            ? { ok: true }
            : { ok: false, reason: 'cancelled' };
        } catch (error) {
          if (this.globalSources.get(key) !== global || this.disposed)
            return { ok: false, reason: 'cancelled' };
          this.bindingDiagnostic(error, 'state.write');
          return { ok: false, reason: 'failed', message: toErrorMessage(error) };
        }
      }
      if (
        stateFields(this.definitionOf(this.context.pageId))[key]?.navigation !== false &&
        Object.hasOwn(
          stateFields(this.definitionOf(this.context.pageId), this.options.pageLink?.tabKey),
          key,
        )
      )
        return await this.navigateState(value, key, this.context, this);
      return await this.state.write(value, key);
    } catch (error) {
      return { ok: false, reason: 'state-unknown', message: toErrorMessage(error) };
    }
  }

  async patchState(value: Record<string, unknown>, key = 'default'): Promise<CommandResult> {
    if (this.disposed) return { ok: false, reason: 'cancelled' };
    try {
      if (this.globalPath(key))
        return this.setState(
          { ...(this.getState<Record<string, unknown>>(key) ?? {}), ...value },
          key,
        );
      if (Object.hasOwn(stateFields(this.definitionOf(this.context.pageId)), key)) {
        const current = this.getState(key);
        return await this.setState({ ...(isPlainObject(current) ? current : {}), ...value }, key);
      }
      return await this.state.patch(value, key);
    } catch (error) {
      return { ok: false, reason: 'state-unknown', message: toErrorMessage(error) };
    }
  }

  async resetState(key = 'default'): Promise<CommandResult> {
    if (this.disposed) return { ok: false, reason: 'cancelled' };
    try {
      const global = this.globalSources.get(key);
      if (global) return this.setState(global.rules.default, key);
      const field = stateFields(this.definitionOf(this.context.pageId))[key];
      if (field) return await this.setState(field.default, key);
      return await this.state.reset(key);
    } catch (error) {
      return { ok: false, reason: 'state-unknown', message: toErrorMessage(error) };
    }
  }

  /** @internal Framework wrappers manage registration and cleanup. */
  registerStateBridge<S>(
    id: string,
    bridge: PageStateBridge<S>,
    options?: StateField<S>,
  ): () => void {
    return this.registerBridgeFor(this.context, id, bridge, options as StateField);
  }

  /** A registration may supply page-wide rules once; the source remains instance-bound. */
  private registerBridgeFor<S>(
    context: PageContext,
    id: string,
    bridge: PageStateBridge<S>,
    options?: StateField,
  ): () => void {
    if (this.disposed) throw new Error('Router Plus disposed');
    const definition = this.definitionOf(context.pageId);
    if (this.globalSources.has(id) || this.state.hasBridge(id, context))
      throw new Error(`Duplicate state source: ${id}`);
    if (options && queryKeys(id, options).length && !bridge.write)
      throw new Error(`Navigation state requires a writable bridge: ${id}`);
    const previous = definition?.states?.[id];
    if (options) {
      if (!definition?.states) throw new Error('State registration requires a page');
      const fields = definition.states as Record<string, StateField>;
      const existing = fields[id];
      if (existing && !sameState(existing, existing.default, options.default) && existing.catalog)
        options = { ...options, default: existing.default };
      if (!validState(options, options.default)) throw new Error(`Invalid default state: ${id}`);
      const owned = queryKeys(id, options);
      for (const [key, field] of Object.entries(fields))
        if (key !== id && queryKeys(key, field).some((name) => owned.includes(name)))
          throw new Error(`Duplicate query ownership: ${id}`);
      options = {
        ...options,
        catalog: existing?.catalog,
        navigation: (existing?.navigation !== false && Boolean(existing)) || owned.length > 0,
      };
      Object.defineProperty(fields, id, {
        enumerable: true,
        configurable: true,
        value: Object.freeze({
          ...options,
          values: options.values ? Object.freeze([...options.values]) : undefined,
        }),
      });
      this.deferBinding(() => this.applyLocation(this.location, false, 'native', false), 'address');
      context =
        context.instance?.stateKey === this.context.instance?.stateKey ? this.context : context;
    }
    const installed = definition?.states?.[id];
    let stop: () => void;
    try {
      stop = this.state.registerBridge(id, bridge as PageStateBridge, context, installed);
    } catch (error) {
      if (definition?.states?.[id] === installed) {
        if (previous)
          Object.defineProperty(definition!.states, id, {
            enumerable: true,
            configurable: true,
            value: previous,
          });
        else delete (definition!.states as Record<string, StateField>)[id];
      }
      throw error;
    }
    this.scheduleStateRestore(context);
    return () => {
      try {
        stop();
      } finally {
        if (definition && installed && definition.states?.[id] === installed) {
          if (previous?.catalog)
            Object.defineProperty(definition.states, id, {
              enumerable: true,
              configurable: true,
              value: previous,
            });
          else if (!this.state.hasPageBridge(context.pageId, id))
            delete (definition.states as Record<string, StateField>)[id];
        }
      }
    };
  }

  async callState(id: string, ...args: unknown[]): Promise<CommandResult> {
    if (this.disposed) return { ok: false, reason: 'cancelled' };
    const global = this.globalSources.get(id);
    if (!global) return this.state.call(id, args);
    if (!global.source.call) return { ok: false, reason: 'state-unsupported' };
    try {
      const value = await global.source.call(...args);
      return this.globalSources.get(id) === global && !this.disposed
        ? { ok: true, value }
        : { ok: false, reason: 'cancelled' };
    } catch (error) {
      if (this.globalSources.get(id) !== global || this.disposed)
        return { ok: false, reason: 'cancelled' };
      this.bindingDiagnostic(error, 'state.call');
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  /** Return frozen metadata for installed sources, without touching their live values.
   * @param id Optional exact registration ID; omitted to list the active facade's sources.
   * @returns A frozen list, one descriptor, or null for an unknown/unmounted ID.
   */
  inspectState(): readonly StateInspection[];
  inspectState(id: string): StateInspection | null;
  inspectState(id?: string): readonly StateInspection[] | StateInspection | null {
    return this.inspectSources(this.context, id);
  }
  private inspectSources(
    context: PageContext,
    id?: string,
  ): readonly StateInspection[] | StateInspection | null {
    const sources = this.disposed
      ? []
      : [
          ...[...this.globalSources]
            .filter(([, entry]) => !this.pendingBindingSources.has(entry.source))
            .map(([key, entry]) => describeSource(key, entry.source, entry.rules, null)),
          ...this.state.inspect(context, this.pendingBindingSources),
        ];
    return id === undefined
      ? Object.freeze(sources)
      : (sources.find((source) => source.id === id) ?? null);
  }

  listStateKeys(): readonly string[] {
    try {
      return [...new Set([...this.state.listKeys(), ...this.globalSources.keys()])];
    } catch {
      return [...this.globalSources.keys()];
    }
  }

  getTab(): string | null {
    return typeof this.context.values.tab === 'string' ? this.getState<string>('tab') : null;
  }

  async setTab(tab: string): Promise<CommandResult> {
    if (!Object.hasOwn(stateFields(this.definitionOf(this.context.pageId)), 'tab'))
      return { ok: false, reason: 'invalid-tab' };
    return this.setState(tab, 'tab');
  }

  async retain(): Promise<CommandResult> {
    if (this.disposed) return { ok: false, reason: 'cancelled' };
    const instance = this.context.instance;
    if (!instance) return { ok: false, reason: 'state-unknown', message: '没有当前页面实例' };
    const retained = { ...instance, retained: true };
    this.retention.add(retained);
    this.context = { ...this.context, instance: retained };
    this.bus.emit({ type: 'retain', instance: retained });
    return { ok: true, value: retained };
  }

  async release(): Promise<CommandResult> {
    if (this.disposed) return { ok: false, reason: 'cancelled' };
    const instance = this.context.instance;
    if (!instance) return { ok: false, reason: 'state-unknown', message: '没有当前页面实例' };
    this.releaseInstance(instance);
    this.lastSignature = '';
    this.applyLocation(this.location, true, 'native', false);
    return { ok: true };
  }

  registerHost(host: InstanceHost, context = this.context): () => void {
    const instance = context.instance;
    if (!instance) throw new Error('Page instance is not available');
    const set = this.hosts.get(instance.stateKey) ?? new Set<InstanceHost>();
    set.add(host);
    this.hosts.set(instance.stateKey, set);
    this.scheduleHost(host, async () => {
      await host.mount?.();
      await this.state.ready(context);
      if (this.context.instance?.stateKey === instance.stateKey) await host.activate?.();
    });
    return () => {
      if (!set.delete(host)) return;
      if (!set.size) this.hosts.delete(instance.stateKey);
      this.scheduleHost(host, async () => {
        await host.deactivate?.();
        await host.dispose?.();
      });
    };
  }

  /** Serialize host transitions and retain cleanup errors as diagnostics. */
  private scheduleHost(host: InstanceHost, action: () => unknown): void {
    const previous = this.hostTasks.get(host) ?? Promise.resolve();
    const next = previous.then(action).catch((error) => this.bindingDiagnostic(error, 'host'));
    this.hostTasks.set(host, next);
    void next.finally(() => {
      if (this.hostTasks.get(host) === next) this.hostTasks.delete(host);
    });
  }

  /** Evaluate native transitions before their framework commits them. */
  private async checkNativeTransition(
    target: RouterLocation,
  ): Promise<import('./types.js').GuardResult> {
    const signal = new AbortController().signal;
    const next = buildPageContext(
      normalizeLocation(target),
      this.catalog,
      this.matcher,
      this.options.pageLink,
      readHistoryState(target.state, this.historyStateKey),
      this.instanceKeyStrategies,
    );
    for (const [phase, context] of [
      ['beforeLeave', this.context],
      ['beforeEnter', next],
    ] as const) {
      const outcome = await runGuardList(
        this.globalGuards.map((entry) => entry.guard),
        this.definitionOf(context.pageId),
        phase,
        context,
        signal,
      );
      if (outcome.kind === 'block') return false;
      if (outcome.kind === 'redirect') {
        const plan = this.resolveTarget(outcome.target);
        return plan?.kind === 'page' ? { redirect: plan.href } : false;
      }
    }
    return true;
  }

  /** Bind operations to a stable instance without mutating the router's active context. */
  scope(context = this.context): RouterPlus {
    const prepared = this.prepareScope(context);
    prepared.commit();
    return prepared.facade;
  }

  /** Candidate facades are weakly owned until a framework commits or scope() publishes them. */
  private prepareScope(context: PageContext): PreparedScope {
    const key = context.instance?.stateKey;
    if (!key) return { facade: this, commit() {} };
    const existing = this.scopes.get(key);
    if (existing) return { facade: existing.facade, commit() {} };
    let record = { context, alive: true, facade: null as unknown as RouterPlus };
    const live = () => {
      if (!record.alive) throw new Error('Page scope released');
      return record.context;
    };
    const stateCall = async (operation: () => Promise<CommandResult>): Promise<CommandResult> => {
      if (!record.alive) return { ok: false, reason: 'cancelled' };
      const pending = this.notReady();
      if (pending) return pending;
      return operation();
    };
    const overrides: Partial<RouterPlus> = {
      scope: (value) => (value ? this.scope(value) : record.facade),
      navigate: async (target, options) => {
        if (!record.alive) return { ok: false, reason: 'cancelled' };
        const readiness = this.notReady();
        if (readiness) return readiness;
        const outcome = resolveLinkTarget(target, {
          ...this.resolveContext(),
          location: live().location,
        });
        if (!outcome.ok)
          return Promise.resolve({ ok: false, reason: outcome.reason, message: outcome.message });
        const plan = outcome.resolution;
        if (plan.kind === 'action') return this.executeAction(plan.actionId, plan.payload, live());
        if (plan.kind === 'external') return this.navigate(plan.href, options);
        return this.performNavigation(plan, options ?? {}, 'push', live);
      },
      replace: (target, options) => record.facade.navigate(target, { ...options, replace: true }),
      executeAction: (id, payload) => stateCall(() => this.executeAction(id, payload, live())),
      callState: (id, ...args) =>
        stateCall(() =>
          this.globalSources.has(id)
            ? this.callState(id, ...args)
            : this.state.call(id, args, live()),
        ),
      inspectState: ((id?: string) =>
        record.alive
          ? this.inspectSources(record.context, id)
          : id === undefined
            ? Object.freeze([])
            : null) as RouterPlus['inspectState'],
      getContext: () => record.context,
      getInstance: () => record.context.instance,
      getState: <T>(name = 'default') =>
        this.globalPath(name) !== null ? this.getState<T>(name) : this.state.read<T>(name, live()),
      setState: (value, name = 'default') =>
        stateCall(() =>
          this.globalPath(name) !== null
            ? this.setState(value, name)
            : stateFields(this.definitionOf(live().pageId))[name]?.navigation !== false &&
                Object.hasOwn(stateFields(this.definitionOf(live().pageId)), name)
              ? this.navigateState(value, name, live(), record.facade)
              : this.state.write(value, name, live()),
        ),
      patchState: (value, name = 'default') =>
        stateCall(() =>
          this.globalPath(name)
            ? this.patchState(value, name)
            : Object.hasOwn(stateFields(this.definitionOf(live().pageId)), name)
              ? record.facade.setState(
                  {
                    ...(isPlainObject(record.facade.getState(name))
                      ? record.facade.getState<Record<string, unknown>>(name)
                      : {}),
                    ...value,
                  },
                  name,
                )
              : this.state.patch(value, name, live()),
        ),
      resetState: (name = 'default') =>
        stateCall(() => {
          if (this.globalPath(name)) return this.resetState(name);
          const field = stateFields(this.definitionOf(live().pageId))[name];
          return field
            ? record.facade.setState(field.default, name)
            : this.state.reset(name, live());
        }),
      listStateKeys: () => [
        ...new Set([...this.state.listKeys(live()), ...this.globalSources.keys()]),
      ],
      registerStateBridge: (name, bridge, options) =>
        this.registerBridgeFor(live(), name, bridge, options as StateField),
      registerHost: (host) => this.registerHost(host, live()),
      registerTarget: (id, resolve) => this.interaction.registerTarget(id, resolve, live()),
      unregisterTarget: (id) => this.interaction.unregisterTarget(id, live()),
      listTargets: () => this.interaction.listTargets(live()),
      registerGuard: (guard, options) =>
        this.registerGuard(
          {
            ...guard,
            id: JSON.stringify([key, guard.id]),
            beforeLeave: guard.beforeLeave
              ? (value) =>
                  value.instance?.stateKey === key && record.alive
                    ? guard.beforeLeave!(value)
                    : true
              : undefined,
            beforeEnter: guard.beforeEnter
              ? (value) =>
                  value.instance?.stateKey === key && record.alive
                    ? guard.beforeEnter!(value)
                    : true
              : undefined,
          },
          options,
        ),
      whenReady: async () => {
        await this.ready;
        await Promise.all(this.pendingPlugins);
        await this.state.ready(live());
        await Promise.all(this.hostTasks.values());
      },
      snapshot: async () => ({
        version: 1,
        location: live().location,
        state: await this.state.snapshot(live()),
      }),
      getTab: () =>
        typeof record.context.values.tab === 'string'
          ? record.facade.getState<string>('tab')
          : null,
      setTab: (tab) => record.facade.setState(tab, 'tab'),
      subscribe: (listener) =>
        this.bus.subscribe((event) => {
          if ('source' in event && event.source.scope === 'page' && event.source.stateKey !== key)
            return;
          if ('context' in event && event.context.instance?.stateKey !== key) return;
          listener(event);
        }),
      highlight: (target, options) =>
        stateCall(() => this.interaction.highlight(target, options, live())),
      focus: (target, options) => stateCall(() => this.interaction.focus(target, options, live())),
      scrollTo: (target, options) =>
        stateCall(() => this.interaction.scrollTo(target, options, live())),
      execute: ((
        command: RouterCommand | readonly RouterCommand[],
        options?: CommandSequenceOptions,
      ) =>
        Array.isArray(command)
          ? this.sequence(record.facade, command, options)
          : Promise.resolve(
              this.notReady() ??
                (record.alive
                  ? dispatchCommand(record.facade, command as RouterCommand)
                  : { ok: false, reason: 'cancelled' }),
            )) as RouterPlus['execute'],
    };
    record.facade = new Proxy(this as RouterPlus, {
      get: (target, prop) => {
        const custom = Reflect.get(overrides, prop);
        if (custom !== undefined) return custom;
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    const facade = record.facade;
    attachBindingHost(facade, {
      committed: (source) => {
        if (record.alive) this.sourceCommitted(source, record.context);
      },
      prepare: (context) => this.prepareScope(context),
      batch: (run) => this.bindingBatch(run),
      own: (stop) => this.ownBinding(stop),
      bind: (id, source, rules, global) => this.bindSource(live(), id, source, rules, global),
    });
    return {
      facade,
      commit: () => {
        if (this.disposed || !record.alive) {
          record.alive = false;
          return;
        }
        const active = this.scopes.get(key);
        if (active) record = active;
        else if (
          key === this.context.instance?.stateKey ||
          this.isRetained(record.context.instance!)
        ) {
          if (key === this.context.instance?.stateKey) record.context = this.context;
          this.scopes.set(key, record);
        } else record.alive = false;
      },
    };
  }

  async whenReady(): Promise<void> {
    await this.ready;
    await Promise.all(this.pendingPlugins);
    if (this.context.instance) await this.state.ready(this.context);
    await Promise.all(this.hostTasks.values());
    await Promise.all(this.stateRestores);
  }

  async snapshot(): Promise<import('./types.js').RouterSnapshot> {
    return {
      version: 1,
      location: this.location,
      state: this.context.instance ? await this.state.snapshot(this.context) : {},
    };
  }
  async restore(snapshot: import('./types.js').RouterSnapshot): Promise<void> {
    if (snapshot.version !== 1) throw new Error('Unsupported snapshot version');
    this.applyLocation(snapshot.location, true, 'initial', false);
    if (this.context.instance) await this.state.restore(snapshot.state, this.context);
  }
  transformRoutes<T>(routes: readonly T[], framework: 'react' | 'vue'): readonly T[] {
    return this.routeTransformers.reduce(
      (value, transformer) => transformer.transform(value, { framework }),
      routes,
    );
  }

  registerTarget(id: string, resolve: () => TargetAnchor | null): () => void {
    return this.interaction.registerTarget(id, resolve);
  }

  unregisterTarget(id: string): void {
    this.interaction.unregisterTarget(id);
  }

  listTargets(): readonly string[] {
    return this.interaction.listTargets();
  }

  /** Apply the same readiness/disposal and error contract to direct interaction methods. */
  private async interactionCall(
    run: () => CommandResult | Promise<CommandResult>,
  ): Promise<CommandResult> {
    const pending = this.notReady();
    if (pending) return pending;
    try {
      return await run();
    } catch (error) {
      this.bindingDiagnostic(error, 'interaction');
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.highlight(target, options));
  }

  clearHighlight(): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.clearHighlight());
  }

  getHighlight() {
    return this.interaction.getHighlight();
  }

  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.startTour(steps, options));
  }

  nextTourStep(step = 1): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.nextTourStep(step));
  }

  prevTourStep(): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.prevTourStep());
  }

  stopTour(): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.stopTour(true));
  }

  getTour() {
    return this.interaction.getTour();
  }

  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.focus(target, options));
  }

  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult> {
    return this.interactionCall(() => this.interaction.scrollTo(target, options));
  }

  registerNavigationAction(
    id: string,
    handler: import('./types.js').NavigationActionHandler,
  ): () => void {
    if (this.actions.has(id)) throw new Error(`Navigation action already registered: ${id}`);
    this.actions.set(id, handler);
    return () => {
      if (this.actions.get(id) === handler) this.actions.delete(id);
    };
  }

  async executeAction(
    actionId: string,
    payload?: unknown,
    context = this.context,
  ): Promise<CommandResult> {
    const handler = this.actions.get(actionId);
    if (!handler)
      return { ok: false, reason: 'unknown-action', message: `未注册动作：${actionId}` };
    try {
      await handler.invoke(payload, context);
      this.bus.emit({ type: 'action', actionId, payload, context });
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  subscribe(listener: (event: RouterEvent) => void): () => void {
    return this.bus.subscribe(listener);
  }

  /** Reentrant callers share completion, including calls made by disposed subscribers. */
  dispose(): Promise<void> {
    if (this.disposal) return this.disposal;
    let resolve!: () => void;
    let reject!: (error: unknown) => void;
    this.disposal = new Promise<void>((done, fail) => {
      resolve = done;
      reject = fail;
    });
    void this.disposeResources().then(resolve, reject);
    return this.disposal;
  }

  private async disposeResources(): Promise<void> {
    this.disposed = true;
    // HMR hosts do not await disposal callbacks. Release ownership before any await so
    // the replacement can register immediately; the cleanup closure cannot delete a new owner.
    this.detachGlobal();
    this.bus.emit({ type: 'disposed' });
    this.disconnect();
    this.activeController?.abort(new Error('Router Plus disposed'));
    this.interaction.dispose();
    await this.ready.catch(() => undefined);
    await Promise.allSettled(this.pendingPlugins);
    await this.plugins.disposeAll();
    for (const hosts of this.hosts.values())
      for (const host of hosts)
        this.scheduleHost(host, async () => {
          await host.deactivate?.();
          await host.dispose?.();
        });
    await Promise.all(this.hostTasks.values());
    this.hosts.clear();
    for (const stop of [...this.bindingCleanups].reverse()) stop();
    for (const entry of this.globalSources.values()) {
      try {
        entry.stop?.();
      } catch (error) {
        this.bindingDiagnostic(error, 'state.cleanup');
      }
    }
    this.globalSources.clear();
    this.pendingStateValues.clear();
    this.state.dispose();
    for (const scope of this.scopes.values()) scope.alive = false;
    this.scopes.clear();
    this.retention.clear();
    this.detachGlobal();
  }
}

/** Create a Router Plus instance. */
export function createRouterPlus(options: CreateRouterPlusOptions): RouterPlus {
  return new RouterPlusImpl(options);
}
