/**
 * Controllable page-state bridge for tests.
 */
import type { PageStateBridge } from '../core/types.js';

export interface FakeBridge<S> extends PageStateBridge<S> {
  readonly value: S;
  readonly listeners: ReadonlySet<() => void>;
  set(next: S): void;
}

export function createFakeBridge<S>(initial: S): FakeBridge<S> {
  let value = initial;
  const listeners = new Set<() => void>();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  return {
    get value() {
      return value;
    },
    get listeners() {
      return listeners;
    },
    read: () => value,
    write(next) {
      value = next;
      emit();
    },
    patch(patch) {
      value = { ...(value as Record<string, unknown>), ...patch } as S;
      emit();
    },
    reset() {
      value = initial;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: () => value,
    restore(next) {
      value = next as S;
      emit();
    },
    set(next) {
      value = next;
      emit();
    },
  };
}
