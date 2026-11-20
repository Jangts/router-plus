/**
 * Public contracts of `@jangts/router-plus`.
 *
 * The package owns page navigation, page state and page interaction primitives. It does not
 * know application route files, permissions, business commands or store shapes; callers pass
 * `PageDefinition[]`, targets and connections explicitly.
 */

/** Per-parameter validator; return `true` or a message; a returned string means invalid. */
export type ParamValidator = (value: string) => boolean | string;

/** Optional validator table keyed by route template parameter. */
export type ParamSchema<P extends Record<string, string> = Record<string, string>> = Readonly<
  Partial<Record<keyof P & string, ParamValidator>>
>;

/** One in-page tab declaration. */
export interface PageTab {
  readonly id: string;
  readonly label?: string;
}

/** Encoded query groups preserve repeated values and explicitly owned keys. */
export type QueryRecord = Readonly<Record<string, string | readonly string[] | undefined>>;
export type QueryEncoding = string | URLSearchParams | QueryRecord | undefined;

/** One complete field value; nested objects and arrays use JSON unless overridden. */
export interface StateField<S = unknown> {
  /** @internal Explicit registration relationship; never inferred from an ID prefix. */
  readonly sourceParentId?: string;
  readonly default?: S;
  /** @internal Plain indexed sources do not participate in navigation restoration. */
  readonly navigation?: boolean;
  /** @internal Static catalog rules can be used before a native source mounts. */
  readonly catalog?: boolean;
  readonly values?: readonly S[];
  readonly validate?: (value: unknown) => boolean;
  readonly query?: boolean | string | readonly string[];
  readonly encode?: (value: S) => QueryEncoding;
  readonly decode?: (raw: string) => S;
  readonly fields?: Readonly<Record<string, StateField>>;
  /** @internal Root object decoders receive the owned parameter collection. */
  readonly groupDecode?: (query: URLSearchParams) => S;
  /** @internal Existing snapshots may use this serializer. */
  readonly codec?: StateCodec;
}

/** A field codec handles its complete value, including non-scalar values. */
export interface StateValueOptions<S = unknown> {
  readonly query?: boolean | string;
  readonly values?: readonly S[];
  readonly validate?: (value: unknown) => boolean;
  readonly encode?: (value: S) => string | undefined;
  readonly decode?: (raw: string) => S;
}

/** Explicit existing value access; setters own business validation and side effects. */
export interface StateAccessor<S> {
  /** Pure native-value read; methods are invoked with the original receiver. */
  get(): S;
  /** Optional complete-value business write, without automatic updater semantics. */
  set?(next: S): void | Promise<void>;
}

/** Installed source metadata; contains no live values or executable references. */
export interface StateInspection {
  /** Exact registration ID; arbitrary object field paths are not expanded. */
  readonly id: string;
  /** Owning registration namespace. */
  readonly scope: 'global' | 'page';
  /** Page identity for a page source; null for global sources. */
  readonly pageId: string | null;
  /** Concrete page instance identity; null for global sources. */
  readonly stateKey: string | null;
  /** Explicit parent registration ID for store actions; otherwise null. */
  readonly parentId: string | null;
  /** Operations supported by the installed adapter, without executing them. */
  readonly capabilities: Readonly<{ read: true; write: boolean; call: boolean }>;
  /** Declared address parameters; never includes their values. */
  readonly queryKeys: readonly string[];
}

/** Native initialization supplies defaults; registration only adds identity and rules. */
export type StateBindingOptions<S = unknown> = {
  readonly id: string;
  readonly query?: boolean | string | readonly string[];
  readonly values?: readonly S[];
  readonly validate?: (value: unknown) => boolean;
  readonly encode?: (value: S) => QueryEncoding;
  readonly decode?: (
    query: S extends readonly unknown[]
      ? string
      : S extends (...args: never[]) => unknown
        ? string
        : S extends object
          ? URLSearchParams
          : string,
  ) => S;
  readonly fields?: Partial<{ readonly [K in keyof S]: StateValueOptions<S[K]> }>;
};
export type StateIdOrOptions<S = unknown> = string | StateBindingOptions<S>;

/** @internal Initial value, version and persistence of an `owned` page state bucket. */
export interface PageStateDefinition<S = unknown> {
  readonly initial: S | (() => S);
  readonly version?: number;
  readonly migrate?: (value: unknown, fromVersion: number) => S;
  readonly persist?: 'memory' | 'session';
  /** Optional registered owned-state adapter. */
  readonly adapter?: string;
}

