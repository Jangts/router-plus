import {
  stateFields,
  validState,
  encodeQuery,
  decodeQuery,
  queryKeys,
  resolveStateValues,
} from './state-fields.js';
/**
 * Link resolution and the page-link codec.
 *
 * `resolveLink` is synchronous and side-effect free. It validates package contracts only:
 * URL structure, dangerous schemes, duplicate protocol parameters and tab membership. Business
 * policy (allowed routes, permissions, query meaning) stays with the caller.
 */
import type { CatalogRuntime } from './catalog.js';
import { pageIdOf, type RouteMatcher } from './matcher.js';
import type {
  CommandReason,
  LinkProtocol,
  LinkResolution,
  LinkTarget,
  PageLinkOptions,
  RouterLocation,
} from './types.js';
import {
  buildSearch,
  isDangerousScheme,
  isValidSegment,
  normalizePathname,
  parseHttpUrl,
  parseSearch,
  queryRecord,
  schemeOf,
  splitHref,
} from './util.js';

export type ResolveOutcome =
  | { readonly ok: true; readonly resolution: LinkResolution }
  | { readonly ok: false; readonly reason: CommandReason; readonly message?: string };

const MAX_PROTOCOL_DEPTH = 8;

/** Link protocol registry with duplicate and cycle protection. */
export class LinkRegistry {
  private readonly protocols = new Map<string, LinkProtocol>();

  register(protocol: LinkProtocol): () => void {
    const scheme = protocol.scheme.toLowerCase();
    if (this.protocols.has(scheme)) throw new Error(`Link protocol already registered: ${scheme}`);
    this.protocols.set(scheme, protocol);
    return () => {
      if (this.protocols.get(scheme) === protocol) this.protocols.delete(scheme);
    };
  }

  get(scheme: string): LinkProtocol | undefined {
    return this.protocols.get(scheme.toLowerCase());
  }

  list(): readonly string[] {
    return [...this.protocols.keys()];
  }
}

interface ResolveContext {
  readonly runtime: CatalogRuntime;
  readonly registry: LinkRegistry;
  readonly pageLink?: PageLinkOptions;
  readonly matcher: RouteMatcher;
  readonly location: RouterLocation;
  readonly origin?: string;
}

function splitQueryAndHash(href: string): { pathname: string; search: string; hash: string } {
  return splitHref(href);
}

/** Validate pathname segments without interpreting business meaning. */
function validPathname(pathname: string): boolean {
  if (pathname === '/') return true;
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return false;
  if (/[\\\u0000-\u0020\u007f]/u.test(pathname)) return false;
  const segments = pathname.split('/').slice(1);
  for (const segment of segments) {
    if (!segment) return false;
    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return false;
    }
    if (!isValidSegment(decoded)) return false;
  }
  return true;
}

function resolvePageHref(
  href: string,
  context: ResolveContext,
  explicitTab: string | undefined,
  state: unknown,
  replace: boolean | undefined,
  knownDefinitionId: string | undefined,
  explicitValues?: Readonly<Record<string, unknown>>,
): ResolveOutcome {
  const { pathname: rawPathname, search, hash } = splitQueryAndHash(href);
  if (schemeOf(rawPathname)) return { ok: false, reason: 'invalid-target' };
  const pathname = normalizePathname(rawPathname);
  if (!validPathname(pathname)) return { ok: false, reason: 'invalid-target', message: '非法路径' };
  const queryAll = parseSearch(search);
  const matched = context.runtime.match(pathname);
  let pageId = matched ? pageIdOf(matched.definition) : null;
  if (knownDefinitionId) pageId = knownDefinitionId;
  const fields = stateFields(matched?.definition, context.pageLink?.tabKey);
  const supplied = {
    ...explicitValues,
    ...(explicitTab !== undefined ? { tab: explicitTab } : {}),
  };
  const query = new URLSearchParams(search);
  let queryChanged = false;
  for (const [key, value] of Object.entries(supplied)) {
    if (!Object.hasOwn(fields, key) || !validState(fields[key], value))
      return { ok: false, reason: key === 'tab' ? 'invalid-tab' : 'invalid-target' };
    const field = fields[key],
      keys = queryKeys(key, field);
    if (keys.length) {
      for (const name of keys) query.delete(name);
      for (const [name, item] of encodeQuery(key, field, value)) query.append(name, item);
      queryChanged = true;
    }
  }
  for (const [key, field] of Object.entries(fields)) {
    if (!queryKeys(key, field).some((name) => query.has(name))) continue;
    try {
      if (!validState(field, decodeQuery(key, field, query)))
        return { ok: false, reason: 'invalid-target' };
    } catch {
      return { ok: false, reason: 'invalid-target' };
    }
  }
  const effectiveSearch = queryChanged ? (query.toString() ? `?${query}` : '') : search;
  const values = { ...resolveStateValues(fields, effectiveSearch), ...supplied };
  const tab = typeof values.tab === 'string' ? values.tab : null;
  return {
    ok: true,
    resolution: {
      kind: 'page',
      href: `${pathname}${effectiveSearch}${hash}`,
      pageId,
      path: pathname,
      params: matched?.params ?? {},
      query: queryRecord(parseSearch(effectiveSearch)),
      queryAll: parseSearch(effectiveSearch),
      values,
      ...(tab !== null ? { tab } : {}),
      ...(state !== undefined ? { state } : {}),
      ...(replace !== undefined ? { replace } : {}),
    },
  };
}

