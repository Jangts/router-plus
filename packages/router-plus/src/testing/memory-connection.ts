/**
 * In-memory connection for tests and non-browser hosts.
 */
import type {
  CommitRequest,
  CommitResult,
  CommittedChange,
  ConnectionCapabilities,
  RouterConnection,
  RouterLocation,
} from '../core/types.js';
import { splitHref } from '../core/util.js';

export interface MemoryConnection extends RouterConnection {
  readonly location: RouterLocation;
  readonly history: readonly RouterLocation[];
  readonly capabilities: ConnectionCapabilities;
  setLocation(location: Partial<RouterLocation>, source?: CommittedChange['source']): void;
  blockNext(message?: string): void;
}

export interface MemoryConnectionOptions {
  readonly initial?: Partial<RouterLocation>;
  readonly capabilities?: ConnectionCapabilities;
}

let entrySequence = 0;

function normalize(initial: Partial<RouterLocation> = {}): RouterLocation {
  const parts = splitHref(`${initial.pathname ?? '/'}${initial.search ?? ''}${initial.hash ?? ''}`);
  return {
    pathname: parts.pathname || '/',
    search: parts.search,
    hash: parts.hash,
    state: initial.state,
    entryKey: initial.entryKey ?? `entry-${++entrySequence}`,
    action: initial.action ?? 'initial',
    navigationId: initial.navigationId,
  };
}

export function createMemoryConnection(options: MemoryConnectionOptions = {}): MemoryConnection {
  let current = normalize(options.initial);
  const entries: RouterLocation[] = [current];
  let index = 0;
  let blocked: string | null = null;
  let check: ((target: RouterLocation) => Promise<import('../core/types.js').GuardResult>) | null =
    null;
  const listeners = new Set<(change: CommittedChange) => void>();

  const notify = (location: RouterLocation, source: CommittedChange['source']) => {
    for (const listener of listeners) listener({ location, source });
  };

  const connection: MemoryConnection = {
    initial: current,
    capabilities: options.capabilities ?? {
      interception: true,
      traversal: true,
      rawHistoryObservation: true,
    },
    get location() {
      return current;
    },
    get history() {
      return entries;
    },
    intercept(handler) {
      check = handler;
      return () => {
        if (check === handler) check = null;
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    blockNext(message = 'blocked by memory connection') {
      blocked = message;
    },
    setLocation(location, source = 'native') {
      current = normalize({ ...current, ...location, action: location.action ?? 'native' });
      entries.push(current);
      index = entries.length - 1;
      notify(current, source);
    },
    commit(request: CommitRequest): CommitResult {
      if (request.signal.aborted) return { status: 'cancelled', message: 'aborted' };
      if (blocked) {
        const message = blocked;
        blocked = null;
        return { status: 'blocked', message };
      }
      const parts = splitHref(request.href);
      const next: RouterLocation = {
        pathname: parts.pathname,
        search: parts.search,
        hash: parts.hash,
        state: request.state,
        entryKey: request.options.replace === true ? current.entryKey : `entry-${++entrySequence}`,
        action: request.options.replace === true ? 'replace' : 'push',
        navigationId: request.navigationId,
      };
      if (request.options.replace === true) entries[index] = next;
      else {
        entries.splice(index + 1);
        entries.push(next);
        index = entries.length - 1;
      }
      current = next;
      notify(next, 'plus');
      return { status: 'committed', location: next };
    },
    back() {
      return connection.go!(-1);
    },
    forward() {
      return connection.go!(1);
    },
    async go(delta) {
      const target = index + delta;
      if (!Number.isInteger(delta) || target < 0 || target >= entries.length || delta === 0)
        return { status: 'noop', message: 'no history entry' };
      if (check && (await check(entries[target])) !== true) return { status: 'blocked' };
      index = target;
      current = { ...entries[index], action: 'pop', navigationId: undefined };
      notify(current, 'traversal');
      return { status: 'committed', location: current };
    },
  };
  return connection;
}
