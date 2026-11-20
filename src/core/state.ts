import { describeSource } from './state-inspection.js';
/**
 * Instance-scoped state storage, bridge access and persistence.
 * Writes serialize the entire read/modify/write operation. Scope and registration identities
 * survive awaits; released or replaced registrations cannot publish into a newer instance.
 */
import {
  stateFields,
  validState,
  sameState,
  decodeQuery,
  queryKeys,
  restoreQuery,
  sameQueryState,
} from './state-fields.js';
import type {
  CommandResult,
  PageContext,
  PageDefinition,
  PageInstance,
  PageStateAdapter,
  PageStateBridge,
  RouterEvent,
  StateCodec,
  StateField,
} from './types.js';
import { cloneValue, isPlainObject, toErrorMessage } from './util.js';

interface BridgeEntry {
  bridge: PageStateBridge;
  rules?: StateField;
  stop?: () => void;
  revision: number;
  restoring?: boolean;
  published?: boolean;
}
interface ScopeRecord {
  context: PageContext;
  alive: boolean;
  keys: Set<string>;
  bridges: Map<string, BridgeEntry>;
  pending: Map<string, unknown>;
  ownedSubscriptions: Map<string, { adapter: PageStateAdapter; stop: () => void }>;
}
interface StoredValue {
  version: number;
  value: unknown;
}
export interface StateEngineOptions {
  readonly adapter: PageStateAdapter;
  readonly namespace: string;
  readonly codec?: StateCodec;
  readonly persistenceFailure?: 'throw' | 'initialize';
  getContext(): PageContext;
  getDefinition(pageId: string | null): PageDefinition | undefined;
  getAdapter?(name: string): PageStateAdapter | undefined;
  diagnostic?(error: unknown, stage: string): void;
  emit(event: RouterEvent): void;
  defer?(effect: () => void): void;
  bridgeChanged?(context: PageContext, key: string, value: unknown): void;
}

/** Standalone owned-state adapter, also useful for SSR. */
export function createMemoryStateAdapter(): PageStateAdapter {
  const values = new Map<string, unknown>();
  const listeners = new Map<string, Set<() => void>>();
  const notify = (key: string) => {
    for (const listener of listeners.get(key) ?? []) listener();
  };
  return {
    get: <T>(key: string) => values.get(key) as T | undefined,
    set(key, value) {
      values.set(key, value);
      notify(key);
    },
    remove(key) {
      values.delete(key);
      notify(key);
    },
    subscribe(key, listener) {
      const set = listeners.get(key) ?? new Set();
      set.add(listener);
      listeners.set(key, set);
      return () => {
        set.delete(listener);
        if (!set.size) listeners.delete(key);
      };
    },
    snapshot: () => Object.fromEntries(values),
    restore(value) {
      const keys = new Set(values.keys());
      values.clear();
      if (isPlainObject(value))
        for (const [key, item] of Object.entries(value)) {
          values.set(key, item);
          keys.add(key);
        }
      for (const key of keys) notify(key);
    },
  };
}

/** One engine holds multiple scopes without changing a global current-instance pointer. */
export class StateEngine {
  private readonly scopes = new Map<string, ScopeRecord>();
  private readonly queues = new Map<string, Promise<unknown>>();
  private readonly adapter: PageStateAdapter;
  constructor(private readonly options: StateEngineOptions) {
    this.adapter = options.adapter;
  }

  /** Update active context, keeping inactive scopes' last snapshots intact. */
  updateContext(context: PageContext): void {
    if (!context.instance) return;
    const record = this.scopes.get(context.instance.stateKey);
    if (record) record.context = context;
  }

  private scope(context = this.options.getContext()): ScopeRecord {
    if (!context.instance) throw new Error('Page instance is not available');
    const id = context.instance.stateKey;
    let record = this.scopes.get(id);
    if (!record) {
      record = {
        context,
        alive: true,
        keys: new Set(),
        bridges: new Map(),
        pending: new Map(),
        ownedSubscriptions: new Map(),
      };
      this.scopes.set(id, record);
    }
    return record;
  }

