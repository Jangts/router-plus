/**
 * Shared store-slice bridge factory.
 *
 * Helpers only map an existing store slice to the `PageStateBridge` contract; they never take
 * ownership of the store or introduce a second source of truth.
 */
import type { PageStateBridge } from '../core/types.js';

export interface StoreBridgeOptions<Store, S> {
  readonly store: Store;
  readonly select: (store: Store) => S;
  readonly write?: (store: Store, value: S) => void | Promise<void>;
  readonly equal?: (previous: S, next: S) => boolean;
  readonly patch?: (store: Store, value: Partial<S>) => void | Promise<void>;
  readonly reset?: (store: Store) => void | Promise<void>;
  readonly subscribe?: (store: Store, listener: () => void) => () => void;
  readonly snapshot?: (store: Store) => unknown | Promise<unknown>;
  readonly restore?: (store: Store, value: unknown) => void | Promise<void>;
}

export function createStoreBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S> {
  const { store } = options;
  return {
    read: () => options.select(store),
    ...(options.write ? { write: (next: S) => options.write!(store, next) } : {}),
    ...(options.patch
      ? {
          ...(!options.write
            ? { write: (next: S) => options.patch!(store, next as Partial<S>) }
            : {}),
          patch: (value: Record<string, unknown>) => options.patch!(store, value as Partial<S>),
        }
      : {}),
    ...(options.reset ? { reset: () => options.reset!(store) } : {}),
    ...(options.subscribe
      ? {
          subscribe: (listener: () => void) => {
            let previous = options.select(store);
            return options.subscribe!(store, () => {
              const next = options.select(store);
              if (options.equal && options.equal(previous, next)) return;
              previous = next;
              listener();
            });
          },
        }
      : {}),
    ...(options.snapshot ? { snapshot: () => options.snapshot!(store) } : {}),
    ...(options.restore ? { restore: (value: unknown) => options.restore!(store, value) } : {}),
  };
}
