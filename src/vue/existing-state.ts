/** Existing Vue sources share native subscriptions, receiver-safe accessors and scope cleanup. */
import {
  isRef,
  isReactive,
  isReadonly,
  isProxy,
  watch,
  inject,
  getCurrentScope,
  getCurrentInstance,
  onScopeDispose,
  nextTick,
  type Ref,
  type WritableComputedRef,
} from 'vue';
import type { PageStateBridge, StateIdOrOptions, StateAccessor } from '../core/types.js';
import { bindNativeSource, publishNativeCommit } from '../core/native-bindings.js';
import { ROUTER_PLUS_KEY } from './plugin.js';

function writeContainer(source: object, next: object): void {
  if (source === next) return;
  if (Array.isArray(source)) {
    if (!Array.isArray(next)) throw new Error('Reactive array requires an array');
    source.splice(0, source.length, ...next);
    return;
  }
  if (source instanceof Map) {
    if (!(next instanceof Map)) throw new Error('Reactive map requires a Map');
    const entries = [...next];
    source.clear();
    for (const [key, value] of entries) source.set(key, value);
    return;
  }
  if (source instanceof Set) {
    if (!(next instanceof Set)) throw new Error('Reactive set requires a Set');
    const entries = [...next];
    source.clear();
    for (const value of entries) source.add(value);
    return;
  }
  if (!next || typeof next !== 'object' || Array.isArray(next))
    throw new Error('Reactive source requires an object');
  for (const key of Object.keys(source))
    if (!Object.hasOwn(next, key)) delete (source as Record<string, unknown>)[key];
  Object.assign(source, next);
}
/** Resolve callable refs at invocation time so native replacements remain visible. */
function callableBridge(read: () => unknown): Pick<PageStateBridge, 'call'> {
  return {
    call: (...args) => {
      const callback = read();
      if (typeof callback !== 'function') throw new Error('Vue source is no longer callable');
      return callback(...args);
    },
  };
}
function callbackBridge(source: unknown): PageStateBridge {
  const read = () => source;
  return { read, ...callableBridge(read) };
}
function refBridge(source: Ref<unknown>): PageStateBridge {
  return {
    read: () => source.value,
    ...(typeof source.value === 'function' ? callableBridge(() => source.value) : {}),
    ...(!isReadonly(source)
      ? {
          write: (next: unknown) => {
            source.value = next;
          },
        }
      : {}),
    subscribe: (listener) => watch(source, listener, { deep: true, flush: 'sync' }),
  };
}
function containerBridge(source: object): PageStateBridge {
  return {
    read: () => source,
    ...(!isReadonly(source)
      ? { write: (next: unknown) => writeContainer(source, next as object) }
      : {}),
    subscribe: (listener) => watch(() => source, listener, { deep: true, flush: 'sync' }),
  };
}
function accessorBridge(source: StateAccessor<unknown>): PageStateBridge {
  if (
    typeof source.get !== 'function' ||
    (source.set !== undefined && typeof source.set !== 'function')
  )
    throw new Error('State accessor requires callable get/set');
  return {
    read: () => source.get(),
    ...(source.set ? { write: (next: unknown) => source.set!(next) } : {}),
    subscribe: (listener) => watch(() => source.get(), listener, { deep: true, flush: 'sync' }),
  };
}
const adapters = [
  { matches: (source: unknown) => typeof source === 'function', adapt: callbackBridge },
  { matches: isRef, adapt: (source: unknown) => refBridge(source as Ref<unknown>) },
  {
    matches: (source: unknown) => isReactive(source) || (isReadonly(source) && isProxy(source)),
    adapt: (source: unknown) => containerBridge(source as object),
  },
  {
    matches: (source: unknown) => source !== null && typeof source === 'object' && 'get' in source,
    adapt: (source: unknown) => accessorBridge(source as StateAccessor<unknown>),
  },
] as const;

/** A native computed can restore complete values only when its setter accepts its read type. */
export type RefRegistration<R extends Ref> =
  R extends WritableComputedRef<infer V, infer W>
    ? [V] extends [W]
      ? StateIdOrOptions<V>
      : never
    : StateIdOrOptions<R['value']>;

/**
 * Index a native ref, reactive/readonly container, callback or accessor without copying it.
 * Omitted options skip registration. Component scopes own page bindings; other effect scopes
 * own router-wide bindings. The active scope unregisters automatically on disposal.
 * @param source Existing ref/container, callback or explicit get/set accessor. Bind method receivers before passing callbacks.
 * @param idOrOptions Optional stable ID or navigation rules with an ID.
 * @returns Nothing; native identity is retained.
 * @throws Invalid source, inactive effect scope, missing provider or invalid registration rules.
 */
export function useVueState<F extends (...args: never[]) => unknown>(
  source: F,
  idOrOptions?: StateIdOrOptions<F>,
): void;
export function useVueState<R extends Ref>(source: R, idOrOptions?: RefRegistration<R>): void;
export function useVueState<S>(source: StateAccessor<S>, idOrOptions?: StateIdOrOptions<S>): void;
export function useVueState<S extends object>(
  source: S extends Ref ? never : S,
  idOrOptions?: StateIdOrOptions<S>,
): void;
export function useVueState(source: unknown, idOrOptions?: StateIdOrOptions<any>): void {
  if (idOrOptions === undefined) return;
  const scope = getCurrentScope();
  if (!scope) throw new Error('Registered Vue state requires an effect scope');
  const plus = inject(ROUTER_PLUS_KEY, null);
  if (!plus) throw new Error('Registered Vue state requires a Router Plus provider');
  const adapter = adapters.find((item) => item.matches(source));
  if (!adapter) throw new Error('Expected a Vue ref, reactive source, callback or state accessor');
  const instance = getCurrentInstance() as ReturnType<typeof getCurrentInstance> & {
    scope?: unknown;
  };
  const native = adapter.adapt(source);
  const bridge: PageStateBridge = {
    ...native,
    whenSettled: async () => {
      await nextTick();
      publishNativeCommit(plus, bridge);
    },
    ...(native.subscribe
      ? {
          subscribe: (listener: () => void) =>
            native.subscribe!(() => {
              listener();
              void bridge.whenSettled!();
            }),
        }
      : {}),
  };
  onScopeDispose(
    bindNativeSource(
      plus,
      bridge,
      idOrOptions as StateIdOrOptions<unknown>,
      !instance || instance.scope !== scope,
    ),
  );
  void bridge.whenSettled!();
}
