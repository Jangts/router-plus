/**
 * Page interaction state: highlight, tour, focus and scroll.
 *
 * The core owns state and target resolution orchestration. DOM access is provided by the
 * optional target runtime installed from `@jangts/router-plus/overlay`; without it, element
 * and selector targets cannot be resolved and focus/scroll report `dom-unavailable`.
 */
import type {
  CommandResult,
  TargetAnchor,
  FocusOptions,
  HighlightOptions,
  HighlightState,
  PageContext,
  RouterEvent,
  ScrollOptions,
  ScrollStrategy,
  TargetRef,
  TargetResolver,
  TargetRuntime,
  TourOptions,
  TourState,
  TourStep,
} from './types.js';
import { toErrorMessage } from './util.js';

export interface InteractionOptions {
  getContext(): PageContext;
  emit(event: RouterEvent): void;
  getRoot?(context: PageContext): Element | ShadowRoot | null;
}

interface ActiveHighlight {
  readonly state: HighlightState;
  readonly durationTimer?: ReturnType<typeof setTimeout>;
}

export class InteractionEngine {
  private readonly targets = new Map<string, Map<string, () => TargetAnchor | null>>();
  private readonly resolvers = new Map<string, TargetResolver>();
  private runtime: TargetRuntime | null = null;
  private readonly scrollStrategies = new Map<string, ScrollStrategy>();
  private highlightState: ActiveHighlight | null = null;
  private tourState: TourState | null = null;
  private tourOptions: TourOptions = {};
  private tourToken = 0;
  private controller: AbortController | null = null;
  private readonly options: InteractionOptions;

  constructor(options: InteractionOptions) {
    this.options = options;
  }

  setTargetRuntime(runtime: TargetRuntime | null): void {
    if (runtime && this.runtime && runtime !== this.runtime)
      throw new Error('Target runtime already installed');
    this.runtime = runtime;
  }

  registerScrollStrategy(strategy: ScrollStrategy): () => void {
    if (this.scrollStrategies.has(strategy.id))
      throw new Error(`Scroll strategy already registered: ${strategy.id}`);
    this.scrollStrategies.set(strategy.id, strategy);
    return () => {
      if (this.scrollStrategies.get(strategy.id) === strategy)
        this.scrollStrategies.delete(strategy.id);
    };
  }

  registerTargetResolver(kind: string, resolver: TargetResolver): () => void {
    if (this.resolvers.has(kind)) throw new Error(`Target resolver already registered: ${kind}`);
    this.resolvers.set(kind, resolver);
    return () => {
      if (this.resolvers.get(kind) === resolver) this.resolvers.delete(kind);
    };
  }

  registerTarget(
    id: string,
    resolve: () => TargetAnchor | null,
    context = this.options.getContext(),
  ): () => void {
    const key = context.instance?.stateKey ?? '';
    const targets = this.targets.get(key) ?? new Map<string, () => TargetAnchor | null>();
    if (targets.has(id)) throw new Error(`Target already registered: ${id}`);
    targets.set(id, resolve);
    this.targets.set(key, targets);
    return () => {
      if (targets.get(id) === resolve) targets.delete(id);
      if (!targets.size) this.targets.delete(key);
    };
  }
  unregisterTarget(id: string, context = this.options.getContext()): void {
    this.targets.get(context.instance?.stateKey ?? '')?.delete(id);
  }
  listTargets(context = this.options.getContext()): readonly string[] {
    return [...(this.targets.get(context.instance?.stateKey ?? '')?.keys() ?? [])];
  }
  releaseScope(key: string): void {
    this.targets.delete(key);
    this.cancelPending();
  }

  getHighlight(): HighlightState | null {
    return this.highlightState?.state ?? null;
  }

  getTour(): TourState | null {
    return this.tourState;
  }

  private async resolve(
    ref: TargetRef,
    signal: AbortSignal,
    waitForTarget = false,
    timeout = 3000,
    context = this.options.getContext(),
  ): Promise<TargetAnchor | null> {
    if (typeof ref === 'object' && ref !== null && 'target' in ref) {
      const resolver = this.resolvers.get(ref.target);
      if (!resolver) return null;
      return (
        (await resolver.resolve({ target: ref.target, value: ref.value }, context, signal)) ?? null
      );
    }
    if (typeof ref === 'object' && ref !== null && 'rect' in ref)
      return { getBoundingClientRect: ref.rect, contextElement: ref.contextElement };
    if (typeof ref === 'string') {
      const registered = this.targets.get(context.instance?.stateKey ?? '')?.get(ref);
      if (registered) return registered();
    }
    if (this.runtime) {
      return this.runtime.resolve(ref, context, {
        timeout,
        waitForTarget,
        signal,
        root: this.options.getRoot?.(context) ?? undefined,
      });
    }
    if (typeof ref === 'object' && ref !== null && 'element' in ref) {
      const element = typeof ref.element === 'function' ? ref.element() : ref.element;
      return element ?? null;
    }
    return null;
  }

