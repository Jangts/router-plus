/** React Router owns matching and parameter construction for React connections. */
import { matchPath, generatePath, matchRoutes } from './native-router.js';
import type { RouteMatcher } from '../core/matcher.js';
// Older routers interpolate raw parameters; newer versions encode them themselves.
const encodesParameters = generatePath('/:value', { value: '%' }) === '/%25';
export const reactMatcher: RouteMatcher = {
  matchPages(pages, pathname) {
    const routes = pages.flatMap((page) =>
      [page.path, ...(page.pathAliases ?? [])].map((path) => ({ path, id: page.id ?? page.path })),
    );
    const matches = matchRoutes(routes, pathname);
    const last = matches?.at(-1);
    return last
      ? {
          pageId: last.route.id!,
          params: Object.fromEntries(
            Object.entries(last.params).filter(
              (pair): pair is [string, string] => pair[1] !== undefined,
            ),
          ),
        }
      : null;
  },
  match(template, pathname) {
    const result = matchPath({ path: template, end: true }, pathname);
    return result
      ? {
          params: Object.fromEntries(
            Object.entries(result.params).filter(
              (pair): pair is [string, string] => pair[1] !== undefined,
            ),
          ),
        }
      : null;
  },
  build(template, params) {
    try {
      return generatePath(
        template,
        Object.fromEntries(
          Object.entries(params).map(([key, value]) => [
            key,
            encodesParameters ? value : encodeURIComponent(value),
          ]),
        ),
      );
    } catch {
      return null;
    }
  },
};
