/**
 * Instance boundary and retained rendering helpers.
 *
 * A boundary binds the surrounding React subtree to the current page instance. Retention uses a
 * cached host that keeps the subtree mounted and hides it when inactive.
 */
import {
  createElement,
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useReducer,
  useContext,
  type ReactNode,
  type ComponentType,
} from 'react';
import { usePageContext, useRouterPlus } from './hooks.js';
import { UNSAFE_LocationContext, useLocation, useOutlet } from './native-router.js';
import { prepareNativeScope } from '../core/native-bindings.js';
import { PlusContext, usePlusContext } from './provider.js';
import type { PageContext } from '../core/types.js';

const useCommit = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Publish scope ownership after commit; discarded renders leave only collectible candidates. */
function useCommittedScope(context: PageContext) {
  const plus = usePlusContext();
  const prepared = useMemo(
    () => prepareNativeScope(plus, context),
    [plus, context.instance?.stateKey],
  );
  useCommit(() => prepared.commit(), [prepared]);
  return prepared.facade;
}

/** Context-only scope binding for caller-owned hosts; does not add DOM or navigation. */
export function RouterPlusScope({
  context,
  children,
}: {
  readonly context: PageContext;
  readonly children?: ReactNode;
}) {
  const bound = useCommittedScope(context);
  return createElement(PlusContext.Provider, { value: bound }, children);
}

export interface RouterPlusBoundaryProps {
  readonly children?: ReactNode;
  readonly context?: PageContext;
}

export function RouterPlusBoundary({ children, context: supplied }: RouterPlusBoundaryProps) {
  const activeContext = usePageContext();
  const context = supplied ?? activeContext;
  const bound = useCommittedScope(context);
  const scopeKey = context.instance?.stateKey;
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scopeKey) return;
    const unregister = bound.registerHost({
      root: () => container.current,
    });
    return unregister;
  }, [bound, scopeKey]);

  return createElement(
    'div',
    { ref: container, 'data-router-plus-boundary': scopeKey ?? '' },
    createElement(PlusContext.Provider, { value: bound }, children),
  );
}

/** Presentation host; the library continues owning instance identity, frozen location and release. */
export type RetainedHost = ComponentType<{
  readonly active: boolean;
  readonly children?: ReactNode;
}>;
export interface RouterPlusRetainedProps {
  readonly host?: RetainedHost;
  readonly active: boolean;
  readonly context?: PageContext;
  readonly children?: ReactNode;
}

/** Keep a subtree mounted while hidden; state and DOM survive deactivation. */
export function RouterPlusRetained({ active, children, context, host }: RouterPlusRetainedProps) {
  const current = usePageContext();
  const frozen = useRef(context ?? current);
  const visible = active ? (context ?? current) : frozen.current;
  useCommit(() => {
    if (active) frozen.current = visible;
  }, [active, visible]);
  const content = createElement(RouterPlusBoundary, { context: visible }, children);
  return host
    ? createElement(host, { active }, content)
    : createElement(
        'div',
        { hidden: !active, 'data-router-plus-retained': active ? 'active' : 'inactive' },
        content,
      );
}

/** Retain visited outlets by instance key while freezing their router location. */
function RetainedOutlet({ host }: { readonly host?: RetainedHost }) {
  const plus = useRouterPlus();
  const context = usePageContext();
  const outlet = useOutlet();
  const nativeLocation = useLocation();
  const locationContext = useContext(UNSAFE_LocationContext);
  const generation = useRef(0);
  const entries = useRef(
    new Map<string, { context: PageContext; node: ReactNode; generation: number }>(),
  );
  const [, redraw] = useReducer((value: number) => value + 1, 0);
  const key = context.instance?.stateKey ?? context.path;
  useEffect(
    () =>
      plus.subscribe((event) => {
        if (event.type === 'release') {
          entries.current.delete(event.instance.stateKey);
          redraw();
        }
      }),
    [plus],
  );
  const candidate = new Map(entries.current);
  useCommit(() => {
    entries.current = candidate;
  });
  for (const [id, entry] of candidate)
    if (id !== key && !entry.context.instance?.retained) candidate.delete(id);
  if (`${nativeLocation.pathname}${nativeLocation.search}${nativeLocation.hash}` === context.path)
    candidate.set(key, {
      context,
      node: outlet,
      generation: candidate.get(key)?.generation ?? ++generation.current,
    });
  return createElement(
    Fragment,
    null,
    [...candidate].map(([id, entry]) =>
      createElement(
        RouterPlusRetained,
        { key: `${id}:${entry.generation}`, active: id === key, context: entry.context, host },
        createElement(
          UNSAFE_LocationContext.Provider,
          {
            value: {
              ...locationContext,
              location: {
                ...entry.context.location,
                state: entry.context.location.state,
                key: entry.context.location.entryKey ?? 'default',
              },
            },
          },
          entry.node,
        ),
      ),
    ),
  );
}

/** Optional automatic instance host; children keep caller-controlled composition available. */
export function RouterPlusOutlet({
  children,
  host,
}: {
  readonly children?: ReactNode;
  readonly host?: RetainedHost;
}) {
  return children !== undefined
    ? createElement(Fragment, null, children)
    : createElement(RetainedOutlet, { host });
}
