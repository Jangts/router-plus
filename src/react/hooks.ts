/**
 * React hooks bound to the nearest Router Plus provider.
 */
import { useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type {
  CommandResult,
  GlobalGuard,
  HighlightOptions,
  HighlightState,
  NavigateOptions,
  PageContext,
  PageMatch,
  TargetRef,
  TourOptions,
  TourState,
  TourStep,
} from '../core/types.js';
import { UNSAFE_RouteContext, UNSAFE_LocationContext, resolvePath } from './native-router.js';
import { resolveStatePage } from '../core/page-selector.js';
import { usePlusContext } from './provider.js';

export type PageQueryInit =
  string | URLSearchParams | Record<string, string> | readonly (readonly [string, string])[];

export type SetPageQuery = (
  next: PageQueryInit | ((previous: URLSearchParams) => URLSearchParams),
  options?: NavigateOptions,
) => void;

/** Preserve the caller's route-relative semantics before submitting an absolute target. */
export function useRouterPlus(): import('../core/types.js').RouterPlus & {
  resolveLink(
    target: import('../core/types.js').LinkTarget,
    options?: NavigateOptions,
  ): import('../core/types.js').LinkResolution | null;
} {
  const plus = usePlusContext();
  const { matches } = useContext(UNSAFE_RouteContext);
  const native = useContext(UNSAFE_LocationContext);
  const location = native?.location ?? plus.getContext().location;
  return useMemo(() => {
    const normalize = (
      target: import('../core/types.js').PageTarget,
      options?: NavigateOptions,
    ): import('../core/types.js').PageTarget => {
      const value =
        typeof target === 'string'
          ? target
          : 'path' in target
            ? target.path
            : 'pathname' in target
              ? target.pathname
              : null;
      if (value === null || value.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(value))
        return target;
      let base = location.pathname,
        relative = value;
      if (
        options?.relative !== 'path' &&
        value &&
        !value.startsWith('?') &&
        !value.startsWith('#')
      ) {
        const paths = matches.filter((match, index) => index === 0 || Boolean(match.route.path));
        let index = paths.length - 1;
        const segments = value.split('/');
        while (segments[0] === '..') {
          segments.shift();
          index--;
        }
        base =
          index < 0
            ? '/'
            : index === paths.length - 1
              ? paths[index].pathname
              : paths[index].pathnameBase;
        relative = segments.join('/') || '.';
      }
      const resolved = resolvePath(relative, base);
      if (typeof target === 'string') return resolved;
      if ('path' in target)
        return { ...target, path: `${resolved.pathname}${resolved.search}${resolved.hash}` };
      return { ...target, pathname: resolved.pathname };
    };
    const navigate = (target: import('../core/types.js').PageTarget, options?: NavigateOptions) =>
      plus.navigate(normalize(target, options), options);
    return new Proxy(plus, {
      get(target, key) {
        if (key === 'navigate') return navigate;
        if (key === 'resolveLink')
          return (value: import('../core/types.js').LinkTarget, options?: NavigateOptions) =>
            plus.resolveLink(
              typeof value === 'object' && 'action' in value ? value : normalize(value, options),
            );
        if (key === 'resolveTarget')
          return (value: import('../core/types.js').PageTarget) =>
            plus.resolveTarget(normalize(value));
        if (key === 'resolveHref')
          return (value: import('../core/types.js').PageTarget) =>
            plus.resolveHref(normalize(value));
        if (key === 'replace')
          return (value: import('../core/types.js').PageTarget, options?: NavigateOptions) =>
            navigate(value, { ...options, replace: true });
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }, [plus, matches, location.pathname]);
}

export function usePageContext(): PageContext {
  const plus = usePlusContext();
  const subscribe = useCallback(
    (listener: () => void) =>
      plus.subscribe((event) => {
        if (event.type === 'location' || event.type === 'navigation' || event.type === 'tab')
          listener();
      }),
    [plus],
  );
  return useSyncExternalStore(
    subscribe,
    () => plus.getContext(),
    () => plus.getContext(),
  );
}

export function usePageMatch(): PageMatch | null {
  const context = usePageContext();
  if (!context.page) return null;
  return {
    page: context.page,
    params: context.params,
    query: context.query,
    queryAll: context.queryAll,
    tab: context.tab,
    values: context.values,
  };
}

export function usePageState<T = unknown>(
  key = 'default',
  page?: string,
): [T, { set(value: T): void; patch(value: Record<string, unknown>): void; reset(): void }] {
  const plus = usePlusContext();
  const context = usePageContext();
  const target = useMemo(() => resolveStatePage(plus, context, page), [plus, context, page]);
  const read = () =>
    page === undefined || target.current
      ? plus.getState<T>(key)
      : (target.entry?.states?.[key]?.default as T);
  const set = (next: T) => {
    if (page === undefined || target.current) return plus.setState(next, key);
    if (!target.entry) return Promise.resolve({ ok: false } as CommandResult);
    return plus.navigate(
      target.path
        ? { path: target.path, values: { [key]: next } }
        : { page: target.entry.id, values: { [key]: next } },
    );
  };
  const subscribe = useCallback(
    (listener: () => void) =>
      plus.subscribe((event) => {
        if ((event.type === 'state' && event.key === key) || event.type === 'location') listener();
      }),
    [plus, key],
  );
  const value = useSyncExternalStore(subscribe, read, read);
  return [
    value,
    {
      set(next: T) {
        void set(next);
      },
      patch(next: Record<string, unknown>) {
        if (page !== undefined && !target.current) {
          const current = read();
          void set({ ...(current && typeof current === 'object' ? current : {}), ...next } as T);
        } else void plus.patchState(next, key);
      },
      reset() {
        if (page !== undefined && !target.current)
          void set(target.entry?.states?.[key]?.default as T);
        else void plus.resetState(key);
      },
    },
  ];
}

/** Compatibility helper; tabs are ordinary registered state. */
export function usePageTab(page?: string): [string, (tab: string) => void] {
  const [value, actions] = usePageState<string>('tab', page);
  return [typeof value === 'string' ? value : '', actions.set];
}

export function usePageQuery(defaultInit?: PageQueryInit): [URLSearchParams, SetPageQuery] {
  const plus = usePlusContext();
  const context = usePageContext();
  const params = useMemo(() => {
    if (context.search) return new URLSearchParams(context.search);
    return new URLSearchParams(defaultInit as string | URLSearchParams | undefined);
  }, [context.search, defaultInit]);
  const set = useCallback<SetPageQuery>(
    (next, options) => {
      const value =
        typeof next === 'function'
          ? next(new URLSearchParams(params))
          : next instanceof URLSearchParams
            ? next
            : new URLSearchParams(next as string | Record<string, string>);
      const search = value.toString();
      void plus.navigate(
        { pathname: context.pathname, search: search ? `?${search}` : '', hash: context.hash },
        options,
      );
    },
    [plus, params, context.pathname, context.hash],
  );
  return [params, set];
}

export function usePageLeaveGuard(guard: GlobalGuard): void {
  const plus = usePlusContext();
  useEffect(() => plus.registerGuard(guard, { priority: 10 }), [plus, guard]);
}

export function useHighlight(): {
  state: HighlightState | null;
  highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>;
  clear: () => void;
} {
  const plus = usePlusContext();
  const subscribe = useCallback(
    (listener: () => void) =>
      plus.subscribe((event) => {
        if (event.type === 'highlight') listener();
      }),
    [plus],
  );
  const state = useSyncExternalStore(
    subscribe,
    () => plus.getHighlight(),
    () => plus.getHighlight(),
  );
  return {
    state,
    highlight: (target, options) => plus.highlight(target, options),
    clear() {
      void plus.clearHighlight();
    },
  };
}

export function useTour(): {
  state: TourState | null;
  start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>;
  next: () => void;
  prev: () => void;
  stop: () => void;
} {
  const plus = usePlusContext();
  const subscribe = useCallback(
    (listener: () => void) =>
      plus.subscribe((event) => {
        if (event.type === 'tour') listener();
      }),
    [plus],
  );
  const state = useSyncExternalStore(
    subscribe,
    () => plus.getTour(),
    () => plus.getTour(),
  );
  return {
    state,
    start: (steps, options) => plus.startTour(steps, options),
    next() {
      void plus.nextTourStep();
    },
    prev() {
      void plus.prevTourStep();
    },
    stop() {
      void plus.stopTour();
    },
  };
}
