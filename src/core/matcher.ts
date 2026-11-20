/**
 * Route matching port.
 *
 * The default implementation covers shared template syntax (`:param` and a trailing `*`).
 * Framework adapters may provide their own matcher for framework-specific syntax; the core
 * only consumes `match` and `build`.
 */
import type { PageDefinition } from './types.js';
import { decodeSegment, isValidSegment, normalizePathname } from './util.js';

export interface RouteMatch {
  readonly params: Readonly<Record<string, string>>;
}

export interface RouteMatcher {
  /** Optional native ranking across the entire directory. */
  matchPages?(
    pages: readonly PageDefinition[],
    pathname: string,
  ): { pageId: string; params: Readonly<Record<string, string>> } | null;
  match(template: string, pathname: string): RouteMatch | null;
  build(template: string, params: Readonly<Record<string, string>>): string | null;
}

function splitPath(value: string): string[] {
  return normalizePathname(value).split('/').slice(1);
}

function decodeParam(raw: string): string | null {
  const decoded = decodeSegment(raw);
  if (decoded === null || !isValidSegment(decoded)) return null;
  return decoded;
}

/** Default shared-syntax matcher. */
export const defaultMatcher: RouteMatcher = {
  matchPages(pages, pathname) {
    const candidates = pages
      .flatMap((page) =>
        [page.path, ...(page.pathAliases ?? [])].map((path) => ({
          page,
          path,
          score: path
            .split('/')
            .reduce((score, part) => score + (part === '*' ? 0 : part.startsWith(':') ? 3 : 10), 0),
        })),
      )
      .sort((a, b) => b.score - a.score);
    for (const candidate of candidates) {
      const match = defaultMatcher.match(candidate.path, pathname);
      if (match) return { pageId: pageIdOf(candidate.page), params: match.params };
    }
    return null;
  },
  match(template, pathname) {
    const templateParts = splitPath(template);
    const pathParts = splitPath(pathname);
    const params: Record<string, string> = {};
    for (let index = 0; index < templateParts.length; index += 1) {
      const part = templateParts[index];
      if (part === '*') {
        const rest = pathParts.slice(index);
        if (rest.length === 0) return null;
        const decoded = rest.map(decodeParam);
        if (decoded.some((value) => value === null)) return null;
        params['*'] = decoded.join('/');
        return { params };
      }
      const value = pathParts[index];
      if (value === undefined) return null;
      if (part.startsWith(':')) {
        const decoded = decodeParam(value);
        if (decoded === null) return null;
        params[part.slice(1)] = decoded;
        continue;
      }
      if (part !== value) return null;
    }
    return pathParts.length === templateParts.length ? { params } : null;
  },
  build(template, params) {
    const parts = splitPath(template);
    const output: string[] = [];
    for (const part of parts) {
      if (part === '*') {
        const rest = params['*'];
        if (!rest) return null;
        if (rest.split('/').some((value) => !isValidSegment(value))) return null;
        output.push(
          ...rest
            .split('/')
            .map((value) => {
              return isValidSegment(value) ? encodeURIComponent(value) : null;
            })
            .filter((value): value is string => value !== null),
        );
        continue;
      }
      if (!part.startsWith(':')) {
        output.push(part);
        continue;
      }
      const value = params[part.slice(1)];
      if (!value || !isValidSegment(value)) return null;
      output.push(encodeURIComponent(value));
    }
    return `/${output.join('/')}`.replace(/\/$/, '') || '/';
  },
};

/** Match a definition against a pathname, including aliases and parameter validation. */
export function matchDefinition(
  definition: PageDefinition,
  pathname: string,
  matcher: RouteMatcher = defaultMatcher,
): RouteMatch | null {
  const templates = [definition.path, ...(definition.pathAliases ?? [])];
  for (const template of templates) {
    const matched = matcher.match(template, pathname);
    if (!matched) continue;
    if (definition.params) {
      for (const [key, validate] of Object.entries(definition.params)) {
        if (!validate) continue;
        const value = matched.params[key];
        if (value === undefined) return null;
        const result = validate(value);
        if (result !== true) return null;
      }
    }
    return matched;
  }
  return null;
}

export function pageIdOf(definition: PageDefinition): string {
  return definition.id ?? definition.path;
}
