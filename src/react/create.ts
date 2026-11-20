/**
 * React-side assembly. JSX routers own their native context; Data Routers keep their
 * existing route tree and lifecycle. Both reuse the low-level connection provider.
 */
import {
  cloneElement,
  createElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ComponentType,
  type ComponentProps,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { RouterProvider, useLocation, useNavigate } from './native-router.js';
import type * as NativeRouter from 'react-router-dom';
import type { NavigateFunction, NavigateOptions, To } from 'react-router-dom';
import { createRouterPlus } from '../core/router.js';
import type { CreateRouterPlusOptions, RouterPlus } from '../core/types.js';
import { createReactProvider, type ReactRouterHooks } from './provider.js';
import { reactMatcher } from './matcher.js';

// Older declarative routers have no createBrowserRouter export. Missing native capabilities
// must narrow to never, rather than becoming any through an unresolved named type import.
type DataRouter = typeof NativeRouter extends { createBrowserRouter: (...args: any[]) => infer R }
  ? R
  : never;
/** Constructor shorthand retains the selected component's required and optional props. */
export type ReactRouterTuple<C extends ElementType = ElementType> = readonly [
  component: C,
  ...props: {} extends ComponentProps<C>
    ? [props?: NoInfer<ComponentProps<C>>]
    : [props: NoInfer<ComponentProps<C>>],
];
export type CreateReactRouterPlusOptions<C extends ElementType = ElementType> = (
  (CreateRouterPlusOptions & { readonly plus?: never }) | { readonly plus: RouterPlus }
) & {
  readonly router: ReactElement<{ children?: ReactNode }> | DataRouter | ReactRouterTuple<C>;
  /** Optional location adaptation for a JSX or tuple router, using its native hooks. */
  readonly hooks?: ReactRouterHooks;
};
export interface ReactRouterPlus extends RouterPlus {
  readonly Provider: ComponentType<{ children?: ReactNode }>;
}

/** Subscribe directly to a Data Router without changing or wrapping its route records. */
function dataRouterHooks(router: DataRouter): ReactRouterHooks {
  const subscribe = (notify: () => void) => router.subscribe(notify);
  const snapshot = () => router.state;
  const navigate: NavigateFunction = (to: To | number, options?: NavigateOptions) =>
    typeof to === 'number' ? router.navigate(to) : router.navigate(to, options);
  return {
    useLocation: () => useSyncExternalStore(subscribe, snapshot, snapshot).location,
    useNavigate: () => navigate,
    useBlocker(predicate) {
      const key = useId();
      const predicateRef = useRef(predicate);
      predicateRef.current = predicate;
      const state = useSyncExternalStore(subscribe, snapshot, snapshot);
      useEffect(() => {
        router.getBlocker(key, (transition) => predicateRef.current(transition));
        return () => router.deleteBlocker(key);
      }, [key]);
      return state.blockers.get(key) ?? { state: 'unblocked' };
    },
  };
}

/** Assemble one Plus instance and a stable Provider; unmount disconnects, disposal stays explicit. */
export function createReactRouterPlus<C extends ElementType>(
  options: CreateReactRouterPlusOptions<C>,
): ReactRouterPlus {
  const { router, hooks, plus: supplied, ...core } = options;
  const candidate = Array.isArray(router) ? createElement(router[0], router[1]) : router;
  const element = isValidElement<{ children?: ReactNode }>(candidate) ? candidate : null;
  if (!element && (!router || typeof (router as DataRouter).subscribe !== 'function'))
    throw new Error(
      'router must be a router element, [component, props] tuple or Data Router instance',
    );
  if (!element && hooks) throw new Error('Custom hooks apply only to JSX or tuple routers');
  const plus =
    supplied ??
    createRouterPlus({
      matcher: reactMatcher,
      initialLocation: element ? undefined : (router as DataRouter).state.location,
      ...(core as CreateRouterPlusOptions),
    });
  const Connection = createReactProvider(
    hooks ?? (element ? { useLocation, useNavigate } : dataRouterHooks(router as DataRouter)),
  );
  function Provider({ children }: { children?: ReactNode }) {
    if (element)
      return cloneElement(
        element,
        undefined,
        createElement(Connection, { plus }, element.props.children, children),
      );
    if (children != null)
      throw new Error('Data Router content belongs in its route tree; Provider takes no children');
    return createElement(
      Connection,
      { plus },
      createElement(RouterProvider, { router: router as DataRouter }),
    );
  }
  return Object.assign(plus, { Provider });
}
