/** Redux creation wraps native reducers so indexed writes remain ordinary dispatches. */
import type {
  ConfigureStoreOptions,
  EnhancedStore,
  Tuple,
  Middleware,
  StoreEnhancer,
  ThunkMiddleware,
  Action,
  UnknownAction,
} from '@reduxjs/toolkit';
import type { RouterPlus } from '../core/types.js';
import { splitBindingArguments, storeOptions, type StoreStateOptions } from './native.js';
import { bindNativeSource, registerSourceGroup } from '../core/native-bindings.js';
type Creator = (...args: any[]) => any;
type UnionIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (
  value: infer I,
) => void
  ? I
  : never;
type DispatchExtensions<M extends readonly unknown[]> = UnionIntersection<
  M[number] extends infer V ? (V extends Middleware<infer D, any, any> ? D : {}) : never
>;
/** Native configuration inference includes reducer maps, middleware and enhancer extensions. */
export type RpReduxCreator<F extends Creator> = F & {
  <
    S = any,
    A extends Action = UnknownAction,
    M extends Tuple<ReadonlyArray<Middleware<{}, S>>> = Tuple<[ThunkMiddleware<S, UnknownAction>]>,
    E extends Tuple<ReadonlyArray<StoreEnhancer>> = Tuple<
      [StoreEnhancer<{ dispatch: DispatchExtensions<M> }>, StoreEnhancer]
    >,
    P = S,
  >(
    options: ConfigureStoreOptions<S, A, M, E, P>,
    idOrOptions: ReduxStateOptions<NoInfer<S>>,
  ): EnhancedStore<S, A, E>;
};
export type ReduxStateOptions<S> = StoreStateOptions<S>;
type ReduxSource = {
  getState(): unknown;
  subscribe(listener: () => void): () => void;
  dispatch: (...args: never[]) => unknown;
};
/**
 * Existing Redux stores are readonly unless a business setter is explicitly provided.
 * @param plus Router instance owning the registration.
 * @param store Existing Redux store; reducers and dispatch remain unchanged.
 * @param idOrOptions Stable ID/rules and optional complete-state business setter.
 * @returns Idempotent cleanup for state, ID/dispatch and native subscriptions.
 * @throws Invalid rules, readonly query binding, duplicate IDs or subscription failures.
 */
export function registerReduxState<S extends ReduxSource>(
  plus: RouterPlus,
  store: S,
  idOrOptions: ReduxStateOptions<NoInfer<ReturnType<S['getState']>>>,
): () => void {
  const { rules, set } = storeOptions(idOrOptions),
    id = typeof rules === 'string' ? rules : rules.id;
  return registerSourceGroup(plus, (collect) => {
    collect(
      bindNativeSource(
        plus,
        {
          read: () => store.getState() as ReturnType<S['getState']>,
          ...(set ? { write: set } : {}),
          subscribe: (listener) => store.subscribe(listener),
        },
        rules,
        true,
      ),
    );
    collect(
      bindNativeSource(
        plus,
        {
          read: () => store.dispatch,
          call: (...args) => Reflect.apply(store.dispatch, store, args),
        },
        `${id}/dispatch`,
        true,
        undefined,
        id,
      ),
    );
  });
}
/** Only creation can prepare a reducer-backed complete-value write adapter. */
export function configureRpReduxStore<F extends Creator>(
  plus: RouterPlus,
  configure: F,
): RpReduxCreator<F> {
  return ((...input: unknown[]) => {
    const { native, options } = splitBindingArguments(input);
    let configuration = native[0] as Record<string, unknown>;
    let registration = options as ReduxStateOptions<unknown> | undefined;
    if (options !== undefined && !storeOptions(registration!).set) {
      const id = typeof options === 'string' ? options : options.id,
        type = `@@router-plus/${id}/set`,
        reducer = configuration.reducer;
      const wrap =
        (reduce: Creator, key?: string) =>
        (state: unknown, action: { type: string; payload: Record<string, unknown> }) =>
          action.type === type
            ? key === undefined
              ? action.payload
              : action.payload[key]
            : reduce(state, action);
      configuration = {
        ...configuration,
        reducer:
          typeof reducer === 'function'
            ? wrap(reducer as Creator)
            : Object.fromEntries(
                Object.entries(reducer as object).map(([key, reduce]) => [key, wrap(reduce, key)]),
              ),
      };
      const store = Reflect.apply(configure, undefined, [configuration, ...native.slice(1)]);
      registration = {
        ...(typeof options === 'string' ? { id: options } : options),
        set: (next) => {
          store.dispatch({ type, payload: next });
        },
      };
      registerReduxState<ReduxSource>(plus, store, registration);
      return store;
    }
    const store = Reflect.apply(configure, undefined, native);
    if (registration !== undefined) registerReduxState<ReduxSource>(plus, store, registration);
    return store;
  }) as RpReduxCreator<F>;
}
