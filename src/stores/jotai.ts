/** Jotai atom creation reuses the caller's native store and preserves atom identity. */
import type {
  atom,
  Atom,
  PrimitiveAtom,
  WritableAtom,
  Getter,
  Setter,
  createStore,
} from 'jotai/vanilla';
import type { RouterPlus, StateIdOrOptions } from '../core/types.js';
import { splitBindingArguments, storeOptions, type StoreStateOptions } from './native.js';
import { bindNativeSource, registerSourceGroup } from '../core/native-bindings.js';
export type RpJotaiCreator = typeof atom & {
  <T, A extends unknown[], R>(
    read: (get: Getter) => T,
    write: (get: Getter, set: Setter, ...args: A) => R,
    idOrOptions: JotaiStateOptions<T>,
  ): WritableAtom<T, A, R>;
  <T, A extends unknown[], R>(
    initial: T,
    write: (get: Getter, set: Setter, ...args: A) => R,
    idOrOptions: JotaiStateOptions<T>,
  ): WritableAtom<T, A, R>;
  <T>(read: (get: Getter) => T, idOrOptions: ReadonlyOptions<T>): Atom<T>;
  <T>(
    initial: T extends (...args: never[]) => unknown ? never : T,
    idOrOptions: JotaiStateOptions<T>,
  ): PrimitiveAtom<T>;
};
export type JotaiStateOptions<S> = StoreStateOptions<S>;
type ReadonlyOptions<S> =
  string | (Exclude<StateIdOrOptions<S>, string> & { readonly set?: never });
type AtomStore = ReturnType<typeof createStore>;
/**
 * Existing writable atoms expose native commands; complete-value assignment is opt-in.
 * @param plus Router instance owning the registration.
 * @param store Explicit native Jotai store; no default store is selected.
 * @param source Existing atom whose identity and native argument tuple remain unchanged.
 * @param options Stable ID/rules; a business setter explicitly enables full-value assignment.
 * @returns Idempotent cleanup for the atom index and subscription.
 * @throws Invalid rules, incompatible readonly capabilities, duplicate IDs or subscription failures.
 */
export function registerJotaiState<V, A extends unknown[], R>(
  plus: RouterPlus,
  store: AtomStore,
  source: WritableAtom<V, A, R>,
  options: JotaiStateOptions<V>,
): () => void;
export function registerJotaiState<V>(
  plus: RouterPlus,
  store: AtomStore,
  source: Atom<V>,
  options: ReadonlyOptions<V>,
): () => void;
export function registerJotaiState<V>(
  plus: RouterPlus,
  store: AtomStore,
  source: Atom<V>,
  options: JotaiStateOptions<V>,
): () => void {
  const { rules, set } = storeOptions(options),
    writable = 'write' in source && typeof source.write === 'function';
  if (set && !writable) throw new Error('Readonly atoms cannot have a write adapter');
  return registerSourceGroup(plus, (collect) =>
    collect(
      bindNativeSource(
        plus,
        {
          read: () => store.get(source),
          ...(set ? { write: set } : {}),
          ...(writable
            ? { call: (...args: unknown[]) => Reflect.apply(store.set, store, [source, ...args]) }
            : {}),
          subscribe: (listener) => store.sub(source, listener),
        },
        rules,
        true,
      ),
    ),
  );
}
export function createRpJotaiAtom(
  plus: RouterPlus,
  create: typeof atom,
  store: AtomStore,
): RpJotaiCreator {
  return ((...input: unknown[]) => {
    const { native, options } = splitBindingArguments(input),
      result = Reflect.apply(create, undefined, native);
    if (options !== undefined) {
      const explicit = options as JotaiStateOptions<unknown>;
      const registration =
        native.length === 1 && typeof native[0] !== 'function' && !storeOptions(explicit).set
          ? {
              ...(typeof options === 'string' ? { id: options } : options),
              set: (next: unknown) => {
                Reflect.apply(store.set, store, [result, () => next]);
              },
            }
          : explicit;
      registerJotaiState(plus, store, result, registration);
    }
    return result;
  }) as RpJotaiCreator;
}
