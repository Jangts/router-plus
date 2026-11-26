/** Native React hooks with optional lifecycle-owned Router Plus registration. */
import {
  useState,
  useRef,
  useContext,
  useCallback,
  type Context,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
  type RefObject,
  type MutableRefObject,
} from 'react';
import { useReactState } from './existing-state.js';
import type { StateIdOrOptions } from '../core/types.js';

export function useRpState<S>(
  initial: S | (() => S),
  idOrOptions?: StateIdOrOptions<NoInfer<S>>,
): [S, Dispatch<SetStateAction<S>>];
export function useRpState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
];
export function useRpState<S>(initial?: S | (() => S), idOrOptions?: StateIdOrOptions<NoInfer<S>>) {
  const result = useState(initial);
  useReactState(result as [S, Dispatch<SetStateAction<S>>], idOrOptions);
  return result;
}
/**
 * Preserve the installed React version's complete native ref overloads, adding registration
 * only as a second argument. React 18's no-argument and mutable-ref cases stay native.
 * @param initial Native initial value; optional only when the installed React types allow it.
 * @param idOrOptions Optional registration ID/rules; omitted or undefined skips registration.
 * @returns The unchanged native ref.
 * @throws Registration errors follow useReactState's effect-stage contract.
 */
export const useRpRef: typeof useRef & {
  <T>(initial: T, idOrOptions: StateIdOrOptions<NoInfer<T>> | undefined): MutableRefObject<T>;
  <T>(
    initial: T | null,
    idOrOptions: StateIdOrOptions<NoInfer<T | null>> | undefined,
  ): RefObject<T | null>;
  <T>(
    initial: T | undefined,
    idOrOptions: StateIdOrOptions<NoInfer<T | undefined>> | undefined,
  ): MutableRefObject<T | undefined>;
} = function useRpRef(initial?: any, idOrOptions?: StateIdOrOptions<any>) {
  const result = useRef(initial);
  useReactState(result, idOrOptions);
  return result;
};
export function useRpContext<T>(
  context: Context<T>,
  idOrOptions?: StateIdOrOptions<NoInfer<T>>,
): T {
  const result = useContext(context);
  useReactState({ get: () => result }, idOrOptions);
  return result;
}
export function useRpCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: DependencyList,
  idOrOptions?: StateIdOrOptions<NoInfer<T>>,
): T {
  const result = useCallback(callback, dependencies);
  useReactState(result, idOrOptions);
  return result;
}
