/** Vue native reactive primitives register in their owning component or store effect scope. */
import {
  ref,
  reactive,
  computed,
  type Ref,
  type UnwrapRef,
  type UnwrapNestedRefs,
  type Reactive,
  type ComputedRef,
  type WritableComputedRef,
  type ComputedGetter,
  type WritableComputedOptions,
  type DebuggerOptions,
} from 'vue';
import { useVueState, type RefRegistration } from './existing-state.js';
import type { StateIdOrOptions } from '../core/types.js';

export function useRpRef<T extends Ref>(value: T, idOrOptions?: RefRegistration<T>): T;
export function useRpRef<T>(
  value: T extends Ref ? never : T,
  idOrOptions?: StateIdOrOptions<UnwrapRef<T>>,
): Ref<UnwrapRef<T>, UnwrapRef<T> | T>;
export function useRpRef<T = any>(): Ref<T | undefined>;
export function useRpRef(value?: unknown, idOrOptions?: StateIdOrOptions<any>): Ref<any> {
  const result = ref(value);
  useVueState(result, idOrOptions);
  return result;
}
export function useRpReactiveState<T extends object>(
  value: T,
  idOrOptions?: StateIdOrOptions<UnwrapNestedRefs<T>>,
): Reactive<T> {
  const result = reactive(value);
  useVueState(result as object, idOrOptions as StateIdOrOptions<object>);
  return result;
}
export function useRpComputedState<T>(
  getter: ComputedGetter<T>,
  idOrOptions?: StateIdOrOptions<T>,
): ComputedRef<T>;
export function useRpComputedState<T>(
  getter: ComputedGetter<T>,
  debug: DebuggerOptions | undefined,
  idOrOptions?: StateIdOrOptions<T>,
): ComputedRef<T>;
export function useRpComputedState<T, S = T>(
  options: WritableComputedOptions<T, S>,
  idOrOptions?: [T] extends [S] ? StateIdOrOptions<T> : never,
): WritableComputedRef<T, S>;
export function useRpComputedState<T, S = T>(
  options: WritableComputedOptions<T, S>,
  debug: DebuggerOptions | undefined,
  idOrOptions?: [T] extends [S] ? StateIdOrOptions<T> : never,
): WritableComputedRef<T, S>;
export function useRpComputedState(
  getter: ComputedGetter<any> | WritableComputedOptions<any>,
  debugOrOptions?: DebuggerOptions | StateIdOrOptions<any>,
  options?: StateIdOrOptions<any>,
): ComputedRef<any> {
  const binding =
    typeof debugOrOptions === 'string' || (debugOrOptions && 'id' in debugOrOptions)
      ? (debugOrOptions as StateIdOrOptions<any>)
      : options;
  const debug =
    binding === debugOrOptions ? undefined : (debugOrOptions as DebuggerOptions | undefined);
  const result = typeof getter === 'function' ? computed(getter, debug) : computed(getter, debug);
  useVueState(result, binding);
  return result;
}
