/** Coordinate same-turn query edits against the latest address, without a second persistent store. */
import type {
  CommandResult,
  NavigateOptions,
  RouterPlus,
  PageContext,
  QueryRecord,
  StateField,
} from './types.js';
import { queryKeys, encodeQuery, stateReady, validState } from './state-fields.js';
import { toErrorMessage } from './util.js';

export type PageQueryInit =
  | string
  | URLSearchParams
  | Record<string, string | readonly string[]>
  | readonly (readonly [string, string])[];
export type QueryUpdate = PageQueryInit | ((previous: URLSearchParams) => PageQueryInit);

/** Preserve repeated parameters for native-style object and tuple inputs. */
export function createPageQuery(value?: PageQueryInit): URLSearchParams {
  if (value && typeof (value as { then?: unknown }).then === 'function') {
    void Promise.resolve(value).catch(() => {});
    throw new TypeError('Query input must be synchronous');
  }
  if (value === undefined || typeof value === 'string' || value instanceof URLSearchParams)
    return new URLSearchParams(value);
  if (Array.isArray(value)) return new URLSearchParams(value.map(([key, item]) => [key, item]));
  const result = new URLSearchParams();
  for (const [key, items] of Object.entries(value))
    for (const item of Array.isArray(items) ? items : [items]) result.append(key, item);
  return result;
}
interface AddressMetadata {
  preserveHistory?: boolean;
  values?: Readonly<Record<string, unknown>>;
  check?: () => CommandResult | undefined;
}
interface Edit extends AddressMetadata {
  facade: RouterPlus;
  next: QueryUpdate;
  options?: NavigateOptions;
  skipUnchanged: boolean;
  resolve(result: CommandResult): void;
}
interface Batch {
  initial: PageContext;
  ownerBaseline: PageContext;
  fallback: URLSearchParams;
  edits: Edit[];
  prior?: Proposal;
}
interface Proposal {
  baseline: PageContext;
  ownerBaseline: PageContext;
  query: URLSearchParams;
  values: Readonly<Record<string, unknown>>;
}
const owners = new WeakMap<RouterPlus, RouterPlus>();
const pending = new WeakMap<RouterPlus, Map<string, Batch>>();
/** Transient proposals only; successful or failed navigation releases the entry. */
const proposals = new WeakMap<RouterPlus, Map<string, Proposal>>();

/** Attach one concrete facade to its Core coordinator without changing its scope semantics. */
export function attachQueryOwner(facade: RouterPlus, owner: RouterPlus): void {
  owners.set(facade, owners.get(owner) ?? owner);
}
function sameAddress(first: PageContext, second: PageContext): boolean {
  return (
    first.path === second.path &&
    first.instance?.stateKey === second.instance?.stateKey &&
    first.location.entryKey === second.location.entryKey
  );
}
/** Rebase only an already-known Plus proposal, never an arbitrary native/external location. */
function followsProposal(initial: PageContext, current: PageContext, prior?: Proposal): boolean {
  return Boolean(
    prior &&
    sameAddress(initial, prior.baseline) &&
    initial.instance?.stateKey === current.instance?.stateKey &&
    initial.pathname === current.pathname &&
    current.hash === prior.baseline.hash &&
    current.location.navigationId &&
    current.location.navigationId !== initial.location.navigationId &&
    new URLSearchParams(current.search).toString() === prior.query.toString(),
  );
}
function groupKey(context: PageContext): string {
  return JSON.stringify([context.instance?.stateKey, context.path, context.location.entryKey]);
}

