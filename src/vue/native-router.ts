/** Normalize native ESM and older CommonJS Vue Router exports for direct Node consumers. */
import * as nativeExports from 'vue-router';
const router =
  (nativeExports as typeof nativeExports & { default?: typeof nativeExports }).default ??
  nativeExports;
export const {
  createRouterMatcher,
  NavigationFailureType,
  isNavigationFailure,
  RouterView,
  routeLocationKey,
  routerViewLocationKey,
} = router;