  private cancelPending(): void {
    this.controller?.abort(new Error('Interaction superseded'));
    this.controller = new AbortController();
  }

  private clearTimer(): void {
    if (this.highlightState?.durationTimer) clearTimeout(this.highlightState.durationTimer);
  }

  private setHighlight(state: HighlightState | null, duration?: number): void {
    this.clearTimer();
    if (!state) {
      this.highlightState = null;
      this.options.emit({ type: 'highlight', state: null });
      return;
    }
    const durationTimer =
      duration && duration > 0
        ? setTimeout(() => {
            this.setHighlight(null);
          }, duration)
        : undefined;
    this.highlightState = { state, durationTimer };
    this.options.emit({ type: 'highlight', state });
  }

  async highlight(
    target: TargetRef,
    options: HighlightOptions = {},
    context = this.options.getContext(),
  ): Promise<CommandResult> {
    if (this.tourState) this.stopTour();
    this.cancelPending();
    const signal = this.controller!.signal;
    try {
      const element = await this.resolve(
        target,
        signal,
        options.waitForTarget ?? false,
        options.timeout ?? 3000,
        context,
      );
      if (signal.aborted) return { ok: false, reason: 'cancelled' };
      if (!element) return { ok: false, reason: 'target-not-found', message: '未找到高亮目标' };
      if (options.scrollIntoView) {
        await this.executeScroll(element, { block: 'center', behavior: 'smooth' }, context);
      }
      if (signal.aborted) return { ok: false, reason: 'cancelled' };
      this.setHighlight(
        {
          target,
          element,
          message: options.message,
          placement: options.placement ?? 'auto',
          spotlight: options.spotlight,
          padding: options.padding,
          dismissible: options.dismissible,
          interactive: options.interactive,
          className: options.className,
          startedAt: Date.now(),
        },
        options.duration,
      );
      return { ok: true };
    } catch (error) {
      if (signal.aborted) return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  clearHighlight(): CommandResult {
    this.cancelPending();
    this.runtime?.restoreFocus?.();
    this.setHighlight(null);
    return { ok: true };
  }

  async startTour(steps: readonly TourStep[], options: TourOptions = {}): Promise<CommandResult> {
    if (steps.length === 0) return { ok: false, reason: 'invalid-target', message: '导览步骤为空' };
    this.tourToken += 1;
    this.tourOptions = options;
    this.tourState = {
      id: options.id,
      steps,
      index: 0,
      awaiting: false,
      active: true,
      keyboard: options.keyboard ?? true,
      dismissible: options.dismissible ?? true,
    };
    this.options.emit({ type: 'tour', state: this.tourState });
    return this.prepareStep(0);
  }

  private async prepareStep(index: number): Promise<CommandResult> {
    const tour = this.tourState;
    if (!tour) return { ok: false, reason: 'cancelled' };
    const step = tour.steps[index];
    if (!step) return this.finishTour();
    const token = ++this.tourToken;
    this.cancelPending();
    const signal = this.controller!.signal;
    try {
      await this.tourOptions.beforeStep?.(index, step);
      if (token !== this.tourToken || signal.aborted) return { ok: false, reason: 'cancelled' };
      const element = await this.resolve(step.target, signal, true, 3000);
      if (token !== this.tourToken || signal.aborted) return { ok: false, reason: 'cancelled' };
      if (!element) return { ok: false, reason: 'target-not-found', message: '未找到导览目标' };
      this.tourState = {
        ...tour,
        index,
        awaiting: Boolean(step.awaitUser || step.advanceOn === 'click'),
        active: true,
      };
      this.setHighlight({
        target: step.target,
        element,
        message: step.message,
        placement: step.placement ?? 'auto',
        startedAt: Date.now(),
      });
      this.options.emit({ type: 'tour', state: this.tourState });
      this.tourOptions.onStep?.(index, step);
      await this.tourOptions.afterStep?.(index, step);
      if (token !== this.tourToken || signal.aborted) return { ok: false, reason: 'cancelled' };
      return { ok: true };
    } catch (error) {
      if (token !== this.tourToken || signal.aborted) return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  async nextTourStep(step = 1): Promise<CommandResult> {
    const tour = this.tourState;
    if (!tour?.active) return { ok: false, reason: 'cancelled', message: '没有进行中的导览' };
    if (!Number.isSafeInteger(step))
      return { ok: false, reason: 'invalid-target', message: '导览步长必须为安全整数' };
    if (step > tour.steps.length - 1 - tour.index) return this.finishTour();
    const index = Math.max(0, tour.index + step);
    if (index === tour.index) return { ok: true };
    return this.prepareStep(index);
  }

  async prevTourStep(): Promise<CommandResult> {
    return this.nextTourStep(-1);
  }

  stopTour(cancelled = true): CommandResult {
    const had = this.tourState;
    this.tourToken += 1;
    this.cancelPending();
    this.tourState = null;
    this.setHighlight(null);
    this.options.emit({ type: 'tour', state: null });
    if (had && cancelled) this.tourOptions.onCancel?.();
    return { ok: true };
  }

  private finishTour(): CommandResult {
    this.tourState = null;
    this.setHighlight(null);
    this.tourToken += 1;
    this.options.emit({ type: 'tour', state: null });
    this.tourOptions.onFinish?.();
    return { ok: true };
  }

  private async executeScroll(
    element: TargetAnchor,
    options: ScrollOptions,
    context = this.options.getContext(),
  ): Promise<void> {
    const strategy = [...this.scrollStrategies.values()]
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .find((item) => !item.matches || item.matches(element, options, context));
    if (strategy) {
      await strategy.scroll(element, options, context);
      return;
    }
    if (this.runtime) {
      await this.runtime.scroll(element, options);
      return;
    }
    if ('scrollIntoView' in element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({
        behavior: options.behavior ?? 'auto',
        block: options.block ?? 'start',
        inline: options.inline ?? 'nearest',
      });
    } else throw new Error('Target has no scroll implementation');
  }

  async focus(
    target: TargetRef,
    options: FocusOptions = {},
    context = this.options.getContext(),
  ): Promise<CommandResult> {
    this.cancelPending();
    const controller = this.controller!;
    try {
      const element = await this.resolve(target, controller.signal, false, 0, context);
      if (controller.signal.aborted) return { ok: false, reason: 'cancelled' };
      if (!element) return { ok: false, reason: 'target-not-found' };
      if (this.runtime) {
        return this.runtime.focus(element, options)
          ? { ok: true }
          : { ok: false, reason: 'unsupported-command', message: '目标不可聚焦' };
      }
      if (typeof (element as HTMLElement).focus !== 'function') {
        return { ok: false, reason: 'unsupported-command', message: '目标不可聚焦' };
      }
      (element as HTMLElement).focus({ preventScroll: options.preventScroll });
      return { ok: true };
    } catch (error) {
      if (controller.signal.aborted) return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  async scrollTo(
    target: TargetRef,
    options: ScrollOptions = {},
    context = this.options.getContext(),
  ): Promise<CommandResult> {
    if (!this.runtime && !this.scrollStrategies.size && typeof document === 'undefined') {
      return { ok: false, reason: 'dom-unavailable' };
    }
    this.cancelPending();
    const controller = this.controller!;
    try {
      const element = await this.resolve(target, controller.signal, false, 0, context);
      if (controller.signal.aborted) return { ok: false, reason: 'cancelled' };
      if (!element) return { ok: false, reason: 'target-not-found' };
      await this.executeScroll(element, options, context);
      if (controller.signal.aborted) return { ok: false, reason: 'cancelled' };
      return { ok: true };
    } catch (error) {
      if (controller.signal.aborted) return { ok: false, reason: 'cancelled' };
      return { ok: false, reason: 'failed', message: toErrorMessage(error) };
    }
  }

  handleNavigation(_context: PageContext, end: boolean): void {
    if (!end) return;
    this.cancelPending();
    this.runtime?.restoreFocus?.();
    if (this.tourState?.active) this.stopTour(true);
    if (this.highlightState) this.setHighlight(null);
  }

  dispose(): void {
    this.cancelPending();
    this.clearTimer();
    this.tourToken += 1;
    this.highlightState = null;
    this.tourState = null;
    this.targets.clear();
    this.resolvers.clear();
    this.runtime?.restoreFocus?.();
    this.runtime = null;
    this.scrollStrategies.clear();
  }
}
