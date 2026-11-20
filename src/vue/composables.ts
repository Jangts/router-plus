/**
 * Vue composables bound to the plugin instance.
 */
import {
  computed,
  getCurrentScope,
  inject,
  onScopeDispose,
  readonly,
  shallowRef,
  triggerRef,
  type Ref,
} from 'vue';
import type {
  CommandResult,
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
import { resolveStatePage } from '../core/page-selector.js';
import { ROUTER_PLUS_KEY } from './plugin.js';

export type PageQueryInit =
  string | URLSearchParams | Record<string, string> | readonly (readonly [string, string])[];

function trackSubscription(
  subscribe: (listener: () => void) => () => void,
  listener: () => void,
): void {
  const stop = subscribe(listener);
  if (getCurrentScope()) onScopeDispose(stop);
}

export function useRouterPlus() {
  const plus = inject(ROUTER_PLUS_KEY, null);
  if (!plus) throw new Error('createVueRouterPlus plugin is missing');
  return plus;
}

export function usePageContext(): Readonly<Ref<PageContext>> {
  const plus = useRouterPlus();
  const context = shallowRef(plus.getContext());
  trackSubscription(
    (listener) =>
      plus.subscribe((event) => {
        if (event.type === 'location' || event.type === 'navigation' || event.type === 'tab')
          listener();
      }),
    () => {
      context.value = plus.getContext();
    },
  );
  return readonly(context);
}

export function usePageMatch() {
  const context = usePageContext();
  return computed<PageMatch | null>(() => {
    const current = context.value;
    if (!current.page) return null;
    return {
      page: current.page,
      params: current.params,
      query: current.query,
      queryAll: current.queryAll,
      tab: current.tab,
      values: current.values,
    };
  });
}

export function usePageState<T = unknown>(
  key = 'default',
): {
  state: Readonly<Ref<T>>;
  set(next: T): void;
  patch(next: Record<string, unknown>): void;
  reset(): void;
} {
  const plus = useRouterPlus();
  const value = shallowRef(plus.getState<T>(key));
  trackSubscription(
    (listener) =>
      plus.subscribe((event) => {
        if ((event.type === 'state' && event.key === key) || event.type === 'location') listener();
      }),
    () => {
      const next = plus.getState<T>(key);
      if (Object.is(next, value.value)) triggerRef(value);
      else value.value = next;
    },
  );
  return {
    // Keep the public contract portable; readonly() infers a deep type that pnpm layouts cannot name.
    state: readonly(value) as Readonly<Ref<T>>,
    set(next: T) {
      void plus.setState(next, key);
    },
    patch(next: Record<string, unknown>) {
      void plus.patchState(next, key);
    },
    reset() {
      void plus.resetState(key);
    },
  };
}

/** Compatibility helper; tabs are ordinary registered state. */
export function usePageTab(page?: string): {
  tab: Readonly<Ref<string>>;
  setTab(tab: string): void;
} {
  const plus = useRouterPlus();
  const context = usePageContext();
  const state = usePageState<string>('tab');
  const target = computed(() => resolveStatePage(plus, context.value, page));
  return {
    tab: computed(() =>
      target.value.current
        ? (state.state.value ?? '')
        : ((target.value.entry?.states?.tab?.default as string) ?? ''),
    ),
    setTab(next) {
      if (target.value.current) {
        state.set(next);
        return;
      }
      const resolved = target.value;
      if (resolved.entry)
        void plus.navigate(
          resolved.path
            ? { path: resolved.path, values: { tab: next } }
            : { page: resolved.entry.id, values: { tab: next } },
        );
    },
  };
}

export function usePageQuery(defaultInit?: PageQueryInit) {
  const plus = useRouterPlus();
  const context = usePageContext();
  const params = computed(() => {
    if (context.value.search) return new URLSearchParams(context.value.search);
    return new URLSearchParams(defaultInit as string | URLSearchParams | undefined);
  });
  return {
    query: readonly(params),
    setQuery(
      next: PageQueryInit | ((previous: URLSearchParams) => URLSearchParams),
      options?: NavigateOptions,
    ) {
      const value =
        typeof next === 'function'
          ? next(new URLSearchParams(params.value))
          : next instanceof URLSearchParams
            ? next
            : new URLSearchParams(next as string | Record<string, string>);
      const search = value.toString();
      void plus.navigate(
        {
          pathname: context.value.pathname,
          search: search ? `?${search}` : '',
          hash: context.value.hash,
        },
        options,
      );
    },
  };
}

export function usePageLeaveGuard(guard: import('../core/types.js').GlobalGuard): void {
  const plus = useRouterPlus();
  const stop = plus.registerGuard(guard, { priority: 10 });
  if (getCurrentScope()) onScopeDispose(stop);
}

export function useHighlight(): {
  state: Readonly<Ref<HighlightState | null>>;
  highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>;
  clear: () => void;
} {
  const plus = useRouterPlus();
  const state = shallowRef<HighlightState | null>(plus.getHighlight());
  trackSubscription(
    (listener) =>
      plus.subscribe((event) => {
        if (event.type === 'highlight') listener();
      }),
    () => {
      state.value = plus.getHighlight();
    },
  );
  return {
    state,
    highlight: (target: TargetRef, options?: HighlightOptions) => plus.highlight(target, options),
    clear() {
      void plus.clearHighlight();
    },
  };
}

export function useTour(): {
  state: Readonly<Ref<TourState | null>>;
  start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>;
  next: () => void;
  prev: () => void;
  stop: () => void;
} {
  const plus = useRouterPlus();
  const state = shallowRef<TourState | null>(plus.getTour());
  trackSubscription(
    (listener) =>
      plus.subscribe((event) => {
        if (event.type === 'tour') listener();
      }),
    () => {
      state.value = plus.getTour();
    },
  );
  return {
    state,
    start: (steps: readonly TourStep[], options?: TourOptions) => plus.startTour(steps, options),
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