/** Coordinate all facades targeting the same concrete scope and address. */
export function updatePageQuery(
  plus: RouterPlus,
  next: QueryUpdate,
  options?: NavigateOptions,
  defaults?: PageQueryInit,
  skipUnchanged = false,
  metadata?: AddressMetadata,
): Promise<CommandResult> {
  let prepared: QueryUpdate, initial: PageContext, fallback: URLSearchParams;
  const owner = owners.get(plus) ?? plus;
  let ownerBaseline: PageContext;
  try {
    prepared = typeof next === 'function' ? next : createPageQuery(next);
    fallback = createPageQuery(defaults);
  } catch (error) {
    return Promise.resolve({ ok: false, reason: 'failed', message: toErrorMessage(error) });
  }
  try {
    initial = plus.getContext();
    ownerBaseline = owner.getContext();
  } catch (error) {
    return plus
      .execute({ kind: 'context.read' })
      .then((result) =>
        result.ok ? { ok: false, reason: 'failed', message: toErrorMessage(error) } : result,
      );
  }
  return new Promise((resolve) => {
    const edit: Edit = {
      ...metadata,
      facade: plus,
      next: prepared,
      options: options && { ...options },
      skipUnchanged,
      resolve,
    };
    const key = groupKey(initial);
    const groups = pending.get(owner) ?? new Map<string, Batch>();
    pending.set(owner, groups);
    const existing = groups.get(key);
    if (existing && sameAddress(existing.ownerBaseline, ownerBaseline)) {
      existing.edits.push(edit);
      return;
    }
    const batch: Batch = {
      initial,
      ownerBaseline,
      fallback,
      edits: [edit],
      prior: proposals.get(owner)?.get(key),
    };
    groups.set(key, batch);
    queueMicrotask(() =>
      queueMicrotask(async () => {
        if (groups.get(key) === batch) groups.delete(key);
        if (!groups.size && pending.get(owner) === groups) pending.delete(owner);
        let active: Edit[] = [];
        let proposal: Proposal | undefined;
        let flights: Map<string, Proposal> | undefined;
        try {
          const checked = await Promise.all(
            batch.edits.map(async (item) => {
              const receipt = await item.facade.execute({ kind: 'context.read' });
              if (!receipt.ok) {
                item.resolve(receipt);
                return null;
              }
              return item;
            }),
          );
          active = checked.filter((item): item is Edit => {
            if (!item) return false;
            try {
              const rejected = item.check?.();
              if (rejected) {
                item.resolve(rejected);
                return false;
              }
              const context = item.facade.getContext();
              if (
                sameAddress(context, batch.initial) ||
                followsProposal(batch.initial, context, batch.prior)
              )
                return true;
              item.resolve({ ok: false, reason: 'superseded' });
            } catch {
              item.resolve({ ok: false, reason: 'cancelled' });
            }
            return false;
          });
          if (!active.length) return;
          if (
            !sameAddress(owner.getContext(), batch.ownerBaseline) &&
            !followsProposal(batch.ownerBaseline, owner.getContext(), batch.prior)
          ) {
            for (const item of active) item.resolve({ ok: false, reason: 'superseded' });
            return;
          }
          const current = active[0].facade.getContext();
          flights = proposals.get(owner) ?? new Map<string, Proposal>();
          const earlier = flights.get(key);
          const continuing =
            earlier &&
            sameAddress(earlier.baseline, current) &&
            sameAddress(earlier.ownerBaseline, owner.getContext());
          let query = createPageQuery(
            continuing ? earlier.query : current.search || batch.fallback,
          );
          const last = active[active.length - 1];
          const preserved = last.preserveHistory
            ? Object.fromEntries(
                Object.entries(current.values).filter(([id]) => {
                  const field = current.page?.states?.[id];
                  return field && field.navigation !== false && !queryKeys(id, field).length;
                }),
              )
            : {};
          const values: Record<string, unknown> = Object.assign(
            Object.create(null),
            preserved,
            continuing ? earlier.values : {},
          );
          for (const item of active) {
            Object.assign(values, item.values);
            query = createPageQuery(
              typeof item.next === 'function' ? item.next(new URLSearchParams(query)) : item.next,
            );
          }
          if (
            active.every((item) => item.skipUnchanged) &&
            !continuing &&
            sameQueryParameters(query, new URLSearchParams(current.search)) &&
            active.every((item) => item.options?.state === undefined)
          ) {
            for (const item of active) item.resolve({ ok: false, reason: 'noop' });
            return;
          }
          proposal = { baseline: current, ownerBaseline: owner.getContext(), query, values };
          proposals.set(owner, flights);
          flights.set(key, proposal);
          const search = query.toString();
          const result = await last.facade.navigate(
            {
              pathname: current.pathname,
              search: search ? '?' + search : '',
              hash: current.hash,
              values: Object.keys(values).length ? values : undefined,
            },
            last.preserveHistory && last.options?.state === undefined
              ? { ...last.options, state: current.location.state }
              : last.options,
          );
          for (const item of active) item.resolve(result);
        } catch (error) {
          for (const item of batch.edits)
            item.resolve({ ok: false, reason: 'failed', message: toErrorMessage(error) });
        } finally {
          if (proposal && flights?.get(key) === proposal) flights.delete(key);
          if (flights && !flights.size && proposals.get(owner) === flights) proposals.delete(owner);
        }
      }),
    );
  });
}

/** Native state and direct query edits use one temporary address transaction. */
export function updateStateQuery(
  plus: RouterPlus,
  values: Readonly<Record<string, unknown>>,
  changedIds: readonly string[],
  fields: Readonly<Record<string, StateField>>,
  options?: NavigateOptions,
  active?: () => boolean,
): Promise<CommandResult> {
  const check = (): CommandResult | undefined => {
    if (active && !active()) return { ok: false, reason: 'cancelled' };
    for (const id of changedIds) {
      const field = fields[id];
      if (!field) return { ok: false, reason: 'state-unknown' };
      if (!stateReady(field)) return { ok: false, reason: 'not-ready' };
      if (!validState(field, values[id])) return { ok: false, reason: 'invalid-target' };
    }
  };
  const localValues = Object.fromEntries(
    Object.entries(values).filter(([id]) => fields[id] && !queryKeys(id, fields[id]).length),
  );
  return updatePageQuery(
    plus,
    (query) => {
      for (const id of changedIds) {
        const field = fields[id],
          keys = queryKeys(id, field);
        for (const key of keys) query.delete(key);
        for (const [key, value] of encodeQuery(id, field, values[id])) query.append(key, value);
      }
      return query;
    },
    options,
    undefined,
    false,
    { values: localValues, check },
  );
}

/** Parameter order between different names is not a change; repeated-value order remains meaningful. */
function sameQueryParameters(first: URLSearchParams, second: URLSearchParams): boolean {
  const keys = new Set([...first.keys(), ...second.keys()]);
  return [...keys].every((key) => {
    const a = first.getAll(key),
      b = second.getAll(key);
    return a.length === b.length && a.every((value, index) => value === b[index]);
  });
}

/** Patch only named parameters while sharing query batching, receipts and address lifetime. */
export function patchPageQuery(
  plus: RouterPlus,
  patch: QueryRecord,
  options?: NavigateOptions,
  _defaults?: PageQueryInit,
): Promise<CommandResult> {
  let entries: (readonly [string, string[]])[];
  try {
    entries = Object.entries(patch).map(
      ([key, value]) =>
        [key, value === undefined ? [] : typeof value === 'string' ? [value] : [...value]] as const,
    );
  } catch (error) {
    return Promise.resolve({ ok: false, reason: 'failed', message: toErrorMessage(error) });
  }
  return updatePageQuery(
    plus,
    (previous) => {
      for (const [key, values] of entries) {
        previous.delete(key);
        for (const value of values) previous.append(key, value);
      }
      return previous;
    },
    options,
    undefined,
    true,
    { preserveHistory: true },
  );
}
