/** Existing React sources publish only committed accessors; abandoned renders stay private. */
import {
  useContext,
  useMemo,
  useReducer,
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from 'react';
import type { PageStateBridge, StateIdOrOptions, StateAccessor } from '../core/types.js';
import {
  bindNativeSource,
  snapshotSource,
  publishNativeCommit,
  liveBindingOptions,
} from '../core/native-bindings.js';
import { PlusContext } from './provider.js';

type StateTuple<S> = readonly [S, Dispatch<SetStateAction<S>>];
function tupleBridge(source: unknown): PageStateBridge {
  const tuple = source as StateTuple<unknown>;
  if (tuple.length !== 2 || typeof tuple[1] !== 'function')
    throw new Error('Expected a native React state tuple');
  return { read: () => tuple[0], write: (next) => tuple[1](() => next) };
}
function callbackBridge(source: unknown): PageStateBridge {
  const callback = source as (...args: unknown[]) => unknown;
  return { read: () => callback, call: (...args) => callback(...args) };
}
function refBridge(source: unknown): PageStateBridge {
  const ref = source as RefObject<unknown>;
  return {
    read: () => ref.current,
    write: (next) => {
      ref.current = next;
    },
  };
}
function accessorBridge(source: unknown): PageStateBridge {
  const accessor = source as StateAccessor<unknown>;
  if (
    typeof accessor.get !== 'function' ||
    (accessor.set !== undefined && typeof accessor.set !== 'function')
  )
    throw new Error('State accessor requires callable get/set');
  return {
    read: () => accessor.get(),
    ...(accessor.set ? { write: (next: unknown) => accessor.set!(next) } : {}),
  };
}
const adapters = [
  { matches: Array.isArray, adapt: tupleBridge },
  { matches: (source: unknown) => typeof source === 'function', adapt: callbackBridge },
  {
    matches: (source: unknown) =>
      source !== null && typeof source === 'object' && 'current' in source,
    adapt: refBridge,
  },
  {
    matches: (source: unknown) => source !== null && typeof source === 'object' && 'get' in source,
    adapt: accessorBridge,
  },
] as const;
const useCommit = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Index an existing tuple, ref, callback or receiver-safe accessor in the nearest page scope.
 * Omitted options skip registration. Only committed sources become visible; effect cleanup
 * unregisters automatically. Accessor notifications follow component commits, not polling.
 * @param source Native tuple/ref/callback or explicit get/set accessor.
 * @param idOrOptions Optional stable ID or navigation rules with an ID.
 * @returns Nothing; the source remains owned by React.
 * @throws Invalid source, missing provider, duplicate ID or incompatible query rules.
 * Registration errors occur in the effect; getter/source shape errors can occur during render.
 */
export function useReactState<S>(
  source: StateTuple<S> | RefObject<S> | StateAccessor<S>,
  idOrOptions?: StateIdOrOptions<NoInfer<S>>,
): void;
export function useReactState<F extends (...args: never[]) => unknown>(
  source: F,
  idOrOptions?: StateIdOrOptions<NoInfer<F>>,
): void;
export function useReactState(source: unknown, options?: StateIdOrOptions<any>): void {
  const plus = useContext(PlusContext),
    id = typeof options === 'string' ? options : options?.id;
  const context = useSyncExternalStore(
    (listener) =>
      id !== undefined && plus
        ? plus.subscribe((event) => {
            if (event.type === 'location') listener();
          })
        : () => {},
    () => (id !== undefined ? (plus?.getContext() ?? null) : null),
    () => (id !== undefined ? (plus?.getContext() ?? null) : null),
  );
  const candidate =
    id === undefined ? null : adapters.find((item) => item.matches(source))?.adapt(source);
  if (id !== undefined && !candidate)
    throw new Error('Expected a React state tuple, ref, callback or accessor');
  // Each registration identity owns its committed cell. Old IDs retain their old source
  // until passive cleanup, even when another identity has already committed layout effects.
  const committed = useMemo<{ current: PageStateBridge | null }>(
    () => ({ current: null }),
    [plus, id, context?.instance?.stateKey, Boolean(candidate?.write), Boolean(candidate?.call)],
  );
  const initial = useMemo<{ current: { value: unknown } | null }>(
    () => ({ current: null }),
    [committed],
  );
  const initialCandidate =
    candidate && !initial.current ? snapshotSource(candidate.read()) : undefined;
  const configuration = useMemo(() => ({ current: options }), [committed]),
    owner = useMemo(() => ({ current: plus }), [committed]);
  const listeners = useMemo(() => new Set<() => void>(), [committed]),
    previous = useMemo<{ current: { value: unknown } | null }>(
      () => ({ current: null }),
      [committed],
    );
  const [, publish] = useReducer((revision: number) => revision + 1, 0);
  const publications = useMemo(() => new Set<() => void>(), [committed]);
  const writable = Boolean(candidate?.write),
    callable = Boolean(candidate?.call);
  const bridge = useMemo<PageStateBridge>(
    () => ({
      read: () => committed.current!.read(),
      whenSettled: (signal) =>
        new Promise<void>((resolve) => {
          const done = () => {
            publications.delete(done);
            signal?.removeEventListener('abort', done);
            resolve();
          };
          if (signal?.aborted) return done();
          publications.add(done);
          signal?.addEventListener('abort', done, { once: true });
          publish();
        }),
      ...(writable ? { write: (next: unknown) => committed.current!.write!(next) } : {}),
      ...(callable ? { call: (...args: unknown[]) => committed.current!.call!(...args) } : {}),
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    }),
    [writable, callable, listeners, committed, publications],
  );
  useCommit(() => {
    if (!candidate) return;
    committed.current = candidate;
    if (!previous.current) previous.current = { value: candidate.read() };
    configuration.current = options;
    if (!initial.current) initial.current = { value: initialCandidate };
  });
  useEffect(() => {
    if (id === undefined) return;
    if (!plus) throw new Error('A registered hook requires a Router Plus provider');
    // Descendant layout effects can run before the provider publishes a native navigation.
    // Its external-store update will rerender us; never register this candidate into the old page.
    if (context?.instance?.stateKey !== plus.getContext().instance?.stateKey) return;
    owner.current = context?.instance ? plus.scope(context) : plus;
    return bindNativeSource(
      owner.current,
      bridge,
      liveBindingOptions(() => configuration.current! as StateIdOrOptions<unknown>),
      false,
      initial.current ?? undefined,
    );
  }, [plus, id, context?.instance?.stateKey, bridge]);
  useEffect(
    () => () => {
      for (const resolve of publications) resolve();
      publications.clear();
    },
    [publications],
  );
  useEffect(() => {
    if (!candidate) return;
    const changed =
      previous.current !== null && !Object.is(previous.current.value, committed.current!.read());
    if (owner.current) publishNativeCommit(owner.current, bridge, changed);
    for (const resolve of publications) resolve();
    publications.clear();
    const value = committed.current!.read();
    if (previous.current && Object.is(previous.current.value, value)) return;
    previous.current = { value };
    for (const notify of listeners) notify();
  });
}
