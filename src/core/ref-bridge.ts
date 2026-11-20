/**
 * Adapt a plain mutable ref without polling or copying its value.
 * Direct mutations require a caller-supplied subscription to update a bound address.
 */
import type { PageStateBridge } from './types.js';

export function createRefStateBridge<S>(
  ref: { current: S },
  subscribe?: (listener: () => void) => () => void,
): PageStateBridge<S> {
  return {
    read: () => ref.current,
    write: (next) => {
      ref.current = next;
    },
    subscribe,
  };
}