/** How a page instance is identified. */
export type InstanceKeyStrategy =
  'pathname' | 'page' | { readonly params: readonly string[] } | ((context: PageContext) => string);

/** Page level guards. */
export interface PageGuards<
  P extends Record<string, string> = Record<string, string>,
  S = unknown,
> {
  beforeLeave?(context: GuardContext<P, S>): GuardResult | Promise<GuardResult>;
  beforeEnter?(context: GuardContext<P, S>): GuardResult | Promise<GuardResult>;
  afterEnter?(context: GuardContext<P, S>): void | Promise<void>;
  onRetain?(context: PageContext): void;
  onRestore?(context: PageContext): void;
}

/** Guard input; `page` is the definition the guard belongs to. */
export interface GuardContext<
  P extends Record<string, string> = Record<string, string>,
  S = unknown,
> {
  readonly context: PageContext;
  readonly page: PageDefinition<P, S>;
  readonly signal: AbortSignal;
}

/** Guard decision. */
export type GuardResult = true | false | { redirect: PageTarget } | { message: string };

/** Declarative page definition provided by the caller. */
export interface PageDefinition<
  P extends Record<string, string> = Record<string, string>,
  S = unknown,
> {
  /** Page id; defaults to `path`. */
  readonly id?: string;
  /** Route template, e.g. `/alpha/:id`. */
  readonly path: string;
  /** Additional paths for the same page. */
  readonly pathAliases?: readonly string[];
  readonly title: string;
  readonly params?: ParamSchema<P>;
  readonly tabs?: readonly PageTab[];
  readonly defaultTab?: string;
  /** When true the tab is also written into the query string. */
  readonly tabInUrl?: boolean;
  /** @internal Runtime compatibility, not an application registration API. */
  readonly state?: PageStateDefinition<S>;
  readonly states?: Readonly<Record<string, StateField>>;
  readonly instanceKey?: InstanceKeyStrategy;
  readonly retain?: boolean | { readonly max?: number };
  /** Component key resolved by framework adapters. */
  readonly component?: string;
  readonly parentId?: string;
  readonly layout?: string;
  readonly guards?: PageGuards<P, S>;
  /** Application metadata; never exposed through `PageCatalog`. */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Sanitized page projection exposed by catalogs and the global facade. */
export interface PageCatalogEntry {
  readonly id: string;
  readonly path: string;
  readonly pathAliases?: readonly string[];
  readonly title: string;
  readonly tabs?: readonly PageTab[];
  readonly defaultTab?: string;
  readonly tabInUrl?: boolean;
  readonly states?: Readonly<Record<string, StateField>>;
  readonly retain: boolean;
  /** Strategy description only; functions are projected as `'custom'`. */
  readonly instanceKey: InstanceKeyStrategy | 'custom';
  readonly parentId?: string;
}

/** Ordered multi-value query pairs, preserving duplicates and order. */
export type QueryPairs = readonly (readonly [string, string])[];

/** Address snapshot. */
export interface RouterLocation {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly state?: unknown;
  /** Framework history entry identity when available. */
  readonly entryKey?: string;
  readonly revision?: string;
  readonly action?: 'push' | 'replace' | 'pop' | 'initial' | 'native';
  readonly navigationId?: string;
  /** Authoritative framework match, when supplied. */
  readonly matched?: readonly {
    readonly pageId: string;
    readonly params: Readonly<Record<string, string>>;
  }[];
}

/** Current page context. */
export interface PageContext {
  readonly pageId: string | null;
  readonly title?: string;
  readonly path: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly queryAll: QueryPairs;
  readonly tab: string | null;
  readonly values: Readonly<Record<string, unknown>>;
  readonly instance: PageInstance | null;
  readonly page: PageCatalogEntry | null;
  readonly location: RouterLocation;
}

/** Page instance identity. */
export interface PageInstance {
  readonly pageId: string;
  readonly instanceKey: string;
  readonly tab: string | null;
  readonly stateKey: string;
  readonly historyKey: string;
  readonly retained: boolean;
}

/** Result of matching one address against the catalog. */
export interface PageMatch {
  readonly values?: Readonly<Record<string, unknown>>;
  readonly page: PageCatalogEntry;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly queryAll: QueryPairs;
  readonly tab: string | null;
}

/** Read-only catalog projection. */
export interface PageCatalog {
  readonly entries: readonly PageCatalogEntry[];
  readonly ids: readonly string[];
  get(id: string): PageCatalogEntry | undefined;
  byPath(pathname: string): PageMatch | null;
}

/** Navigation target: path string, path object, router-to object or page id object. */
export type PageTarget =
  | string
  | {
      readonly path: string;
      readonly values?: Readonly<Record<string, unknown>>;
      readonly tab?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    }
  | {
      readonly pathname: string;
      readonly values?: Readonly<Record<string, unknown>>;
      readonly search?: string;
      readonly hash?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    }
  | {
      readonly page: string;
      readonly params?: Record<string, string>;
      readonly query?: Record<string, string>;
      readonly values?: Readonly<Record<string, unknown>>;
      readonly tab?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    };

/** Link target adds explicit business actions to navigation targets. */
export type LinkTarget = PageTarget | { readonly action: string; readonly payload?: unknown };

/** Resolution of a link target. */
export type LinkResolution =
  | {
      readonly kind: 'page';
      readonly href: string;
      readonly pageId: string | null;
      readonly path: string;
      readonly params: Readonly<Record<string, string>>;
      readonly query: Readonly<Record<string, string>>;
      readonly queryAll: QueryPairs;
      readonly values?: Readonly<Record<string, unknown>>;
      readonly tab?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    }
  | { readonly kind: 'external'; readonly href: string }
  | { readonly kind: 'action'; readonly actionId: string; readonly payload?: unknown };

/** A navigation plan never contains business actions. */
export type NavigationPlan = Extract<LinkResolution, { kind: 'page' } | { kind: 'external' }>;

/** Framework options are passed through; core interprets only documented fields. */
export interface NavigateOptions {
  readonly replace?: boolean;
  readonly state?: unknown;
  readonly relative?: 'route' | 'path' | 'index' | 'to' | 'none';
  readonly preventScrollReset?: boolean;
  readonly viewTransition?: boolean;
  readonly [key: string]: unknown;
}

/** Declared capabilities of a connection. */
export interface ConnectionCapabilities {
  readonly interception?: boolean;
  readonly traversal?: boolean;
  readonly rawHistoryObservation?: boolean;
}

/** Real commit request handed to a framework connection. */
export interface CommitRequest {
  readonly navigationId: string;
  readonly href: string;
  readonly path: string;
  readonly tab?: string;
  readonly state: Record<string, unknown>;
  readonly options: NavigateOptions;
  readonly signal: AbortSignal;
}

export type CommitStatus = 'committed' | 'blocked' | 'cancelled' | 'failed' | 'noop';

/** Real commit receipt. */
export interface CommitResult {
  readonly status: CommitStatus;
  readonly location?: RouterLocation;
  readonly message?: string;
  readonly error?: unknown;
}

/** One committed address change. */
export interface CommittedChange {
  readonly location: RouterLocation;
  readonly source: 'plus' | 'native' | 'traversal' | 'initial';
  readonly navigationId?: string;
}

/** Framework navigation port. */
export interface RouterConnection {
  readonly initial: RouterLocation;
  /** Framework matching/building semantics; bound before the initial snapshot is applied. */
  readonly matcher?: import('./matcher.js').RouteMatcher;
  /** Native transition gate; Plus-originated transitions carry an already checked token. */
  intercept?(check: (target: RouterLocation) => Promise<GuardResult>): () => void;
  readonly capabilities?: ConnectionCapabilities;
  commit(request: CommitRequest): Promise<CommitResult> | CommitResult;
  subscribe(listener: (change: CommittedChange) => void): () => void;
  back?(): Promise<CommitResult> | CommitResult;
  forward?(): Promise<CommitResult> | CommitResult;
  go?(delta: number): Promise<CommitResult> | CommitResult;
}

export type CommandReason =
  | 'invalid-target'
  | 'unknown-page'
  | 'invalid-param'
  | 'invalid-tab'
  | 'unsupported-scheme'
  | 'unknown-action'
  | 'target-not-found'
  | 'state-readonly'
  | 'state-unsupported'
  | 'state-unknown'
  | 'unsupported-command'
  | 'dom-unavailable'
  | 'not-connected'
  | 'not-ready'
  | 'blocked'
  | 'cancelled'
  | 'failed'
  | 'timeout'
  | 'superseded'
  | 'noop';

export interface CommandSuccess {
  readonly ok: true;
  readonly value?: unknown;
}

export interface CommandFailure {
  readonly ok: false;
  readonly reason: CommandReason;
  readonly message?: string;
  readonly navigationId?: string;
  readonly stage?: string;
  readonly committed?: boolean;
}

export type CommandResult = CommandSuccess | CommandFailure;

/** One sequential group shares a finite deadline; cancellation never reverses business effects. */
export interface CommandSequenceOptions {
  /** Total deadline in milliseconds, including source waits and business calls. Default: 10000. */
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}
/** Completed receipts are retained when a subsequent step fails; steps are never retried. */
export type CommandSequenceResult =
  | { readonly ok: true; readonly results: readonly CommandResult[] }
  | {
      readonly ok: false;
      readonly reason: CommandReason;
      readonly failedIndex: number;
      readonly results: readonly CommandResult[];
    };

export type NavigationStatus = 'committed' | 'blocked' | 'cancelled' | 'failed' | 'noop';

export interface NavigationResult {
  readonly status: NavigationStatus;
  readonly navigationId: string;
  readonly stage?: string;
  readonly location?: RouterLocation;
  readonly context?: PageContext;
  readonly message?: string;
  readonly redirected?: boolean;
  readonly error?: unknown;
}

export type RouterCommand =
  | { kind: 'navigate'; target: PageTarget; options?: NavigateOptions }
  | { kind: 'replace'; target: PageTarget; options?: NavigateOptions }
  | { kind: 'back' }
  | { kind: 'forward' }
  | { kind: 'go'; delta: number }
  | { kind: 'state.call'; id: string; args?: readonly unknown[] }
  | { kind: 'tab.set'; tab: string }
  | { kind: 'tab.read' }
  | { kind: 'state.set'; key?: string; value: unknown }
  | { kind: 'state.patch'; key?: string; value: Record<string, unknown> }
  | { kind: 'state.reset'; key?: string }
  | { kind: 'state.read'; key?: string }
  | { kind: 'context.read' }
  | { kind: 'highlight.set'; target: TargetRef; options?: HighlightOptions }
  | { kind: 'highlight.clear' }
  | { kind: 'tour.start'; steps: readonly TourStep[]; options?: TourOptions }
  | { kind: 'tour.next'; step?: number }
  | { kind: 'tour.prev' }
  | { kind: 'tour.stop' }
  | { kind: 'focus'; target: TargetRef; options?: FocusOptions }
  | { kind: 'scroll.to'; target: TargetRef; options?: ScrollOptions }
  | { kind: 'retain' }
  | { kind: 'release' };

export type RouterEvent =
  | { type: 'state.registered' | 'state.unregistered' | 'state.committed'; source: StateInspection }
  | { type: 'disposed' }
  | { type: 'renderer'; custom: boolean }
  | { type: 'location'; context: PageContext }
  | { type: 'navigation'; from: PageContext; to: PageContext; result: NavigationResult }
  | { type: 'tab'; context: PageContext; tab: string }
  | { type: 'state'; context: PageContext; key: string; value: unknown }
  | { type: 'action'; actionId: string; payload?: unknown; context: PageContext }
  | { type: 'highlight'; state: HighlightState | null }
  | { type: 'tour'; state: TourState | null }
  | { type: 'retain'; instance: PageInstance }
  | { type: 'release'; instance: PageInstance };

/** Geometric anchors support canvas targets without inventing a DOM element. */
export type TargetAnchor =
  Element | { getBoundingClientRect(): DOMRectReadOnly; readonly contextElement?: Element };

/** Interaction target reference. */
export type TargetRef =
  | string
  | { readonly selector: string }
  | { readonly rect: () => DOMRectReadOnly; readonly contextElement?: Element }
  | { readonly element: Element | (() => Element | null) }
  | { readonly target: string; readonly value: unknown };

export type HighlightPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'left-top'
  | 'right-top'
  | 'left-bottom'
  | 'right-bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-auto'
  | 'bottom-auto'
  | 'left-auto'
  | 'right-auto'
  | 'auto'
  | 'none';

export interface HighlightOptions {
  readonly message?: string;
  readonly placement?: HighlightPlacement;
  readonly spotlight?: boolean;
  readonly padding?: number;
  readonly scrollIntoView?: boolean;
  readonly waitForTarget?: boolean;
  readonly timeout?: number;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly interactive?: boolean;
  readonly className?: string;
}

export interface HighlightState {
  readonly target: TargetRef;
  readonly element: TargetAnchor;
  readonly message?: string;
  readonly placement: HighlightPlacement;
  readonly spotlight?: boolean;
  readonly padding?: number;
  readonly startedAt: number;
  readonly dismissible?: boolean;
  readonly interactive?: boolean;
  readonly className?: string;
}

export interface TourStep {
  readonly target: TargetRef;
  readonly message: string;
  readonly placement?: HighlightPlacement;
  readonly awaitUser?: boolean;
  readonly advanceOn?: 'manual' | 'click';
}

export interface TourState {
  readonly id?: string;
  readonly steps: readonly TourStep[];
  readonly index: number;
  readonly awaiting: boolean;
  readonly active: boolean;
  readonly keyboard?: boolean;
  readonly dismissible?: boolean;
}

export interface TourOptions {
  readonly id?: string;
  readonly dismissible?: boolean;
  readonly keyboard?: boolean;
  readonly beforeStep?: (index: number, step: TourStep) => void | Promise<void>;
  readonly afterStep?: (index: number, step: TourStep) => void | Promise<void>;
  readonly onStep?: (index: number, step: TourStep) => void;
  readonly onFinish?: () => void;
  readonly onCancel?: () => void;
}

export interface FocusOptions {
  readonly preventScroll?: boolean;
  readonly restore?: boolean;
}

export interface ScrollOptions {
  readonly behavior?: 'auto' | 'smooth';
  readonly block?: 'start' | 'center' | 'end' | 'nearest';
  readonly inline?: 'start' | 'center' | 'end' | 'nearest';
  readonly offset?: number;
  readonly container?: Element | string;
}

export interface TargetResolver {
  resolve(
    target: { readonly target: string; readonly value: unknown },
    context: PageContext,
    signal: AbortSignal,
  ): TargetAnchor | null | Promise<TargetAnchor | null>;
}

export interface HighlightRenderer {
  mount(root: Document | ShadowRoot | Element): void;
  render(state: HighlightState | null): void;
  destroy(): void;
}

/** DOM runtime installed by `@jangts/router-plus/overlay`. */
export interface TargetRuntime {
  resolve(
    target: TargetRef,
    context: PageContext,
    options: {
      readonly timeout: number;
      readonly waitForTarget: boolean;
      readonly signal: AbortSignal;
      readonly root?: Element | ShadowRoot;
    },
  ): Promise<TargetAnchor | null>;
  focus(element: TargetAnchor, options: FocusOptions): boolean;
  restoreFocus?(): void;
  scroll(element: TargetAnchor, options: ScrollOptions): void | Promise<void>;
}

export interface ScrollStrategy {
  readonly id: string;
  readonly priority?: number;
  matches?(element: TargetAnchor, options: ScrollOptions, context: PageContext): boolean;
  scroll(element: TargetAnchor, options: ScrollOptions, context: PageContext): void | Promise<void>;
}

/** Link protocol parsed by the caller, never executing side effects. */
export interface LinkProtocol {
  readonly scheme: string;
  resolve(value: string, location: RouterLocation): LinkTarget | null;
}

/** Business action handler registered by the caller. */
export interface NavigationActionHandler {
  readonly button?: boolean;
  invoke(payload: unknown, context: PageContext): void | Promise<void>;
}

export interface NavigationActionRegistration {
  readonly id: string;
  readonly handler: NavigationActionHandler;
}

/** @internal Storage adapter used by runtime integrations. */
export interface PageStateAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  subscribe(key: string, listener: () => void): () => void;
  snapshot(): unknown;
  restore(value: unknown): void;
}

