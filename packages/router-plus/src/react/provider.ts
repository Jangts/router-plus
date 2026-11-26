/**
 * React connection and context. Router hooks keep the caller's routing mode intact; the optional
 * blocker hook enables pre-commit guards in router modes that support it. Receipts use a unique
 * state token and history entry identity, never pathname equality.
 */
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  CommittedChange,
  CommitResult,
  GuardResult,
  RouterConnection,
  RouterLocation,
  RouterPlus,
} from '../core/types.js';
import type { NavigateFunction } from 'react-router-dom';
import { reactMatcher } from './matcher.js';

export interface ReactRouterLocationLike {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly state?: unknown;
  readonly key?: string;
}
interface Blocker {
  state: string;
  location?: ReactRouterLocationLike;
  proceed?(): void;
  reset?(): void;
}
export interface ReactRouterHooks {
  useLocation(): ReactRouterLocationLike;
  useNavigate(): NavigateFunction;
  useBlocker?(
    shouldBlock: (transition: { nextLocation: ReactRouterLocationLike }) => boolean,
  ): Blocker;
}
export interface RouterPlusProviderProps {
  readonly plus: RouterPlus;
  readonly children?: ReactNode;
}
export const PlusContext = createContext<RouterPlus | null>(null);
export function usePlusContext(): RouterPlus {
  const plus = useContext(PlusContext);
  if (!plus) throw new Error('RouterPlusProvider is missing');
  return plus;
}
// Subscribe and publish committed locations before descendant passive effects can navigate.
const useCommittedEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const TOKEN = '__routerPlusNavigationId';
function toLocation(location: ReactRouterLocationLike): RouterLocation {
  const state = location.state as Record<string, unknown> | undefined;
  return {
    pathname: location.pathname || '/',
    search: location.search || '',
    hash: location.hash || '',
    state: location.state,
    entryKey: location.key,
    action: 'native',
    navigationId: typeof state?.[TOKEN] === 'string' ? (state[TOKEN] as string) : undefined,
  };
}
interface Pending {
  finish(result: CommitResult): void;
  settled?: boolean;
  before?: ReactRouterLocationLike;
}

/** Create a provider using the router's existing hooks. */
export function createReactProvider(hooks: ReactRouterHooks) {
  return function RouterPlusProvider({ plus, children }: RouterPlusProviderProps) {
    const location = hooks.useLocation(),
      navigate = hooks.useNavigate();
    const navigateRef = useRef(navigate);
    const locationRef = useRef(location);
    useCommittedEffect(() => {
      navigateRef.current = navigate;
      locationRef.current = location;
    });
    const listeners = useRef(new Set<(change: CommittedChange) => void>());
    const pending = useRef(new Map<string, Pending>());
    const check = useRef<((target: RouterLocation) => Promise<GuardResult>) | null>(null);
    const traversal = useRef<Pending | null>(null);
    const connectionRef = useRef<RouterConnection | null>(null);
    const blocker = hooks.useBlocker?.(({ nextLocation }) => {
      const token = toLocation(nextLocation).navigationId;
      return Boolean(check.current && (!token || !pending.current.has(token)));
    });
    useEffect(() => {
      if (blocker?.state !== 'blocked' || !blocker.location) return;
      let active = true;
      void check
        .current?.(toLocation(blocker.location))
        .then((decision) => {
          if (!active) return;
          if (decision === true) blocker.proceed?.();
          else {
            traversal.current?.finish({ status: 'blocked' });
            blocker.reset?.();
            if (decision && typeof decision === 'object' && 'redirect' in decision)
              void plus.navigate(decision.redirect);
          }
        })
        .catch(() => {
          if (active) blocker.reset?.();
        });
      return () => {
        active = false;
      };
    }, [blocker, plus]);
    if (!connectionRef.current) {
      const wait = (id: string, issue: () => unknown): Promise<CommitResult> =>
        new Promise((resolve) => {
          const before = locationRef.current;
          const timer = setTimeout(
            () => finish({ status: 'failed', message: 'Navigation produced no commit receipt' }),
            3000,
          );
          const finish = (result: CommitResult) => {
            clearTimeout(timer);
            pending.current.delete(id);
            resolve(result);
          };
          pending.current.set(id, { finish, before });
          try {
            const result = issue();
            if (result && typeof (result as Promise<unknown>).then === 'function')
              void (result as Promise<unknown>).then(
                () => {
                  if (!pending.current.has(id)) return;
                  pending.current.get(id)!.settled = true;
                  const current = locationRef.current;
                  // Promise-based routers finish redirects too, even when the original state was replaced.
                  if (current !== before)
                    finish({
                      status: 'committed',
                      location: { ...toLocation(current), navigationId: id },
                    });
                },
                (error) => finish({ status: 'failed', error }),
              );
          } catch (error) {
            finish({ status: 'failed', error });
          }
        });
      connectionRef.current = {
        get initial() {
          return toLocation(locationRef.current);
        },
        matcher: reactMatcher,
        capabilities: {
          traversal: true,
          interception: Boolean(hooks.useBlocker),
          rawHistoryObservation: false,
        },
        subscribe(listener) {
          listeners.current.add(listener);
          return () => listeners.current.delete(listener);
        },
        intercept(handler) {
          check.current = handler;
          return () => {
            if (check.current === handler) check.current = null;
          };
        },
        commit(request) {
          if (request.signal.aborted) return { status: 'cancelled' };
          return wait(request.navigationId, () =>
            navigateRef.current(request.href, {
              ...request.options,
              relative:
                request.options.relative === 'path'
                  ? 'path'
                  : request.options.relative === 'route'
                    ? 'route'
                    : undefined,
              state: { ...request.state, [TOKEN]: request.navigationId },
            }),
          );
        },
        go(delta) {
          if (!delta) return { status: 'noop' };
          if (traversal.current)
            return { status: 'failed', message: 'History traversal already pending' };
          return new Promise((resolve) => {
            const timer = setTimeout(() => {
              traversal.current = null;
              resolve({ status: 'failed', message: 'History traversal produced no receipt' });
            }, 1000);
            traversal.current = {
              finish(result) {
                clearTimeout(timer);
                traversal.current = null;
                resolve(result);
              },
            };
            navigateRef.current(delta);
          });
        },
        back() {
          return this.go!(-1);
        },
        forward() {
          return this.go!(1);
        },
      };
    }
    useCommittedEffect(() => {
      const disconnect = plus.connect(connectionRef.current!);
      return () => {
        disconnect();
        for (const entry of [...pending.current.values()]) entry.finish({ status: 'cancelled' });
        traversal.current?.finish({ status: 'cancelled' });
      };
    }, [plus]);
    useCommittedEffect(() => {
      const next = toLocation(location),
        token = next.navigationId;
      if (token) pending.current.get(token)?.finish({ status: 'committed', location: next });
      if (!token || !pending.current.has(token))
        for (const [id, entry] of [...pending.current]) {
          if (entry.settled && location !== entry.before)
            entry.finish({ status: 'committed', location: { ...next, navigationId: id } });
        }
      traversal.current?.finish({
        status: 'committed',
        location: { ...next, navigationId: undefined },
      });
      for (const listener of listeners.current)
        listener({
          location: next,
          source: token && pending.current.has(token) ? 'plus' : 'native',
          navigationId: token,
        });
    }, [location.key, location.pathname, location.search, location.hash, location.state]);
    return createElement(PlusContext.Provider, { value: plus }, children);
  };
}
