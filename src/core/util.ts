/**
 * Small, dependency-free helpers shared by the core modules.
 *
 * Nothing here touches DOM globals at module load; browser-only work stays in `dom/` and in the
 * framework adapters.
 */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Clone static initial state so separate instances never share a mutable object. */
export function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Functions, proxies and host objects cannot be cloned; keep the original reference.
    }
  }
  if (Array.isArray(value)) return value.slice() as unknown as T;
  if (isPlainObject(value)) return { ...value } as T;
  return value;
}

export function decodeSegment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

const INVALID_SEGMENT = /[\\/\u0000-\u0020\u007f]/u;

/** Route parameters must be a single, non-empty, non-control segment. */
export function isValidSegment(value: string): boolean {
  return value.length > 0 && value !== '.' && value !== '..' && !INVALID_SEGMENT.test(value);
}

export function parseSearch(search: string): readonly (readonly [string, string])[] {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return [...params.entries()];
}

export function queryRecord(pairs: readonly (readonly [string, string])[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of pairs)
    if (!Object.hasOwn(record, key))
      Object.defineProperty(record, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
  return record;
}

export function buildSearch(pairs: readonly (readonly [string, string])[]): string {
  const params = new URLSearchParams();
  for (const [key, value] of pairs) params.append(key, value);
  const value = params.toString();
  return value ? `?${value}` : '';
}

const DANGEROUS_SCHEMES = new Set([
  'javascript',
  'data',
  'vbscript',
  'file',
  'blob',
  'filesystem',
  'about',
  'chrome',
  'resource',
]);

export function schemeOf(value: string): string | null {
  const match = /^([a-z][a-z\d+.-]*):/i.exec(value);
  return match ? match[1].toLowerCase() : null;
}

export function isDangerousScheme(scheme: string): boolean {
  return DANGEROUS_SCHEMES.has(scheme);
}

/** Parse an absolute http(s) URL, rejecting credentials and malformed input. */
export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/** Resolve a path or relative reference against the current pathname without a real origin. */
export function resolvePathValue(value: string, currentPathname: string): string | null {
  try {
    const base = new URL(`http://router-plus.local${currentPathname || '/'}`);
    const url = new URL(value, base);
    if (url.origin !== base.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Split `pathname?search#hash` into its parts. */
export function splitHref(href: string): { pathname: string; search: string; hash: string } {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const searchIndex = withoutHash.indexOf('?');
  const search = searchIndex >= 0 ? withoutHash.slice(searchIndex) : '';
  const pathname = searchIndex >= 0 ? withoutHash.slice(0, searchIndex) : withoutHash;
  return { pathname: pathname || '/', search, hash };
}

/** Normalise a pathname; keeps a single leading slash and removes a trailing slash except root. */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
}

let navigationSequence = 0;

export function createNavigationId(): string {
  navigationSequence += 1;
  return `rp-${Date.now().toString(36)}-${navigationSequence.toString(36)}`;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
