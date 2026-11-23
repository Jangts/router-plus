/** Sequential command orchestration: event-driven source waits, bounded lifetime and receipts. */
import { commandHandlers, dispatchCommand } from './commands.js';
import type {
  CommandResult,
  CommandSequenceOptions,
  CommandSequenceResult,
  PageStateBridge,
  RouterCommand,
  RouterEvent,
  RouterPlus,
} from './types.js';

/** Identity comes from the installed registration entry, never from an ID or live value. */
export interface SequenceSource {
  readonly identity: object;
  readonly bridge: PageStateBridge;
}
const navigationKinds = new Set(['navigate', 'replace', 'back', 'forward', 'go', 'query.patch']);
const sourceIds: Partial<Record<RouterCommand['kind'], (command: any) => string>> = {
  'state.call': (command) => command.id,
  'state.set': (command) => command.key ?? 'default',
  'state.patch': (command) => command.key ?? 'default',
  'state.reset': (command) => command.key ?? 'default',
  'state.read': (command) => command.key ?? 'default',
  'tab.set': () => 'tab',
  'tab.read': () => 'tab',
};
class SequenceStopped extends Error {
  constructor(readonly reason: 'cancelled' | 'timeout') {
    super(reason);
  }
}

/** Execute a captured command order; app payloads/effects are never cloned, replayed or rolled back. */
export async function executeSequence(
  facade: RouterPlus,
  commands: readonly RouterCommand[],
  options: CommandSequenceOptions | undefined,
  readSource: (facade: RouterPlus, id: string) => SequenceSource | undefined,
  disposed: () => boolean,
  subscribe: (listener: (event: RouterEvent) => void) => () => void,
  currentKey: () => string | undefined,
  currentScope: () => RouterPlus,
): Promise<CommandSequenceResult> {
  const results: CommandResult[] = [];
  const timeout = options?.timeoutMs ?? 10000;
  if (!Number.isFinite(timeout) || timeout < 0 || timeout > 2147483647)
    return { ok: false, reason: 'invalid-target', failedIndex: 0, results };
  const steps = [...commands];
  const invalid = steps.findIndex(
    (command) => !command || !Object.hasOwn(commandHandlers, command.kind),
  );
  if (invalid !== -1)
    return { ok: false, reason: 'unsupported-command', failedIndex: invalid, results };
  let stopped: SequenceStopped | undefined,
    navigating = false,
    key = currentKey(),
    index = 0;
  const source = (id: string) => readSource(facade, id);
  let active: { id: string; source: SequenceSource } | undefined;
  let rejectStop!: (error: SequenceStopped) => void;
  const cancellation = new Promise<never>((_, reject) => {
    rejectStop = reject;
  });
  const lifetime = new AbortController();
  void cancellation.catch(() => {});
  const stop = (reason: 'cancelled' | 'timeout') => {
    if (stopped) return;
    stopped = new SequenceStopped(reason);
    rejectStop(stopped);
    lifetime.abort();
  };
  const abort = () => stop('cancelled');
  const waiters = new Set<() => void>();
  const unsubscribe = subscribe((event) => {
    if (
      event.type === 'disposed' ||
      (!navigating &&
        event.type === 'release' &&
        event.instance.stateKey === facade.getInstance()?.stateKey)
    )
      stop('cancelled');
    if (!navigating && event.type === 'location' && currentKey() !== key) stop('cancelled');
    if (active && source(active.id)?.identity !== active.source.identity) stop('cancelled');
    for (const check of [...waiters]) check();
  });
  options?.signal?.addEventListener('abort', abort, { once: true });
  if (options?.signal?.aborted || disposed()) stop('cancelled');
  if (timeout === 0) stop('timeout');
  const timer = setTimeout(() => stop('timeout'), timeout);
  const bounded = <T>(task: PromiseLike<T> | T): Promise<T> =>
    stopped ? Promise.reject(stopped) : Promise.race([Promise.resolve(task), cancellation]);
  const waitSource = async (id: string): Promise<SequenceSource> => {
    let check = () => {};
    try {
      return await bounded(
        new Promise<SequenceSource>((resolve) => {
          check = () => {
            const found = source(id);
            if (found) resolve(found);
          };
          waiters.add(check);
          check();
        }),
      );
    } finally {
      waiters.delete(check);
    }
  };
  try {
    for (; index < steps.length; index++) {
      const command = steps[index];
      if (stopped) throw stopped;
      const id = sourceIds[command.kind]?.(command);
      if (id !== undefined) {
        active = { id, source: await waitSource(id) };
        await bounded(facade.whenReady());
        await bounded(active.source.bridge.whenSettled?.(lifetime.signal));
        if (source(id)?.identity !== active.source.identity) throw new SequenceStopped('cancelled');
      }
      navigating = navigationKinds.has(command.kind);
      if (stopped) throw stopped;
      const result = await bounded(dispatchCommand(facade, command));
      // Store the actual command receipt before waiting for its resulting framework publication.
      results.push(result);
      if (!result.ok)
        return { ok: false, reason: result.reason, failedIndex: results.length - 1, results };
      if (active) {
        await bounded(active.source.bridge.whenSettled?.(lifetime.signal));
        if (source(active.id)?.identity !== active.source.identity)
          throw new SequenceStopped('cancelled');
      }
      active = undefined;
      if (navigating) {
        const receipt = result.value as
          { context?: { instance?: { stateKey?: string } }; external?: boolean } | undefined;
        if (receipt?.context && receipt.context.instance?.stateKey !== currentKey())
          throw new SequenceStopped('cancelled');
        if (receipt?.external && index + 1 < steps.length)
          return { ok: false, reason: 'unsupported-command', failedIndex: index, results };
        key = currentKey();
        facade = currentScope();
      }
      navigating = false;
    }
    if (stopped) throw stopped;
    return { ok: true, results };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof SequenceStopped ? error.reason : 'failed',
      failedIndex: index,
      results,
    };
  } finally {
    clearTimeout(timer);
    unsubscribe();
    options?.signal?.removeEventListener('abort', abort);
    waiters.clear();
    lifetime.abort();
  }
}
