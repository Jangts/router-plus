/** Normalize native ESM and older CommonJS router exports without loading another router copy. */
import * as nativeExports from 'react-router-dom';
const router =
  (nativeExports as typeof nativeExports & { default?: typeof nativeExports }).default ??
  nativeExports;
export const {
  matchPath,
  generatePath,
  matchRoutes,
  RouterProvider,
  useLocation,
  useNavigate,
  useOutlet,
  resolvePath,
} = router;

export const UNSAFE_LocationContext: typeof nativeExports.UNSAFE_LocationContext =
  router.UNSAFE_LocationContext;
export const UNSAFE_RouteContext: typeof nativeExports.UNSAFE_RouteContext =
  router.UNSAFE_RouteContext;
