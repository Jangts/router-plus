/**
 * `@jangts/router-plus/vue` adapter entry.
 */
export {
  ROUTER_PLUS_KEY,
  createVueConnection,
  createVueRouterPlus,
  type CreateVueRouterPlusOptions,
  type VueConnectionResult,
  type VueRouteLike,
  type VueRouterLike,
  type VueRouterPlus,
} from './plugin.js';
export {
  useHighlight,
  usePageContext,
  usePageLeaveGuard,
  usePageMatch,
  usePageQuery,
  useRouterPlus,
  useTour,
  type PageQueryInit,
} from './composables.js';
export { RouterPlusLink } from './link.js';
export {
  RouterPlusBoundary,
  RouterPlusRedirect,
  RouterPlusRetained,
  RouterPlusView,
} from './view.js';
export { createVueRoutes, type CreateVueRoutesOptions, type VueRouteRecord } from './routes.js';
export { RouterPlusOverlay } from './overlay.js';

export type { OverlayTheme, OverlayZIndexRange } from '../dom/theme.js';

export type {
  HighlightComponentProps,
  HighlightComponentContext,
  HighlightRectangle,
} from '../dom/highlight.js';

export type { DefaultHighlightComponentProps } from '../dom/highlight.js';
export type { DefaultHighlightStyles } from '../dom/theme.js';
export { useRpRef, useRpReactiveState, useRpComputedState } from './native-state.js';

export { useVueState } from './existing-state.js';
