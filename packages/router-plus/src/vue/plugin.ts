/**
 * Vue Router connection: committed snapshots, failure mapping and native transition guards.
 * Structural routers remain supported; native interception/traversal are enabled only when the
 * corresponding methods exist. A resolved NavigationFailure is never treated as a commit.
 */
import type { App, InjectionKey, Plugin } from 'vue';
import { createRouterPlus } from '../core/router.js';
import { NavigationFailureType, isNavigationFailure } from './native-router.js';
import type {
  CreateRouterPlusOptions,
  CommittedChange,
  CommitResult,
  GuardResult,
  RouterConnection,
  RouterLocation,
  RouterPlus,
} from '../core/types.js';
import { splitHref } from '../core/util.js';
import { vueMatcher } from './matcher.js';

export interface VueRouteLike {
  readonly path: string;
  readonly fullPath: string;
  readonly hash: string;
  readonly state?: unknown;
  readonly matched?: readonly {
    readonly meta?: Record<string, unknown>;
    readonly params?: Record<string, string | string[]>;
  }[];
  readonly params?: Record<string, string | string[]>;
}
export interface VueRouterLike {
  readonly currentRoute: { readonly value: VueRouteLike };
  readonly options?: { readonly history: { readonly state: unknown } };
  afterEach(
    callback: (to: VueRouteLike, from: VueRouteLike, failure?: unknown) => void,
  ): () => void;
  beforeEach?(callback: (to: VueRouteLike, from: VueRouteLike) => unknown): () => void;
  push(to: unknown): Promise<unknown> | unknown;
  replace?(to: unknown): Promise<unknown> | unknown;
  go?(delta: number): void;
}
export const ROUTER_PLUS_KEY: InjectionKey<RouterPlus> = Symbol('router-plus');
export interface VueRouterPlus extends RouterPlus {
  readonly plus: RouterPlus;
  readonly connection: RouterConnection;
  install(app: App): void;
  disconnect(): void;
}
export type CreateVueRouterPlusOptions = (
  (CreateRouterPlusOptions & { readonly plus?: never }) | { readonly plus: RouterPlus }
) & {
  readonly router: VueRouterLike;
};
export interface VueConnectionResult {
  readonly connection: RouterConnection;
  notify(change: CommittedChange): void;
  dispose(): void;
}

/** Adapt framework failures without relying on rejected promises. */
function failureReceipt(value: unknown): CommitResult | null {
  if (!value) return null;
  if (isNavigationFailure(value, NavigationFailureType.duplicated)) return { status: 'noop' };
  if (isNavigationFailure(value, NavigationFailureType.cancelled)) return { status: 'cancelled' };
  if (
    isNavigationFailure(value) ||
    (typeof value === 'object' && value !== null && 'type' in value)
  )
    return { status: 'blocked' };
  return null;
}