function resolveStringTarget(
  value: string,
  context: ResolveContext,
  depth: number,
  seen: Set<string>,
): ResolveOutcome {
  if (value.length === 0 || /[\\\u0000-\u001f\u007f]/u.test(value)) {
    return { ok: false, reason: 'invalid-target' };
  }
  if (value.startsWith('#')) {
    const href = `${context.location.pathname}${context.location.search}${value}`;
    return resolvePageHref(href, context, undefined, undefined, undefined, undefined);
  }
  const scheme = schemeOf(value);
  if (scheme) {
    if (isDangerousScheme(scheme)) return { ok: false, reason: 'invalid-target' };
    if (scheme === 'http' || scheme === 'https') {
      const url = parseHttpUrl(value);
      if (!url) return { ok: false, reason: 'invalid-target' };
      if (context.origin && url.origin === context.origin)
        return resolvePageHref(
          `${url.pathname}${url.search}${url.hash}`,
          context,
          undefined,
          undefined,
          undefined,
          undefined,
        );
      return { ok: true, resolution: { kind: 'external', href: url.toString() } };
    }
    if (context.pageLink?.scheme.toLowerCase() === scheme) {
      const target = parsePageLink(value, context.pageLink);
      return target
        ? resolveTargetInternal(target, context, depth + 1, seen)
        : { ok: false, reason: 'invalid-target' };
    }
    const protocol = context.registry.get(scheme);
    if (!protocol)
      return { ok: false, reason: 'unsupported-scheme', message: `未注册协议：${scheme}` };
    if (depth >= MAX_PROTOCOL_DEPTH)
      return { ok: false, reason: 'invalid-target', message: '协议解析层级过深' };
    if (seen.has(value))
      return { ok: false, reason: 'invalid-target', message: '协议解析出现循环' };
    seen.add(value);
    const next = protocol.resolve(value, context.location);
    if (!next) return { ok: false, reason: 'invalid-target', message: '协议未返回有效目标' };
    return resolveTargetInternal(next, context, depth + 1, seen);
  }
  if (value.startsWith('//')) return { ok: false, reason: 'invalid-target' };
  if (value.startsWith('/')) {
    return resolvePageHref(value, context, undefined, undefined, undefined, undefined);
  }
  const resolved = new URL(value, `http://router-plus.local${context.location.pathname || '/'}`);
  if (resolved.origin !== 'http://router-plus.local')
    return { ok: false, reason: 'invalid-target' };
  return resolvePageHref(
    `${resolved.pathname}${resolved.search}${resolved.hash}`,
    context,
    undefined,
    undefined,
    undefined,
    undefined,
  );
}

