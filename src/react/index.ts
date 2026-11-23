/**
 * `@jangts/router-plus/react` adapter entry.
 */
export {
  createReactProvider,
  usePlusContext,
  type ReactRouterHooks,
  type ReactRouterLocationLike,
  type RouterPlusProviderProps,
} from './provider.js';
export {
  useHighlight,
  usePageContext,
  usePageLeaveGuard,
  usePageMatch,
  usePageQuery,
  useRouterPlus,
  useTour,
  type PageQueryInit,
  type SetPageQuery,
} from './hooks.js';
export { RouterPlusLink, type RouterPlusLinkProps } from './link.js';
export { RouterPlusRedirect, type RouterPlusRedirectProps } from './redirect.js';
export {
  RouterPlusScope,
  RouterPlusBoundary,
  RouterPlusOutlet,
  RouterPlusRetained,
  type RouterPlusBoundaryProps,
  type RouterPlusRetainedProps,
  type RetainedHost,
} from './boundary.js';
export {
  createReactRoutes,
  type CreateReactRoutesOptions,
  type ReactRouteRecord,
  type RouteComponent,
} from './routes.js';
export { RouterPlusOverlay, type RouterPlusOverlayProps } from './overlay.js';
export type { OverlayTheme, OverlayZIndexRange } from '../dom/theme.js';

export {
  createReactRouterPlus,
  type CreateReactRouterPlusOptions,
  type ReactRouterTuple,
  type ReactRouterPlus,
} from './create.js';

export type {
  HighlightComponentProps,
  HighlightComponentContext,
  HighlightRectangle,
} from '../dom/highlight.js';

export type { DefaultHighlightComponentProps } from '../dom/highlight.js';
export type { DefaultHighlightStyles } from '../dom/theme.js';
export { useRpState, useRpRef, useRpContext, useRpCallback } from './native-state.js';

export { useReactState } from './existing-state.js';
