/**
 * Declarative command table.
 *
 * Every command kind maps to one named handler. The router only looks up the table; unknown
 * kinds are rejected before any side effect. Adding a command requires registering it here.
 */
import type {
  CommandResult,
  FocusOptions,
  HighlightOptions,
  NavigateOptions,
  PageTarget,
  ScrollOptions,
  TargetRef,
  TourOptions,
  TourStep,
} from './types.js';
import type { RouterCommand } from './types.js';

export interface CommandHost {
  navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  replace(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  back(): Promise<CommandResult>;
  forward(): Promise<CommandResult>;
  go(delta: number): Promise<CommandResult>;
  setTab(tab: string): Promise<CommandResult>;
  getTab(): string | null;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  getState<T = unknown>(key?: string): T;
  getContext(): unknown;
  callState(id: string, ...args: unknown[]): Promise<CommandResult>;
  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(step?: number): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;
  retain(): Promise<CommandResult>;
  release(): Promise<CommandResult>;
}

type Handler<K extends RouterCommand['kind']> = (
  host: CommandHost,
  command: Extract<RouterCommand, { kind: K }>,
) => Promise<CommandResult>;

export const commandHandlers: {
  readonly [K in RouterCommand['kind']]: Handler<K>;
} = {
  navigate: (host, command) => host.navigate(command.target, command.options),
  replace: (host, command) => host.replace(command.target, command.options),
  back: (host) => host.back(),
  forward: (host) => host.forward(),
  go: (host, command) => host.go(command.delta),
  'tab.set': (host, command) => host.setTab(command.tab),
  'tab.read': async (host) => ({ ok: true, value: host.getTab() }),
  'state.call': (host, command) => host.callState(command.id, ...(command.args ?? [])),
  'state.set': (host, command) => host.setState(command.value, command.key),
  'state.patch': (host, command) => host.patchState(command.value, command.key),
  'state.reset': (host, command) => host.resetState(command.key),
  'state.read': async (host, command) => ({ ok: true, value: host.getState(command.key) }),
  'context.read': async (host) => ({ ok: true, value: host.getContext() }),
  'highlight.set': (host, command) => host.highlight(command.target, command.options),
  'highlight.clear': (host) => host.clearHighlight(),
  'tour.start': (host, command) => host.startTour(command.steps, command.options),
  'tour.next': (host, command) => host.nextTourStep(command.step),
  'tour.prev': (host) => host.prevTourStep(),
  'tour.stop': (host) => host.stopTour(),
  focus: (host, command) => host.focus(command.target, command.options),
  'scroll.to': (host, command) => host.scrollTo(command.target, command.options),
  retain: (host) => host.retain(),
  release: (host) => host.release(),
};

/** Dispatch one command, rejecting unknown kinds without side effects. */
export async function dispatchCommand(
  host: CommandHost,
  command: RouterCommand,
): Promise<CommandResult> {
  if (!command || typeof command !== 'object' || !Object.hasOwn(commandHandlers, command.kind))
    return { ok: false, reason: 'unsupported-command' };
  const handler = commandHandlers[command.kind] as Handler<RouterCommand['kind']> | undefined;
  if (!handler)
    return {
      ok: false,
      reason: 'unsupported-command',
      message: `未知命令：${String(command.kind)}`,
    };
  return handler(host, command);
}