/** Build a connection that can also be used without the Vue plugin. */
export function createVueConnection(router: VueRouterLike): VueConnectionResult {
  const listeners = new Set<(change: CommittedChange) => void>();
  let disposed = false;
  let revision = 0,
    pending: { id: string; href: string } | null = null;
  let nativeCheck: ((target: RouterLocation) => Promise<GuardResult>) | null = null;
  let traversal: ((result: CommitResult) => void) | null = null;
  const location = (route = router.currentRoute.value): RouterLocation => {
    const parts = splitHref(route.fullPath || route.path || '/');
    const state = router.options?.history.state ?? route.state;
    const entry =
      state && typeof state === 'object' ? (state as Record<string, unknown>).position : undefined;
    return {
      ...parts,
      state,
      action: 'native',
      entryKey: String(entry ?? revision),
      matched: route.matched
        ?.filter((match) => typeof match.meta?.pageId === 'string')
        .map((match) => ({
          pageId: match.meta!.pageId as string,
          params: Object.fromEntries(
            Object.entries(route.params ?? {}).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.join('/') : value,
            ]),
          ),
        })),
    };
  };
  const notify = (change: CommittedChange) => {
    for (const listener of listeners) listener(change);
  };
  const stop = router.afterEach((to, _from, failure) => {
    const failed = failureReceipt(failure);
    if (failed) {
      traversal?.(failed);
      return;
    }
    revision++;
    const next = { ...location(to), navigationId: pending?.id };
    notify({ location: next, source: pending ? 'plus' : 'native', navigationId: pending?.id });
    traversal?.({ status: 'committed', location: next });
  });
  const stopGuard = router.beforeEach?.(async (to) => {
    if (!nativeCheck || pending?.href === to.fullPath) return true;
    const decision = await nativeCheck(location(to));
    if (decision && typeof decision === 'object' && 'redirect' in decision)
      return decision.redirect;
    return decision === true;
  });
  const go = async (delta: number): Promise<CommitResult> => {
    if (!router.go) return { status: 'failed', message: 'History traversal unavailable' };
    if (delta === 0) return { status: 'noop' };
    if (traversal) return { status: 'failed', message: 'History traversal already pending' };
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        traversal = null;
        resolve({ status: 'failed', message: 'History traversal did not produce a receipt' });
      }, 1000);
      traversal = (result) => {
        clearTimeout(timer);
        traversal = null;
        resolve(result);
      };
      router.go!(delta);
    });
  };
  const connection: RouterConnection = {
    get initial() {
      return location();
    },
    matcher: vueMatcher,
    capabilities: {
      traversal: Boolean(router.go),
      interception: Boolean(router.beforeEach),
      rawHistoryObservation: false,
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    intercept(check) {
      nativeCheck = check;
      return () => {
        if (nativeCheck === check) nativeCheck = null;
      };
    },
    async commit(request) {
      if (request.signal.aborted) return { status: 'cancelled' };
      const own = { id: request.navigationId, href: request.href };
      pending = own;
      const parts = splitHref(request.href),
        query: Record<string, string[]> = Object.create(null);
      for (const [key, value] of new URLSearchParams(parts.search)) (query[key] ??= []).push(value);
      try {
        const push = request.options.replace && router.replace ? router.replace : router.push;
        const failure = await push.call(router, {
          path: parts.pathname,
          query,
          hash: parts.hash,
          state: request.state,
          force: request.href === router.currentRoute.value.fullPath,
          replace: request.options.replace === true,
        });
        return (
          failureReceipt(failure) ?? {
            status: 'committed',
            location: { ...location(), navigationId: request.navigationId },
          }
        );
      } catch (error) {
        return { status: 'failed', error };
      } finally {
        if (pending === own) pending = null;
      }
    },
    back: () => go(-1),
    forward: () => go(1),
    go,
  };
  return {
    connection,
    notify,
    dispose() {
      if (disposed) return;
      disposed = true;
      const errors: unknown[] = [];
      // Native unsubscribe callbacks are independent; one failure must not retain the others.
      const cleanups = [
        stop,
        () => stopGuard?.(),
        () => traversal?.({ status: 'cancelled' }),
        () => listeners.clear(),
      ];
      for (const cleanup of cleanups) {
        try {
          cleanup();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length) throw new AggregateError(errors, 'Vue Router connection cleanup failed');
    },
  };
}

/** Plugin owns connection cleanup; ordinary native Vue Router calls remain valid. */
export function createVueRouterPlus(options: CreateVueRouterPlusOptions): VueRouterPlus {
  const { plus: supplied, router, ...core } = options;
  const result = createVueConnection(router);
  // Report adapter failures without letting a diagnostic sink interrupt Core cleanup.
  const disposeConnection = (stage = 'vue.dispose') => {
    try {
      result.dispose();
    } catch (error) {
      try {
        (core as CreateRouterPlusOptions).onDiagnostic?.(error, stage);
      } catch {
        // Diagnostics are observational and cannot own adapter lifecycle.
      }
    }
  };
  let plus: RouterPlus;
  try {
    plus =
      supplied ??
      createRouterPlus({
        matcher: vueMatcher,
        initialLocation: result.connection.initial,
        ...(core as CreateRouterPlusOptions),
      });
  } catch (error) {
    disposeConnection();
    throw error;
  }
  const hot = (core as CreateRouterPlusOptions).hmr;
  if (hot) hot.dispose(() => disposeConnection('hmr.dispose'));
  let disconnect: (() => void) | undefined;
  const extension = {
    plus,
    connection: result.connection,
    install(app: App) {
      // Native instances install once through Vue's own plugin deduplication.
      if (
        'install' in router &&
        typeof router.install === 'function' &&
        app.config.globalProperties.$router !== router
      )
        app.use(router as VueRouterLike & Plugin);
      app.provide(ROUTER_PLUS_KEY, plus);
      app.config.globalProperties.$routerPlus = plus;
      disconnect = plus.connect(result.connection);
      let active = true;
      const cleanup = () => {
        if (!active) return;
        active = false;
        disconnect?.();
        disposeConnection();
        if (!supplied) void plus.dispose();
      };
      if (app.onUnmount) app.onUnmount(cleanup);
      else {
        // Vue 3.3/3.4 have no app.onUnmount hook. Preserve native unmount and other wrappers.
        const unmount = app.unmount;
        app.unmount = function (this: App) {
          try {
            return unmount.call(this);
          } finally {
            cleanup();
          }
        };
      }
    },
    disconnect() {
      disconnect?.();
      disposeConnection();
    },
    async dispose() {
      disposeConnection();
      await plus.dispose();
    },
  };
  // Preserve the receiver of App-supplied instances and avoid overwriting Core internals
  // with public adapter properties such as `connection`.
  const methods = new Map<Function, Function>();
  return new Proxy(plus, {
    get(target, key) {
      if (Object.prototype.hasOwnProperty.call(extension, key)) return Reflect.get(extension, key);
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(value)) methods.set(value, value.bind(target));
      return methods.get(value);
    },
  }) as VueRouterPlus;
}
