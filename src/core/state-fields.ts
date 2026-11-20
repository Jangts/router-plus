/** Shared state validation and query ownership for native bindings and navigation snapshots. */
import type { PageDefinition, StateField, QueryEncoding } from './types.js';
import { cloneValue, isPlainObject as isObject } from './util.js';

/** JSON objects exclude class instances while accepting Vue proxies of plain objects. */
function isQueryObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function stateFields(
  page?: Pick<PageDefinition, 'states' | 'tabs' | 'defaultTab' | 'tabInUrl'>,
  tabKey = 'tab',
): Readonly<Record<string, StateField>> {
  return {
    ...(page?.tabs?.length
      ? {
          tab: {
            default: page.defaultTab ?? page.tabs[0].id,
            values: page.tabs.map((item) => item.id),
            query: page.tabInUrl ? tabKey : false,
          },
        }
      : {}),
    ...page?.states,
  };
}

export function validState(field: StateField, value: unknown): boolean {
  if (field.values && !field.values.some((item) => sameState({}, item, value))) return false;
  if (field.validate && !field.validate(value)) return false;
  if (field.fields) {
    if (!isQueryObject(value)) return false;
    for (const [key, rule] of Object.entries(field.fields))
      if (!validState(rule, value[key])) return false;
  }
  return true;
}

/** Non-scalars remain one complete JSON value at a field boundary. */
export function encodeState(field: StateField, value: unknown): string | undefined {
  if (field.encode) {
    const encoded = field.encode(value);
    if (encoded !== undefined && typeof encoded !== 'string')
      throw new Error('Field encoder must return a string or undefined');
    return encoded;
  }
  if (field.codec) return field.codec.encode(value);
  if (value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && !Number.isFinite(value))
    throw new Error('Query numbers must be finite');
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  const seen = new Set<object>();
  const check = (item: unknown): void => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return;
    if (typeof item === 'number' && Number.isFinite(item)) return;
    if (
      !item ||
      typeof item !== 'object' ||
      (!Array.isArray(item) && !isQueryObject(item)) ||
      seen.has(item)
    )
      throw new Error('Query value requires custom encoding');
    seen.add(item);
    for (const nested of Object.values(item)) check(nested);
    seen.delete(item);
  };
  check(value);
  const json = JSON.stringify(value);
  if (json === undefined) throw new Error('Query value requires custom encoding');
  return json;
}

export function decodeState(field: StateField, raw: string): unknown {
  if (field.decode) return field.decode(raw);
  if (field.codec) return field.codec.decode(raw);
  const sample = field.default !== undefined ? field.default : field.values?.[0];
  const value = typeof sample === 'string' || sample === undefined ? raw : JSON.parse(raw);
  if (sample === null && value !== null) throw new Error('Decoded query value must be null');
  if (sample !== undefined && sample !== null && typeof value !== typeof sample)
    throw new Error('Decoded query type does not match initial value');
  if (Array.isArray(sample) && !Array.isArray(value))
    throw new Error('Decoded query value must be an array');
  if (isQueryObject(sample) && !isQueryObject(value))
    throw new Error('Decoded query value must be an object');
  return value;
}

/** Root objects expand once; field values never recursively expand. */
function group(field: StateField): boolean {
  return isQueryObject(field.default) && typeof field.query !== 'string';
}
const compiledRules = new WeakMap<StateField, Readonly<Record<string, StateField>>>();
const compiledKeys = new WeakMap<StateField, Map<string, readonly string[]>>();
/** Cache only owned immutable rules; catalog/dynamic mutable objects stay uncached. */
function fixed(field: StateField): boolean {
  return (
    !field.catalog && Object.isFrozen(field) && (!field.fields || Object.isFrozen(field.fields))
  );
}
function rules(field: StateField): Readonly<Record<string, StateField>> {
  const cached = fixed(field) ? compiledRules.get(field) : undefined;
  if (cached) return cached;
  const initial = isQueryObject(field.default) ? field.default : {};
  const keys =
    field.query === true
      ? new Set([...Object.keys(initial), ...Object.keys(field.fields ?? {})])
      : new Set(Object.keys(field.fields ?? {}));
  const result = Object.fromEntries(
    [...keys].map((key) => [
      key,
      { default: initial[key], query: field.query === true, ...field.fields?.[key] },
    ]),
  );
  if (fixed(field)) compiledRules.set(field, result);
  return result;
}