/** Source access contract used by framework integrations. */
export interface PageStateBridge<S = unknown> {
  read(): S;
  call?(...args: unknown[]): unknown | Promise<unknown>;
  write?(next: S): void | Promise<void>;
  patch?(value: Record<string, unknown>): void | Promise<void>;
  reset?(): void | Promise<void>;
  subscribe?(listener: () => void): () => void;
  snapshot?(): unknown | Promise<unknown>;
  restore?(value: unknown): void | Promise<void>;
  /** Await framework publication after a grouped mutation; custom asynchronous work remains app-owned. */
  whenSettled?(signal?: AbortSignal): void | Promise<void>;
}

/** Redirect decision with an optional cancellation reason. */
export interface RouterPlusPluginApi {
  registerLinkProtocol(protocol: LinkProtocol): void;
  /** @internal Runtime compatibility, not an application registration API. */
  registerStateAdapter(name: string, adapter: PageStateAdapter): void;
  registerGuard(guard: GlobalGuard, options?: { readonly priority?: number }): void;
  registerRetentionStrategy(strategy: RetentionStrategy): void;
  registerInstanceKeyStrategy(name: string, strategy: InstanceKeyStrategy): void;
  registerTargetResolver(kind: string, resolver: TargetResolver): void;
  registerHighlightRenderer(
    renderer: HighlightRenderer,
    root?: Document | ShadowRoot | Element,
  ): void;
  registerRouteTransformer(transformer: RouteTransformer): void;
  registerNavigationAction(id: string, handler: NavigationActionHandler): void;
  registerScrollStrategy(strategy: ScrollStrategy): void;
  registerTargetRuntime(runtime: TargetRuntime): void;
}