function resolveTargetInternal(
  target: LinkTarget,
  context: ResolveContext,
  depth: number,
  seen: Set<string>,
): ResolveOutcome {
  if (typeof target === 'string') return resolveStringTarget(target, context, depth, seen);
  if (
    !target ||
    typeof target !== 'object' ||
    typeof (target as { then?: unknown }).then === 'function'
  )
    return { ok: false, reason: 'invalid-target' };
  if ('action' in target) {
    if (!target.action) return { ok: false, reason: 'invalid-target' };
    return {
      ok: true,
      resolution: { kind: 'action', actionId: target.action, payload: target.payload },
    };
  }
  if ('page' in target) {
    const definition =
      context.runtime.byId.get(target.page) ??
      context.runtime.definitions.find((item) => item.path === target.page);
    if (!definition)
      return { ok: false, reason: 'unknown-page', message: `未登记页面：${target.page}` };
    const params = { ...(target.params ?? {}) };
    const built = context.matcher.build(definition.path, params);
    if (!built) return { ok: false, reason: 'invalid-param', message: '页面参数缺失或非法' };
    if (definition.params) {
      for (const [key, validate] of Object.entries(definition.params)) {
        if (!validate) continue;
        const value = params[key];
        if (value === undefined || validate(value) !== true) {
          return { ok: false, reason: 'invalid-param', message: `参数非法：${key}` };
        }
      }
    }
    const queryPairs = Object.entries(target.query ?? {});
    const href = `${built}${buildSearch(queryPairs)}`;
    return resolvePageHref(
      href,
      context,
      target.tab,
      target.state,
      target.replace,
      pageIdOf(definition),
      target.values,
    );
  }
  if ('pathname' in target) {
    const pathname = normalizePathname(target.pathname);
    if (!pathname.startsWith('/') || pathname.startsWith('//'))
      return { ok: false, reason: 'invalid-target' };
    const search = target.search ?? '';
    const hash = target.hash ?? '';
    if (search && !search.startsWith('?')) return { ok: false, reason: 'invalid-target' };
    if (hash && !hash.startsWith('#')) return { ok: false, reason: 'invalid-target' };
    return resolvePageHref(
      `${pathname}${search}${hash}`,
      context,
      undefined,
      target.state,
      target.replace,
      undefined,
      target.values,
    );
  }
  if ('path' in target) {
    const outcome = resolveStringTarget(target.path, context, depth, seen);
    if (!outcome.ok) return outcome;
    if (outcome.resolution.kind !== 'page') {
      return { ok: false, reason: 'invalid-target', message: '路径目标必须是站内页面' };
    }
    return resolvePageHref(
      outcome.resolution.href,
      context,
      target.tab,
      target.state ?? outcome.resolution.state,
      target.replace ?? outcome.resolution.replace,
      outcome.resolution.pageId ?? undefined,
      target.values,
    );
  }
  return { ok: false, reason: 'invalid-target' };
}

export function resolveLink(target: LinkTarget, context: ResolveContext): ResolveOutcome {
  try {
    return resolveTargetInternal(target, context, 0, new Set());
  } catch {
    return { ok: false, reason: 'invalid-target' };
  }
}

/** Build a caller-configurable page link; never infers a business scheme. */
export function createPageLink(
  target: { readonly path: string; readonly tab?: string },
  options: PageLinkOptions,
): string {
  if (
    !target.path.startsWith('/') ||
    target.path.startsWith('//') ||
    /[\\\u0000-\u0020\u007f]/u.test(target.path)
  ) {
    throw new Error('非法页面目标');
  }
  const params = new URLSearchParams({ [options.pathKey ?? 'path']: target.path });
  if (target.tab !== undefined) params.set(options.tabKey ?? 'tab', target.tab);
  return `${options.scheme}://page?${params.toString()}`;
}

/** Parse a page link produced by `createPageLink`. */
export function parsePageLink(
  value: string,
  options: PageLinkOptions,
): { readonly path: string; readonly tab?: string } | null {
  const pathKey = options.pathKey ?? 'path';
  const tabKey = options.tabKey ?? 'tab';
  try {
    const url = new URL(value);
    const keys = [...url.searchParams.keys()];
    if (
      url.protocol !== `${options.scheme}:` ||
      url.hostname !== 'page' ||
      url.pathname ||
      url.hash ||
      url.username ||
      url.password ||
      url.port ||
      keys.length !== new Set(keys).size ||
      keys.some((key) => key !== pathKey && key !== tabKey)
    ) {
      return null;
    }
    const path = url.searchParams.get(pathKey);
    const tab = url.searchParams.get(tabKey);
    if (
      !path ||
      !path.startsWith('/') ||
      path.startsWith('//') ||
      /[\\\u0000-\u0020\u007f]/u.test(path)
    ) {
      return null;
    }
    return { path, ...(tab !== null ? { tab } : {}) };
  } catch {
    return null;
  }
}
