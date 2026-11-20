/** Bind native Zustand creation once while retaining initializer and middleware inference. */
import type {
  StateCreator,
  StoreApi,
  Mutate,
  StoreMutatorIdentifier,
  createStore,
} from 'zustand/vanilla';
import type { UseBoundStore, create } from 'zustand';
import type { RouterPlus, StateIdOrOptions } from '../core/types.js';
import { splitBindingArguments, dataValues, type DataState } from './native.js';
import { bindNativeSource, registerSourceGroup } from '../core/native-bindings.js';
type Creator = typeof create | typeof createStore;
type Result<F, T, M extends [StoreMutatorIdentifier, unknown][]> = F extends typeof create
  ? UseBoundStore<Mutate<StoreApi<T>, M>>
  : Mutate<StoreApi<T>, M>;
export interface RpZustandCreator<F extends Creator> {
  <T, M extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], M>,
    idOrOptions?: StateIdOrOptions<DataState<T>>,
  ): Result<F, T, M>;
  <T>(): <M extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], M>,
    idOrOptions?: StateIdOrOptions<DataState<T>>,
  ) => Result<F, T, M>;
}
/**
 * Register an existing bound or vanilla store without replacing native methods.
 * @param plus Router instance owning the registration.
 * @param store Existing Zustand store with native getState/setState/subscribe.
 * @param idOrOptions Stable ID or navigation rules; action names are captured once.
 * @returns Idempotent cleanup for state, actions, subscriptions and query ownership.
 * @throws Invalid rules, duplicate IDs/query keys, disposed owner or subscription failures.
 */
export function registerZustandState<S>(
  plus: RouterPlus,
  store: Pick<StoreApi<S>, 'getState' | 'setState' | 'subscribe'>,
  idOrOptions: StateIdOrOptions<NoInfer<DataState<S>>>,
): () => void {
  const id = typeof idOrOptions === 'string' ? idOrOptions : idOrOptions.id;
  const initial = store.getState();
  const names = Object.entries(
    initial !== null && (typeof initial === 'object' || typeof initial === 'function')
      ? initial
      : {},
  )
    .filter(([, value]) => typeof value === 'function')
    .map(([name]) => name);
  return registerSourceGroup(plus, (collect) => {
    collect(
      bindNativeSource(
        plus,
        {
          read: () => dataValues(store.getState()),
          write: (next) => store.setState(() => next as S),
          subscribe: (listener) => store.subscribe(listener),
        },
        idOrOptions,
        true,
      ),
    );
    for (const name of names)
      collect(
        bindNativeSource(
          plus,
          {
            read: () => (store.getState() as Record<string, unknown> | null)?.[name],
            call: (...args) => {
              const state = store.getState() as Record<string, unknown> | null,
                action = state?.[name];
              if (typeof action !== 'function')
                throw new Error(`Store action is no longer callable: ${name}`);
              return Reflect.apply(action, state, args);
            },
          },
          `${id}/${name}`,
          true,
          undefined,
          id,
        ),
      );
  });
}
export function createRpZustand<F extends Creator>(
  plus: RouterPlus,
  create: F,
): RpZustandCreator<F> {
  const wrapped = (...input: unknown[]): unknown => {
    const { native, options } = splitBindingArguments(input);
    if (!native.length) return (...args: unknown[]) => wrapped(...args);
    const store = Reflect.apply(create, undefined, native);
    if (options !== undefined) registerZustandState(plus, store, options);
    return store;
  };
  return wrapped as RpZustandCreator<F>;
}