  private definition(record: ScopeRecord) {
    return this.options.getDefinition(record.context.pageId)?.state;
  }
  private storage(record: ScopeRecord): PageStateAdapter {
    const name = this.definition(record)?.adapter;
    if (!name) return this.adapter;
    const adapter = this.options.getAdapter?.(name);
    if (!adapter) throw new Error(`State adapter not registered: ${name}`);
    return adapter;
  }
  private storageKey(record: ScopeRecord, key: string): string {
    return JSON.stringify([this.options.namespace, record.context.instance!.stateKey, key]);
  }
  private failure(error: unknown, stage: string): void {
    this.options.diagnostic?.(error, stage);
    if (this.options.persistenceFailure === 'throw') throw error;
  }
  private initial(record: ScopeRecord, key: string): StoredValue {
    const definition = key === 'default' ? this.definition(record) : undefined;
    const initial =
      typeof definition?.initial === 'function' ? definition.initial() : definition?.initial;
    return {
      version: definition?.version ?? 0,
      value: cloneValue(initial === undefined ? {} : initial),
    };
  }
  /** Observe adapter-owned changes without creating another copy of the value. */
  private observeOwned(record: ScopeRecord, key: string): void {
    const adapter = this.storage(record),
      previous = record.ownedSubscriptions.get(key);
    if (previous?.adapter === adapter) return;
    previous?.stop();
    const id = this.storageKey(record, key);
    const stop = adapter.subscribe(id, () => {
      if (!record.alive || record.bridges.has(key)) return;
      const stored = adapter.get<StoredValue>(id);
      if (stored) this.notify(record, key, stored.value);
    });
    record.ownedSubscriptions.set(key, { adapter, stop });
  }
  private readStored(record: ScopeRecord, key: string): StoredValue {
    const adapter = this.storage(record),
      id = this.storageKey(record, key);
    const existing = adapter.get<StoredValue>(id);
    if (existing !== undefined) {
      record.keys.add(key);
      this.observeOwned(record, key);
      return existing;
    }
    let value = this.initial(record, key);
    if (key === 'default' && this.definition(record)?.persist === 'session') {
      try {
        const raw = globalThis.sessionStorage?.getItem(id);
        if (raw) {
          const stored = (this.options.codec?.decode(raw) ?? JSON.parse(raw)) as StoredValue;
          if (!isPlainObject(stored) || typeof stored.version !== 'number')
            throw new Error('Invalid state snapshot');
          if (stored.version === value.version) value = stored;
          else {
            const migrate = this.definition(record)?.migrate;
            if (!migrate) throw new Error('State snapshot requires a migration');
            value = { version: value.version, value: migrate(stored.value, stored.version) };
          }
        }
      } catch (error) {
        this.failure(error, 'state.restore');
      }
    }
    record.keys.add(key);
    adapter.set(id, value);
    this.observeOwned(record, key);
    return value;
  }
  private save(record: ScopeRecord, key: string, value: StoredValue): void {
    record.keys.add(key);
    this.observeOwned(record, key);
    this.storage(record).set(this.storageKey(record, key), value);
    if (key === 'default' && this.definition(record)?.persist === 'session') {
      try {
        const raw = this.options.codec ? this.options.codec.encode(value) : JSON.stringify(value);
        globalThis.sessionStorage?.setItem(this.storageKey(record, key), raw);
      } catch (error) {
        this.failure(error, 'state.persist');
      }
    }
  }
  private notify(record: ScopeRecord, key: string, value: unknown): void {
    if (record.alive) this.options.emit({ type: 'state', context: record.context, key, value });
  }
  read<T = unknown>(key = 'default', context?: PageContext): T {
    const record = this.scope(context),
      entry = record.bridges.get(key);
    if (entry) return entry.bridge.read() as T;
    const fields = stateFields(this.options.getDefinition(record.context.pageId));
    if (Object.hasOwn(fields, key))
      return (
        Object.hasOwn(record.context.values, key) ? record.context.values[key] : fields[key].default
      ) as T;
    if (key === 'default' && this.definition(record))
      return this.readStored(record, key).value as T;
    return undefined as T;
  }

  hasBridge(id: string, context?: PageContext): boolean {
    return this.scope(context).bridges.has(id);
  }

  /** Read an installed registration identity without allocating a scope or invoking its source. */
  source(id: string, context: PageContext) {
    const record = context.instance ? this.scopes.get(context.instance.stateKey) : undefined;
    const entry = record?.alive ? record.bridges.get(id) : undefined;
    return entry?.published ? entry : undefined;
  }

