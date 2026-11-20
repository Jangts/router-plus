/**
 * Context construction and guard evaluation.
 *
 * The navigation orchestrator lives in `router.ts`; this module holds the pure parts so tests
 * can cover address normalization, tab restoration and guard decisions without a connection.
 */
import { stateFields, resolveStateValues } from './state-fields.js';
import type { CatalogRuntime } from './catalog.js';
import type { RouteMatcher } from './matcher.js';
import { pageIdOf } from './matcher.js';
import { type HistoryRecord } from './history.js';
import { createInstance, computeInstanceKey } from './instances.js';
import type {
  GlobalGuard,
  GuardResult,
  InstanceKeyStrategy,
  PageContext,
  PageDefinition,
  PageLinkOptions,
  PageTarget,
  RouterLocation,
} from './types.js';
import { normalizePathname, parseSearch, queryRecord, splitHref } from './util.js';

export type GuardOutcome =
  | { readonly kind: 'allow' }
  | { readonly kind: 'block'; readonly message?: string }
  | { readonly kind: 'redirect'; readonly target: PageTarget };

export function evaluateGuard(result: GuardResult): GuardOutcome {
  if (result === true) return { kind: 'allow' };
  if (result === false) return { kind: 'block' };
  if ('redirect' in result) return { kind: 'redirect', target: result.redirect };
  return { kind: 'block', message: result.message };
}

/** Build a page context from an address and the optional history record. */
export function buildPageContext(
  location: RouterLocation,
  catalog: CatalogRuntime,
  matcher: RouteMatcher,
  pageLink: PageLinkOptions | undefined,
  history: HistoryRecord | null,
  customInstanceKeys?: ReadonlyMap<string, InstanceKeyStrategy>,
): PageContext {
  const {
    pathname: rawPathname,
    search,
    hash,
  } = splitHref(`${location.pathname}${location.search}${location.hash}`);
  const pathname = normalizePathname(rawPathname);
  let matched = catalog.match(pathname);
  if (location.matched?.length) {
    const unique = new Set<string>();
    for (const item of location.matched) {
      if (unique.has(item.pageId) || !catalog.byId.has(item.pageId))
        throw new Error(`Invalid framework page mapping: ${item.pageId}`);
      unique.add(item.pageId);
    }
    const authority = location.matched[location.matched.length - 1];
    matched = {
      entry: catalog.catalog.get(authority.pageId)!,
      definition: catalog.byId.get(authority.pageId)!,
      params: authority.params,
    };
  }
  const queryAll = parseSearch(search);
  const query = queryRecord(queryAll);

  if (!matched) {
    return {
      pageId: null,
      path: `${pathname}${search}${hash}`,
      pathname,
      search,
      hash,
      params: {},
      query,
      queryAll,
      tab: null,
      values: {},
      instance: null,
      page: null,
      location,
    };
  }

  const definition = matched.definition;
  const pageId = pageIdOf(definition);
  const preliminary: PageContext = {
    pageId,
    title: definition.title,
    path: `${pathname}${search}${hash}`,
    pathname,
    search,
    hash,
    params: matched.params,
    query,
    queryAll,
    tab: null,
    values: {},
    instance: null,
    page: matched.entry,
    location,
  };
  const instanceKey = computeInstanceKey(definition.instanceKey, preliminary, customInstanceKeys);
  const saved =
    history?.path === pathname && history.instanceKey === instanceKey
      ? (history.values ?? (history.tab !== null ? { tab: history.tab } : undefined))
      : undefined;
  const values = resolveStateValues(stateFields(definition, pageLink?.tabKey), search, saved);
  const tab = typeof values.tab === 'string' ? values.tab : null;
  const instance = createInstance(matched.entry, instanceKey, tab, false);
  return { ...preliminary, values, tab, instance };
}

/** Evaluate global guards and one page's guard in order. */
export async function runGuardList(
  guards: readonly GlobalGuard[],
  page: PageDefinition | undefined,
  phase: 'beforeLeave' | 'beforeEnter',
  context: PageContext,
  signal: AbortSignal,
): Promise<GuardOutcome> {
  for (const guard of guards) {
    signal.throwIfAborted();
    const handler = guard[phase];
    if (!handler) continue;
    const outcome = evaluateGuard(await handler.call(guard, context));
    if (outcome.kind !== 'allow') return outcome;
  }
  const pageGuard = page?.guards?.[phase];
  if (pageGuard) {
    const outcome = evaluateGuard(
      await pageGuard.call(page!.guards, {
        context,
        page: page!,
        signal,
      }),
    );
    if (outcome.kind !== 'allow') return outcome;
  }
  return { kind: 'allow' };
}

/** Materialise the context that a plan will produce after commit. */
export function contextForPlan(
  plan: Extract<import('./types.js').NavigationPlan, { kind: 'page' }>,
  catalog: CatalogRuntime,
  matcher: RouteMatcher,
  pageLink: PageLinkOptions | undefined,
  location: RouterLocation,
  customInstanceKeys?: ReadonlyMap<string, InstanceKeyStrategy>,
  explicitTab?: string,
  explicitValues?: Readonly<Record<string, unknown>>,
): PageContext {
  const parts = splitHref(plan.href);
  const context = buildPageContext(
    {
      ...location,
      pathname: parts.pathname,
      search: parts.search,
      hash: parts.hash,
      state: undefined,
    },
    catalog,
    matcher,
    pageLink,
    null,
    customInstanceKeys,
  );
  if (!explicitTab && !explicitValues) return context;
  const values = {
    ...context.values,
    ...explicitValues,
    ...(explicitTab ? { tab: explicitTab } : {}),
  };
  const tab = typeof values.tab === 'string' ? values.tab : null;
  return {
    ...context,
    values,
    tab,
    instance: context.instance ? { ...context.instance, tab } : null,
  };
}
