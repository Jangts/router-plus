/**
 * `@jangts/router-plus` framework-agnostic entry.
 *
 * The core imports no framework, router library or DOM renderer. Framework adapters and the
 * optional DOM runtime live in their own subpaths.
 */
export {
  createRouterPlus,
  ROUTER_PLUS_API_VERSION,
  ROUTER_PLUS_VERSION,
  RouterPlusImpl,
} from './core/router.js';
export { createPageLink, parsePageLink } from './core/links.js';
export { attachGlobal, detachGlobal, DEFAULT_GLOBAL_KEY, toGlobalFacade } from './core/global.js';
export { defaultMatcher } from './core/matcher.js';
export type { RouteMatcher, RouteMatch } from './core/matcher.js';
export type * from './core/types.js';
