/** Register existing React state without introducing another state owner. */
import { useEffect, useMemo, useRef } from 'react';
import type { PageStateBridge, StateField } from '../core/types.js';
import { usePlusContext } from './provider.js';

export function useRegisterState<S>(
  key: string,
  value: S,
  write: (next: S) => void,
  options?: StateField<S>,
): void {
  const plus = usePlusContext();
  const current = useRef({ value, write });
  current.current = { value, write };
  const listeners = useMemo(() => new Set<() => void>(), []);
  const bridge = useMemo<PageStateBridge<S>>(
    () => ({
      read: () => current.current.value,
      write: (next) => current.current.write(next),
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    }),
    [listeners],
  );
  useEffect(() => plus.registerStateBridge(key, bridge, options), [plus, key, bridge, options]);
  const previous = useRef(value);
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    for (const listener of listeners) listener();
  }, [value, listeners]);
}