  /** Framework publication is separate from value notifications, including unchanged callbacks. */
  committed(bridge: PageStateBridge, context: PageContext): void {
    const record = context.instance ? this.scopes.get(context.instance.stateKey) : undefined;
    if (!record?.alive) return;
    for (const [id, entry] of record.bridges)
      if (entry.bridge === bridge && entry.published)
        this.options.emit({
          type: 'state.committed',
          source: describeSource(id, bridge, entry.rules, record.context),
        });
  }

  /** Capture registration identity across an awaited navigation without owning the source. */
  bridgeGuard(id: string, context: PageContext): () => boolean {
    const record = this.scope(context),
      entry = record.bridges.get(id);
    return () => record.alive && (!entry || record.bridges.get(id) === entry);
  }

  /** Inspect only installed bridges; metadata queries must not allocate scopes or read values. */
  inspect(context: PageContext, excluded: ReadonlySet<PageStateBridge>) {
    const record = context.instance ? this.scopes.get(context.instance.stateKey) : undefined;
    return record?.alive
      ? [...record.bridges]
          .filter(([, entry]) => !excluded.has(entry.bridge))
          .map(([id, entry]) => describeSource(id, entry.bridge, entry.rules, context))
      : [];
  }

  hasPageBridge(pageId: string | null, id: string): boolean {
    return [...this.scopes.values()].some(
      (record) => record.alive && record.context.pageId === pageId && record.bridges.has(id),
    );
  }

  /** Register a single authoritative bridge in a stable scope. */
  registerBridge(
    id: string,
    bridge: PageStateBridge,
    context?: PageContext,
    rules?: StateField,
  ): () => void {
    const record = this.scope(context);
    if (record.bridges.has(id)) throw new Error(`State bridge already registered: ${id}`);
    record.ownedSubscriptions.get(id)?.stop();
    record.ownedSubscriptions.delete(id);
    const entry: BridgeEntry = { bridge, revision: 0, rules };
    record.bridges.set(id, entry);
    let subscribing = true;
    try {
      entry.stop = bridge.subscribe?.(() => {
        const initializing = subscribing;
        const notify = () => {
          if (!record.alive || record.bridges.get(id) !== entry) return;
          entry.revision++;
          const value = bridge.read();
          this.notify(record, id, value);
          if (!initializing && !entry.restoring)
            this.options.bridgeChanged?.(record.context, id, value);
        };
        if (this.options.defer) this.options.defer(notify);
        else notify();
      });
      subscribing = false;
    } catch (error) {
      record.bridges.delete(id);
      throw error;
    }
    const publish = () => {
      if (!record.alive || record.bridges.get(id) !== entry) return;
      entry.published = true;
      this.options.emit({
        type: 'state.registered',
        source: describeSource(id, bridge, rules, record.context),
      });
    };
    if (this.options.defer) this.options.defer(publish);
    else publish();
    return () => {
      if (record.bridges.get(id) === entry) {
        record.bridges.delete(id);
        try {
          entry.stop?.();
        } finally {
          if (entry.published)
            this.options.emit({
              type: 'state.unregistered',
              source: describeSource(id, bridge, rules, record.context),
            });
        }
      }
    };
  }

  private enqueue(
    record: ScopeRecord,
    key: string,
    task: () => Promise<CommandResult>,
  ): Promise<CommandResult> {
    const id = this.storageKey(record, key),
      previous = this.queues.get(id) ?? Promise.resolve();
    const next = previous.then(async () => {
      if (!record.alive)
        return { ok: false, reason: 'cancelled', message: 'Page scope released' } as CommandResult;
      try {
        return await task();
      } catch (error) {
        this.options.diagnostic?.(error, 'state.write');
        return { ok: false, reason: 'failed', message: toErrorMessage(error) } as CommandResult;
      }
    });
    const tracked = next.finally(() => {
      if (this.queues.get(id) === tracked) this.queues.delete(id);
    });
    this.queues.set(id, tracked);
    return next;
  }