export function queryKeys(id: string, field: StateField): readonly string[] {
  if (!fixed(field)) return computeQueryKeys(id, field);
  const cache = compiledKeys.get(field) ?? new Map<string, readonly string[]>();
  compiledKeys.set(field, cache);
  let keys = cache.get(id);
  if (!keys) {
    keys = Object.freeze([...computeQueryKeys(id, field)]);
    cache.set(id, keys);
  }
  return keys;
}
function computeQueryKeys(id: string, field: StateField): readonly string[] {
  if (Array.isArray(field.query)) return field.query;
  if (group(field) || field.fields)
    return Object.entries(rules(field)).flatMap(([key, rule]) =>
      rule.query ? [typeof rule.query === 'string' ? rule.query : key] : [],
    );
  return field.query ? [typeof field.query === 'string' ? field.query : id] : [];
}
function groupParams(encoded: QueryEncoding): URLSearchParams {
  if (encoded instanceof URLSearchParams) return new URLSearchParams(encoded);
  if (!encoded || typeof encoded === 'string')
    throw new Error('Group encoder must return query parameters');
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(encoded))
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      if (typeof item !== 'string') throw new Error('Group query values must be strings');
      result.append(key, item);
    }
  return result;
}
export function encodeQuery(id: string, field: StateField, value: unknown): URLSearchParams {
  const keys = queryKeys(id, field),
    output = new URLSearchParams();
  if (!keys.length) return output;
  if (group(field) && field.encode) {
    const encoded = groupParams(field.encode(value));
    for (const [key, item] of encoded) {
      if (!keys.includes(key)) throw new Error(`Encoder wrote an unowned query parameter: ${key}`);
      output.append(key, item);
    }
    return output;
  }
  if (group(field) || field.fields) {
    if (!isQueryObject(value)) throw new Error('Query group requires an object');
    for (const [key, rule] of Object.entries(rules(field))) {
      if (!rule.query) continue;
      const encoded = encodeState(rule, value[key]);
      if (encoded !== undefined)
        output.set(typeof rule.query === 'string' ? rule.query : key, encoded);
    }
  } else {
    const encoded = encodeState(field, value);
    if (encoded !== undefined) output.set(keys[0], encoded);
  }
  return output;
}
export function decodeQuery(
  id: string,
  field: StateField,
  query: URLSearchParams,
  current: unknown = field.default,
): unknown {
  const keys = queryKeys(id, field);
  if (field.groupDecode) {
    const owned = new URLSearchParams();
    for (const [key, value] of query) if (keys.includes(key)) owned.append(key, value);
    return field.groupDecode(owned);
  }
  if (group(field) || field.fields) {
    const output: Record<string, unknown> = { ...(isQueryObject(current) ? current : {}) };
    for (const [key, rule] of Object.entries(rules(field))) {
      if (!rule.query) continue;
      const name = typeof rule.query === 'string' ? rule.query : key,
        raw = query.getAll(name);
      if (raw.length > 1) throw new Error(`Duplicate query parameter: ${name}`);
      output[key] = raw.length ? decodeState(rule, raw[0]) : cloneValue(rule.default);
    }
    return output;
  }
  const raw = keys.length ? query.getAll(keys[0]) : [];
  if (raw.length > 1) throw new Error(`Duplicate query parameter: ${keys[0]}`);
  return raw.length ? decodeState(field, raw[0]) : cloneValue(field.default);
}
export function resolveStateValues(
  fields: Readonly<Record<string, StateField>>,
  search: string,
  history?: unknown,
): Record<string, unknown> {
  const query = new URLSearchParams(search),
    values: Record<string, unknown> = Object.create(null);
  for (const [key, field] of Object.entries(fields)) {
    if (field.navigation === false) continue;
    let value =
      isQueryObject(history) && Object.hasOwn(history, key)
        ? history[key]
        : cloneValue(field.default);
    try {
      if (queryKeys(key, field).length) value = decodeQuery(key, field, query, value);
    } catch {
      value = cloneValue(field.default);
    }
    if (!validState(field, value)) value = cloneValue(field.default);
    values[key] = value;
  }
  return values;
}
export function sameState(field: StateField, first: unknown, second: unknown): boolean {
  if (Object.is(first, second)) return true;
  if (!first || !second || typeof first !== 'object' || typeof second !== 'object') return false;
  try {
    return JSON.stringify(first) === JSON.stringify(second);
  } catch {
    return false;
  }
}

/** Compare only the bound address projection, leaving local object fields out of navigation. */
export function sameQueryState(
  id: string,
  field: StateField,
  first: unknown,
  second: unknown,
): boolean {
  if (!queryKeys(id, field).length) return sameState(field, first, second);
  try {
    return encodeQuery(id, field, first).toString() === encodeQuery(id, field, second).toString();
  } catch {
    return false;
  }
}

/** Recover malformed address values without discarding unbound native object fields. */
export function restoreQuery(
  id: string,
  field: StateField,
  query: URLSearchParams,
  current: unknown,
): unknown {
  try {
    const value = decodeQuery(id, field, query, current);
    if (validState(field, value)) return value;
  } catch {
    /* The router reports the original decoding error at the address boundary. */
  }
  try {
    return decodeQuery(id, field, new URLSearchParams(), current);
  } catch {
    return cloneValue(field.default);
  }
}