export interface GlobalGuard {
  readonly id: string;
  beforeLeave?(context: PageContext): GuardResult | Promise<GuardResult>;
  beforeEnter?(context: PageContext): GuardResult | Promise<GuardResult>;
}

export interface RetentionStrategy {
  readonly id: string;
  decide(instances: readonly PageInstance[], entering: PageInstance): readonly string[];
}

export interface RouterPlusPlugin {
  readonly id: string;
  readonly requires?: readonly string[];
  readonly before?: readonly string[];
  setup(
    api: RouterPlusPluginApi,
  ): void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)>;
}

export interface RouteTransformer {
  readonly id: string;
  transform<T>(
    routes: readonly T[],
    context: { readonly framework: 'react' | 'vue' },
  ): readonly T[];
}

/** Serializable data requires a caller-supplied codec for non-JSON values. */
/** @internal Snapshot serializer. */
export interface StateCodec {
  encode(value: unknown): string;
  decode(value: string): unknown;
}

export interface RouterSnapshot {
  readonly version: 1;
  readonly location: RouterLocation;
  readonly state: unknown;
}

/** Instance host lifecycle reported by framework adapters. */
export interface InstanceHost {
  mount?(): void | Promise<void>;
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  dispose?(): void | Promise<void>;
  ready?(): boolean;
  root?(): Element | ShadowRoot | null;
}