  /** Atomic per-key mutation, including the bridge fallback read/merge/write. */
  private mutate(
    kind: 'set' | 'patch' | 'reset',
    value: unknown,
    key: string,
    context?: PageContext,
  ): Promise<CommandResult> {
    const record = this.scope(context),
      entry = record.bridges.get(key);
    const field =
      entry?.rules ?? stateFields(this.options.getDefinition(record.context.pageId))[key];
    if (field && kind === 'set' && !validState(field, value))
      return Promise.resolve({ ok: false, reason: 'invalid-target' });
    return this.enqueue(record, key, async () => {
      if (entry) {
        if (record.bridges.get(key) !== entry) return { ok: false, reason: 'cancelled' };
        const bridge = entry.bridge;
        if (kind === 'reset' && !bridge.reset) return { ok: false, reason: 'state-unsupported' };
        if (
          (kind === 'set' && !bridge.write) ||
          (kind === 'patch' && !bridge.patch && !bridge.write)
        )
          return { ok: false, reason: 'state-readonly' };
        const revision = entry.revision;
        try {
          if (kind === 'reset') await bridge.reset!();
          else if (kind === 'patch' && bridge.patch)
            await bridge.patch(value as Record<string, unknown>);
          else {
            const current = kind === 'patch' ? bridge.read() : undefined;
            const next =
              kind === 'patch'
                ? {
                    ...(isPlainObject(current) ? current : {}),
                    ...(value as Record<string, unknown>),
                  }
                : value;
            await bridge.write!(next);
          }
        } catch (error) {
          // An ended registration cannot publish a late business failure as a live result.
          if (!record.alive || record.bridges.get(key) !== entry)
            return { ok: false, reason: 'cancelled' };
          throw error;
        }
        if (!record.alive || record.bridges.get(key) !== entry)
          return {
            ok: false,
            reason: 'cancelled',
            message: 'Write completed after scope or bridge was released',
          };
        if (revision === entry.revision) this.notify(record, key, bridge.read());
        return { ok: true };
      }
      if (!(key === 'default' && this.definition(record)))
        return { ok: false, reason: 'state-unknown' };
      // A new registration must never be overwritten by an earlier queued owned mutation.
      if (record.bridges.has(key)) return { ok: false, reason: 'cancelled' };
      const current = this.readStored(record, key);
      const next =
        kind === 'reset'
          ? this.initial(record, key)
          : {
              version: current.version,
              value:
                kind === 'patch'
                  ? {
                      ...(isPlainObject(current.value) ? current.value : {}),
                      ...(value as Record<string, unknown>),
                    }
                  : cloneValue(value),
            };
      this.save(record, key, next);
      return { ok: true, value: next.value };
    });
  }
  write(value: unknown, key = 'default', context?: PageContext) {
    return this.mutate('set', value, key, context);
  }
  patch(value: Record<string, unknown>, key = 'default', context?: PageContext) {
    return this.mutate('patch', value, key, context);
  }
  reset(key = 'default', context?: PageContext) {
    return this.mutate('reset', undefined, key, context);
  }
  navigationValues(context: PageContext): Record<string, unknown> {
    const record = this.scope(context),
      values: Record<string, unknown> = {};
    for (const [id, entry] of record.bridges) {
      const field = stateFields(this.options.getDefinition(context.pageId))[id];
      if (!field || field.navigation === false) continue;
      const value = entry.bridge.read();
      if (validState(field, value)) values[id] = value;
    }
    return values;
  }
  async call(id: string, args: readonly unknown[], context?: PageContext): Promise<CommandResult> {
    const record = this.scope(context),
      entry = record.bridges.get(id);
    if (!entry) return { ok: false, reason: 'state-unknown' };
    if (!entry.bridge.call) return { ok: false, reason: 'state-unsupported' };
    try {
      const value = await entry.bridge.call(...args);
      return record.alive && record.bridges.get(id) === entry
        ? { ok: true, value }
        : { ok: false, reason: 'cancelled' };
    } catch (error) {
      if (!record.alive || record.bridges.get(id) !== entry)
        return { ok: false, reason: 'cancelled' };
      this.options.diagnostic?.(error, 'state.call');
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }
  listKeys(context?: PageContext): readonly string[] {
    const record = this.scope(context);
    return [
      ...new Set([
        ...(this.definition(record) ? ['default'] : []),
        ...Object.keys(stateFields(this.options.getDefinition(record.context.pageId))),
        ...record.keys,
        ...record.bridges.keys(),
      ]),
    ];
  }

  /** Snapshot bridges asynchronously; restore can precede their component registration. */
  async snapshot(context?: PageContext): Promise<unknown> {
    const record = this.scope(context),
      owned: Record<string, unknown> = {},
      bridges: Record<string, unknown> = {};
    for (const key of new Set([...(this.definition(record) ? ['default'] : []), ...record.keys]))
      if (!record.bridges.has(key)) owned[key] = cloneValue(this.readStored(record, key));
    for (const [key, entry] of record.bridges)
      if (entry.bridge.snapshot) bridges[key] = await entry.bridge.snapshot();
    return { owned, bridges };
  }
  async restore(value: unknown, context?: PageContext): Promise<void> {
    if (!isPlainObject(value)) throw new Error('Invalid state snapshot');
    const record = this.scope(context);
    if (isPlainObject(value.owned))
      for (const [key, stored] of Object.entries(value.owned)) {
        if (!isPlainObject(stored) || typeof stored.version !== 'number')
          throw new Error('Invalid owned snapshot');
        this.save(record, key, cloneValue(stored as unknown as StoredValue));
      }
    if (isPlainObject(value.bridges))
      for (const [key, stored] of Object.entries(value.bridges)) {
        const entry = record.bridges.get(key);
        if (entry?.bridge.restore) {
          await entry.bridge.restore(stored);
          if (!record.alive || record.bridges.get(key) !== entry) continue;
          this.notify(record, key, entry.bridge.read());
        } else record.pending.set(key, stored);
      }
  }
  async syncNavigation(context: PageContext): Promise<void> {
    const record = this.scope(context);
    for (const [key, entry] of record.bridges) {
      if (
        (entry.rules ?? stateFields(this.options.getDefinition(context.pageId))[key])
          ?.navigation === false ||
        !entry.bridge.write ||
        !Object.hasOwn(context.values, key) ||
        sameQueryState(
          key,
          entry.rules ?? stateFields(this.options.getDefinition(context.pageId))[key],
          entry.bridge.read(),
          context.values[key],
        )
      )
        continue;
      if (!entry.bridge.write) throw new Error(`Navigation state bridge is readonly: ${key}`);
      const result = await this.enqueue(record, key, async () => {
        if (record.bridges.get(key) !== entry) return { ok: false, reason: 'cancelled' };
        entry.restoring = true;
        try {
          const field = entry.rules ?? stateFields(this.options.getDefinition(context.pageId))[key];
          const next = queryKeys(key, field).length
            ? restoreQuery(key, field, new URLSearchParams(context.search), entry.bridge.read())
            : context.values[key];
          await entry.bridge.write!(next);
        } catch (error) {
          if (!record.alive || record.bridges.get(key) !== entry)
            return { ok: false, reason: 'cancelled' };
          throw error;
        } finally {
          entry.restoring = false;
        }
        if (!record.alive || record.bridges.get(key) !== entry)
          return { ok: false, reason: 'cancelled' };
        this.notify(record, key, entry.bridge.read());
        return { ok: true };
      });
      if (!result.ok && result.reason === 'cancelled') return;
      if (!result.ok)
        throw new Error(
          `Navigation state restore failed: ${key}: ${result.message ?? result.reason}`,
        );
    }
  }
  async ready(context?: PageContext): Promise<void> {
    const record = this.scope(context);
    await this.syncNavigation(record.context);
    for (const [key, value] of record.pending) {
      const entry = record.bridges.get(key);
      if (!entry?.bridge.restore) continue;
      await entry.bridge.restore(value);
      if (!record.alive || record.bridges.get(key) !== entry) return;
      record.pending.delete(key);
      this.notify(record, key, entry.bridge.read());
    }
  }
  disposeInstance(instance: PageInstance): void {
    const record = this.scopes.get(instance.stateKey);
    if (!record) return;
    record.alive = false;
    for (const subscription of record.ownedSubscriptions.values()) subscription.stop();
    record.ownedSubscriptions.clear();
    const bridges = [...record.bridges];
    record.bridges.clear();
    for (const [id, entry] of bridges) {
      try {
        entry.stop?.();
      } catch (error) {
        this.options.diagnostic?.(error, 'state.cleanup');
      }
      if (entry.published)
        this.options.emit({
          type: 'state.unregistered',
          source: describeSource(id, entry.bridge, entry.rules, record.context),
        });
    }
    for (const key of record.keys) this.storage(record).remove(this.storageKey(record, key));
    record.bridges.clear();
    record.pending.clear();
    this.scopes.delete(instance.stateKey);
  }
  dispose(): void {
    for (const record of [...this.scopes.values()]) this.disposeInstance(record.context.instance!);
  }
}
