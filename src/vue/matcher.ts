/** Vue's exported matcher owns framework-specific path syntax without creating router state. */
import { createRouterMatcher } from './native-router.js';
import type { RouteMatcher } from '../core/matcher.js';
const directories = new WeakMap<
  readonly import('../core/types.js').PageDefinition[],
  ReturnType<typeof createRouterMatcher>
>();
const cache = new Map<string, ReturnType<typeof createRouterMatcher>>();
function matcherFor(template: string) {
  let matcher = cache.get(template);
  if (!matcher) {
    matcher = createRouterMatcher([{ path: template, name: 'page', component: {} }], {});
    if (cache.size >= 256) cache.delete(cache.keys().next().value!);
    cache.set(template, matcher);
  }
  return matcher;
}
export const vueMatcher: RouteMatcher = {
  matchPages(pages, pathname) {
    let matcher = directories.get(pages);
    if (!matcher) {
      matcher = createRouterMatcher(
        pages.map((page) => ({
          path: page.path,
          name: page.id ?? page.path,
          alias: [...(page.pathAliases ?? [])],
          component: {},
        })),
        {},
      );
      directories.set(pages, matcher);
    }
    const match = matcher.resolve(
      { path: pathname },
      { path: '/', name: undefined, params: {}, matched: [], meta: {} },
    );
    return typeof match.name === 'string'
      ? {
          pageId: match.name,
          params: Object.fromEntries(
            Object.entries(match.params).map(([key, value]) => [
              key,
              Array.isArray(value)
                ? value.map(decodeURIComponent).join('/')
                : decodeURIComponent(String(value)),
            ]),
          ),
        }
      : null;
  },
  match(template, pathname) {
    const route = matcherFor(template).resolve(
      { path: pathname },
      { path: '/', params: {}, name: undefined, matched: [], meta: {} },
    );
    if (!route.matched.length) return null;
    return {
      params: Object.fromEntries(
        Object.entries(route.params).map(([key, value]) => [
          key,
          Array.isArray(value)
            ? value.map(decodeURIComponent).join('/')
            : decodeURIComponent(String(value)),
        ]),
      ),
    };
  },
  build(template, params) {
    try {
      return matcherFor(template).resolve(
        {
          name: 'page',
          params: Object.fromEntries(
            Object.entries(params).map(([key, value]) => [key, encodeURIComponent(value)]),
          ),
        },
        { path: '/', name: undefined, params: {}, matched: [], meta: {} },
      ).path;
    } catch {
      return null;
    }
  },
};
