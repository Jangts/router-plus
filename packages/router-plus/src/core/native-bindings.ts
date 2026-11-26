/** Internal access index for framework-owned sources; no live values are stored here. */
import type {
  PageStateBridge,
  RouterPlus,
  StateField,
  StateIdOrOptions,
  PageContext,
} from './types.js';
import { queryKeys, encodeQuery, assertStateRules, stateReady } from './state-fields.js';
import { isPlainObject } from './util.js';

/** A framework render may prepare a weakly held facade, then publish it only after commit. */
export interface PreparedScope {
  readonly facade: RouterPlus;
  commit(): void;
}
interface BindingHost {
  committed(source: PageStateBridge, changed?: boolean): void;
  refresh(source: PageStateBridge): void;
  prepare(context: PageContext): PreparedScope;
  batch(run: () => void): void;
  own(stop: () => void): () => void;
  bind(id: string, source: PageStateBridge, rules: StateField, global: boolean): () => void;
}
const hosts = new WeakMap<RouterPlus, BindingHost>();
/** Notify an installed source's framework publication without reading its current value. */
export function publishNativeCommit(
  plus: RouterPlus,
  source: PageStateBridge,
  changed = false,
): void {
  hosts.get(plus)?.committed(source, changed);
}
/** Observe dependency readiness without publishing application lifecycle events inside a reactive effect. */
export function refreshNativeBinding(plus: RouterPlus, source: PageStateBridge): void {
  hosts.get(plus)?.refresh(source);
}
export function attachBindingHost(plus: RouterPlus, host: BindingHost): void {
  hosts.set(plus, host);
}

/** Prepare a context facade without publishing a Core scope during speculative rendering. */
export function prepareNativeScope(plus: RouterPlus, context: PageContext): PreparedScope {
  const host = hosts.get(plus);
  if (!host) throw new Error('Router Plus binding owner is unavailable');
  return host.prepare(context);
}

/** Capture the native initial value once, including proxies, without cloning callable owners. */
export function snapshotSource<S>(value: S, seen = new WeakMap<object, unknown>()): S {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as S;
  if (value instanceof Date) return new Date(value.getTime()) as S;
  if (value instanceof Map) {
    const result = new Map();
    seen.set(value, result);
    for (const [key, item] of value)
      result.set(snapshotSource(key, seen), snapshotSource(item, seen));
    return result as S;
  }
  if (value instanceof Set) {
    const result = new Set();
    seen.set(value, result);
    for (const item of value) result.add(snapshotSource(item, seen));
    return result as S;
  }
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return value;
  const result = Array.isArray(value) ? [] : Object.create(prototype);
  seen.set(value, result);
  for (const key of Object.keys(value))
    Object.defineProperty(result, key, {
      enumerable: true,
      writable: true,
      configurable: true,
      value: snapshotSource((value as Record<string, unknown>)[key], seen),
    });
  return result as S;
}

/** Own fixed registration rules, without freezing the caller's configuration or native values. */
function freezeRules(field: StateField): StateField {
  return Object.freeze({
    ...field,
    query: Array.isArray(field.query) ? Object.freeze([...field.query]) : field.query,
    values: field.values
      ? Object.freeze(field.values.map((value) => snapshotSource(value)))
      : undefined,
    fields: field.fields
      ? Object.freeze(
          Object.fromEntries(
            Object.entries(field.fields).map(([key, value]) => [key, freezeRules(value)]),
          ),
        )
      : undefined,
  });
}

/** Framework-specific registrars adapt sources to one binding host. */
export function bindNativeSource<S>(
  plus: RouterPlus,
  source: PageStateBridge<S>,
  idOrOptions: StateIdOrOptions<S>,
  global = false,
  initialValue?: { value: S },
  parentId?: string,
): () => void {
  const options = typeof idOrOptions === 'string' ? { id: idOrOptions } : idOrOptions;
  if (!options.id || options.id.trim() !== options.id)
    throw new Error('State binding requires a nonempty stable id');
  const initial = snapshotSource(initialValue ? initialValue.value : source.read());
  const { id, decode, ...configuration } = options;
  const rules = freezeRules({
    ...configuration,
    ...(parentId === undefined ? {} : { sourceParentId: parentId }),
    default: initial,
    ...(decode ? (isPlainObject(initial) ? { groupDecode: decode } : { decode }) : {}),
  } as StateField);
  assertStateRules(rules);
  const owned = queryKeys(id, rules);
  if (new Set(owned).size !== owned.length) throw new Error(`Duplicate query ownership: ${id}`);
  if (owned.length && stateReady(rules)) {
    encodeQuery(id, rules, initial);
    encodeQuery(id, rules, source.read());
  }
  const host = hosts.get(plus);
  if (!host) throw new Error('Router Plus binding owner is unavailable');
  return host.bind(id, source as PageStateBridge, rules, global);
}

/** Aggregate a store registration transaction and connect its cleanup to the owner. */
export function registerSourceGroup(
  plus: RouterPlus,
  run: (collect: (stop: () => void) => void) => void,
): () => void {
  const host = hosts.get(plus);
  if (!host) throw new Error('Router Plus binding owner is unavailable');
  let stops: (() => void)[] = [];
  const stop = () => {
    const pending = stops;
    stops = [];
    for (const release of pending.reverse()) release();
  };
  try {
    host.batch(() => run((release) => stops.push(release)));
  } catch (error) {
    stop();
    throw error;
  }
  return host.own(stop);
}

/** Keep callback rules current after framework commit while keeping registration metadata stable. */
export function liveBindingOptions<S>(get: () => StateIdOrOptions<S>): StateIdOrOptions<S> {
  const initial = get();
  if (typeof initial === 'string') return initial;
  const read = () => get() as Exclude<StateIdOrOptions<S>, string>;
  return {
    ...initial,
    ...(initial.ready ? { ready: () => read().ready?.() ?? true } : {}),
    ...(initial.encode ? { encode: (value: S) => (read().encode ?? initial.encode)!(value) } : {}),
    ...(initial.decode
      ? {
          decode: (raw: unknown) => ((read().decode ?? initial.decode) as (raw: unknown) => S)(raw),
        }
      : {}),
    ...(initial.validate ? { validate: (value: unknown) => read().validate?.(value) ?? true } : {}),
    fields:
      initial.fields &&
      Object.fromEntries(
        Object.entries(initial.fields as Record<string, StateField>).map(([key, rule]) => [
          key,
          {
            ...rule,
            ...(rule?.encode
              ? {
                  encode: (value: unknown) =>
                    ((read().fields as Record<string, StateField>)?.[key]?.encode ?? rule.encode)!(
                      value,
                    ),
                }
              : {}),
            ...(rule?.decode
              ? {
                  decode: (raw: string) =>
                    ((read().fields as Record<string, StateField>)?.[key]?.decode ?? rule.decode)!(
                      raw,
                    ),
                }
              : {}),
            ...(rule?.validate
              ? {
                  validate: (value: unknown) =>
                    (read().fields as Record<string, StateField>)?.[key]?.validate?.(value) ?? true,
                }
              : {}),
          },
        ]),
      ),
  } as StateIdOrOptions<S>;
}