export interface PageLinkOptions {
  readonly scheme: string;
  readonly pathKey?: string;
  readonly tabKey?: string;
}

/** Structural HMR contract shared by Vite, Webpack, Rspack/Rsbuild and Parcel.
 * Pass the hot object from the module that owns the instance; RP never self-accepts updates.
 */
export interface RouterPlusHotModule {
  dispose(callback: () => void): void;
}

export interface CreateRouterPlusOptions {
  /** Dispose this module-owned instance during replacement. Undefined/false disables integration. */
  readonly hmr?: RouterPlusHotModule | false;
  readonly pages: readonly PageDefinition[];
  readonly matcher?: import('./matcher.js').RouteMatcher;
  /** Explicit origin for same-origin absolute hrefs; omitted in originless hosts. */
  readonly origin?: string;
  /** @internal Runtime compatibility, not an application registration API. */
  readonly stateCodec?: StateCodec;
  readonly onDiagnostic?: (error: unknown, stage: string) => void;
  /** @internal Legacy snapshot recovery policy. */
  readonly persistenceFailure?: 'throw' | 'initialize';
  readonly initialSnapshot?: RouterSnapshot;
  readonly routeTransformers?: readonly RouteTransformer[];
  /** @internal Runtime compatibility, not an application registration API. */
  readonly state?: PageStateAdapter;
  readonly globalKey?: string | false;
  /** Contract version; only `1` is accepted in this release. */
  readonly apiVersion?: number;
  readonly plugins?: readonly RouterPlusPlugin[];
  readonly pageLink?: PageLinkOptions;
  readonly historyStateKey?: string;
  readonly actions?: readonly NavigationActionRegistration[];
  readonly navigationStrategy?: 'replace' | 'serial';
  readonly interactionOnNavigation?: 'end' | 'keep' | ((context: PageContext) => boolean);
  readonly openExternal?: (href: string) => void;
  /** SSR / hydration seed used before a connection is attached. */
  readonly initialLocation?: RouterLocation;
}

