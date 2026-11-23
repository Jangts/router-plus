/**
 * Browser history observation bridge.
 *
 * Wraps `pushState` / `replaceState` and listens to `popstate` so changes that bypass the
 * framework are reported to Router Plus. The wrapper preserves the original receiver, return
 * value and thrown error. It observes only; it cannot cancel an already-issued history call.
 */
import type { RouterPlus, RouterLocation } from '../core/types.js';

interface HistoryLike {
  pushState(data: unknown, unused: string, url?: string | null): void;
  replaceState(data: unknown, unused: string, url?: string | null): void;
}

interface WindowLike {
  history: HistoryLike;
  location: { pathname: string; search: string; hash: string };
  addEventListener(type: 'popstate', listener: () => void): void;
  removeEventListener(type: 'popstate', listener: () => void): void;
}

interface BridgeRecord {
  readonly subscribers: Map<RouterPlus, number>;
  dispose: () => void;
}

const bridges = new WeakMap<WindowLike, BridgeRecord>();

export function installHistoryBridge(plus: RouterPlus, target?: WindowLike): () => void {
  const scope = target ?? (globalThis as unknown as { window?: WindowLike }).window;
  if (!scope) return () => undefined;
  const existing = bridges.get(scope);
  if (existing) {
    existing.subscribers.set(plus, (existing.subscribers.get(plus) ?? 0) + 1);
    let active = true;
    return () => {
      if (active) {
        active = false;
        release(scope, plus);
      }
    };
  }

  const originalPush = scope.history.pushState;
  const originalReplace = scope.history.replaceState;
  let reporting = false;
  let installed = true;
  let revision = 0;

  const report = (action: 'push' | 'replace' | 'pop') => {
    if (reporting || !installed) return;
    reporting = true;
    try {
      const currentRevision = `raw-${++revision}`;
      for (const subscriber of [...(bridges.get(scope)?.subscribers.keys() ?? [])]) {
        if (!installed || !bridges.get(scope)?.subscribers.has(subscriber)) continue;
        try {
          subscriber.reportLocation({
            revision: currentRevision,
            pathname: scope.location.pathname,
            search: scope.location.search,
            hash: scope.location.hash,
            state: (scope.history as unknown as { state?: unknown }).state,
            action: action === 'pop' ? 'pop' : action,
          });
        } catch {
          /* An observer cannot change the successful native history result. */
        }
      }
    } finally {
      reporting = false;
    }
  };

  const push = function (this: HistoryLike, data: unknown, unused: string, url?: string | null) {
    const result = originalPush.call(this, data, unused, url);
    report('push');
    return result;
  };
  const replace = function (this: HistoryLike, data: unknown, unused: string, url?: string | null) {
    const result = originalReplace.call(this, data, unused, url);
    report('replace');
    return result;
  };

  scope.history.pushState = push;
  scope.history.replaceState = replace;
  const onPop = () => report('pop');
  scope.addEventListener('popstate', onPop);

  bridges.set(scope, {
    subscribers: new Map([[plus, 1]]),
    dispose: () => {
      installed = false;
      if (scope.history.pushState === push) scope.history.pushState = originalPush;
      if (scope.history.replaceState === replace) scope.history.replaceState = originalReplace;
      scope.removeEventListener('popstate', onPop);
      bridges.delete(scope);
    },
  });
  let active = true;
  return () => {
    if (active) {
      active = false;
      release(scope, plus);
    }
  };
}

function release(scope: WindowLike, plus: RouterPlus): void {
  const record = bridges.get(scope);
  if (!record) return;
  const count = (record.subscribers.get(plus) ?? 0) - 1;
  if (count <= 0) record.subscribers.delete(plus);
  else record.subscribers.set(plus, count);
  if (!record.subscribers.size) record.dispose();
}
