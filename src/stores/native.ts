/** Shared argument parsing and data projection; native store ownership stays in each adapter. */
import type { StateIdOrOptions, StateBindingOptions } from '../core/types.js';

export function splitBindingArguments(args: unknown[]): {
  native: unknown[];
  options?: StateIdOrOptions<unknown>;
} {
  const last = args.at(-1),
    has =
      args.length > 1 &&
      (typeof last === 'string' || (last !== null && typeof last === 'object' && 'id' in last));
  return {
    native: has ? args.slice(0, -1) : args,
    options: has ? (last as StateIdOrOptions<unknown>) : undefined,
  };
}
/** Data-only index projection; native store results keep their full original type. */
export type DataState<S> = S extends (...args: never[]) => unknown
  ? S
  : S extends readonly unknown[]
    ? S
    : S extends object
      ? { [K in keyof S as S[K] extends (...args: never[]) => unknown ? never : K]: S[K] }
      : S;
export function dataValues<S>(value: S): DataState<S> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value as DataState<S>;
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item !== 'function'),
  ) as DataState<S>;
}
/** Store-only setters are extracted before navigation rules reach Core. */
export type StoreStateOptions<S> =
  string | (StateBindingOptions<S> & { readonly set?: (next: S) => void | Promise<void> });
export function storeOptions<S>(options: StoreStateOptions<S>): {
  rules: StateIdOrOptions<S>;
  set?: (next: S) => void | Promise<void>;
} {
  if (typeof options === 'string') return { rules: options };
  const { set, ...rules } = options;
  if (set !== undefined && typeof set !== 'function')
    throw new Error('State write adapter must be callable');
  return { rules, set };
}