/** Main instance contract. */
export interface RouterPlus {
  execute(command: RouterCommand): Promise<CommandResult>;
  /** Run existing commands in order, waiting for installed sources and framework publication. */
  execute(
    commands: readonly RouterCommand[],
    options?: CommandSequenceOptions,
  ): Promise<CommandSequenceResult>;
  connect(connection: RouterConnection): () => void;
  disconnect(): void;
  readonly connected: boolean;
  readonly hasCustomRenderer: boolean;
  /** Resolves after the initially configured plugins finish installing. */
  readonly ready: Promise<void>;
  /** Cancel pending work, uninstall plugins and detach the global facade. */
  dispose(): Promise<void>;
  reportLocation(location: RouterLocation): void;
  /** Stable instance-bound facade; hidden instances retain their own context. */
  scope(context?: PageContext): RouterPlus;
  whenReady(): Promise<void>;
  snapshot(): Promise<RouterSnapshot>;
  restore(snapshot: RouterSnapshot): Promise<void>;
  transformRoutes<T>(routes: readonly T[], framework: 'react' | 'vue'): readonly T[];

  use(plugin: RouterPlusPlugin): Promise<void>;
  unuse(id: string, options?: { readonly cascade?: boolean }): Promise<void>;
  /** Register a global guard (leave/enter) with an optional priority. */
  registerGuard(guard: GlobalGuard, options?: { readonly priority?: number }): () => void;

  navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  replace(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  back(): Promise<CommandResult>;
  forward(): Promise<CommandResult>;
  go(delta: number): Promise<CommandResult>;

  resolveLink(target: LinkTarget): LinkResolution | null;
  resolveTarget(target: PageTarget): NavigationPlan | null;
  resolveHref(target: PageTarget): string | null;
  match(pathname: string): PageMatch | null;

  getContext(): PageContext;
  getInstance(): PageInstance | null;
  getState<T = unknown>(key?: string): T;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  /** @internal Runtime compatibility, not an application registration API. */
  registerStateBridge<S>(
    id: string,
    bridge: PageStateBridge<S>,
    options?: StateField<S>,
  ): () => void;
  callState(id: string, ...args: unknown[]): Promise<CommandResult>;
  listStateKeys(): readonly string[];
  /** Describe installed sources visible to this facade without reading native values. */
  inspectState(): readonly StateInspection[];
  /** Describe one exact ID; unknown IDs and unmounted address declarations return null. */
  inspectState(id: string): StateInspection | null;

  getTab(): string | null;
  setTab(tab: string): Promise<CommandResult>;
  retain(): Promise<CommandResult>;
  release(): Promise<CommandResult>;

  registerHost(host: InstanceHost): () => void;
  registerTarget(id: string, resolve: () => TargetAnchor | null): () => void;
  unregisterTarget(id: string): void;
  listTargets(): readonly string[];

  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  getHighlight(): HighlightState | null;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(step?: number): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  getTour(): TourState | null;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;

  registerNavigationAction(id: string, handler: NavigationActionHandler): () => void;
  executeAction(actionId: string, payload?: unknown): Promise<CommandResult>;

  subscribe(listener: (event: RouterEvent) => void): () => void;

  readonly pages: PageCatalog;
  readonly version: string;
  readonly apiVersion: number;
}

/** Console facade; subset of the instance without installation privileges. */
export interface RouterPlusGlobal {
  execute(command: RouterCommand): Promise<CommandResult>;
  execute(
    commands: readonly RouterCommand[],
    options?: CommandSequenceOptions,
  ): Promise<CommandSequenceResult>;
  navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  getContext(): PageContext;
  getState<T = unknown>(key?: string): T;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  callState(id: string, ...args: unknown[]): Promise<CommandResult>;
  listStateKeys(): readonly string[];
  getTab(): string | null;
  setTab(tab: string): Promise<CommandResult>;
  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  getHighlight(): HighlightState | null;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(step?: number): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  getTour(): TourState | null;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;
  listTargets(): readonly string[];
  subscribe(listener: (event: RouterEvent) => void): () => void;
  readonly pages: PageCatalog;
  readonly version: string;
  readonly apiVersion: number;
}
