/** Vue ref/reactive adapters retain the caller's original reactive source. */
import { isRef, watch, type Ref } from 'vue';
import type { PageStateBridge } from '../core/types.js';

export function createVueStateBridge<S>(source: Ref<S>): PageStateBridge<S>;
export function createVueStateBridge<S extends Record<string, unknown>>(
  source: S,
): PageStateBridge<S>;
export function createVueStateBridge(
  source: Ref<unknown> | Record<string, unknown>,
): PageStateBridge {
  const read = () => (isRef(source) ? source.value : source);
  return {
    read,
    write(next) {
      if (isRef(source)) {
        source.value = next;
        return;
      }
      if (!next || typeof next !== 'object' || Array.isArray(next))
        throw new Error('Reactive state requires an object');
      for (const key of Object.keys(source)) if (!Object.hasOwn(next, key)) delete source[key];
      Object.assign(source, next);
    },
    subscribe: (listener) => watch(read, listener, { deep: true, flush: 'sync' }),
  };
}
