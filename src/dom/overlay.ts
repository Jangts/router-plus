/**
 * Default overlay renderer and DOM runtime installation.
 *
 * Highlight and tour share one overlay. Only one renderer is mounted per instance; the runtime
 * can be installed independently of the overlay.
 */
import type { HighlightState, PageContext, RouterPlus, TourState } from '../core/types.js';
import { createDomRuntime, type DomRuntimeOptions } from './targets.js';
import { overlayStyles } from './styles.js';
import { applyOverlayTheme, type OverlayTheme } from './theme.js';
import type { HighlightComponentProps, OverlayHighlightRenderer } from './highlight.js';
import { createDefaultHighlightRenderer } from './default-highlight.js';

interface RuntimeRecord {
  count: number;
  dispose: () => void;
}

const runtimes = new WeakMap<RouterPlus, RuntimeRecord>();

/**
 * Install the DOM target runtime on an instance. Repeated installation is reference counted and
 * shares one runtime.
 */
export function installDomRuntime(plus: RouterPlus, options: DomRuntimeOptions = {}): () => void {
  const existing = runtimes.get(plus);
  if (existing) {
    existing.count += 1;
    return runtimeHandle(plus, existing);
  }
  const runtime = createDomRuntime(options);
  const pluginId = 'router-plus:dom-runtime';
  const record: RuntimeRecord = {
    count: 1,
    dispose: () => {
      void plus.unuse(pluginId).catch(() => undefined);
      runtimes.delete(plus);
    },
  };
  runtimes.set(plus, record);
  void plus
    .use({
      id: pluginId,
      setup(api) {
        api.registerTargetRuntime(runtime);
      },
    })
    .catch(() => undefined);
  return runtimeHandle(plus, record);
}

/** Each installation owns one reference; stale/repeated cleanup cannot release another owner. */
function runtimeHandle(plus: RouterPlus, record: RuntimeRecord): () => void {
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    if (runtimes.get(plus) !== record) return;
    record.count -= 1;
    if (record.count <= 0) record.dispose();
  };
}

export interface OverlayAppearanceOptions {
  readonly interactive?: boolean;
  /** Persistent App class, retained when per-highlight classes change. */
  readonly className?: string;
  readonly theme?: OverlayTheme;
  /** Render only the highlight content inside a Plus-positioned box, preserving the overlay. */
  readonly highlightRenderer?: OverlayHighlightRenderer;
}
export interface MountOverlayOptions extends OverlayAppearanceOptions {
  readonly root?: Document | ShadowRoot | Element;
  /** Install the DOM runtime together with the overlay; defaults to true. */
  readonly installRuntime?: boolean;
  /** Set false when importing overlay.css or providing the complete stylesheet yourself. */
  readonly injectStyles?: boolean;
}
/** Callable cleanup with live appearance replacement; updating never reinstalls the runtime. */
export interface OverlayMount {
  (): void;
  update(options: OverlayAppearanceOptions): void;
}
interface MountRecord {
  count: number;
  dispose: () => void;
  update: (options: OverlayAppearanceOptions) => void;
}

function mountHandle(plus: RouterPlus, record: MountRecord): OverlayMount {
  let active = true;
  return Object.assign(
    () => {
      if (!active) return;
      active = false;
      releaseMount(plus);
    },
    {
      update(options: OverlayAppearanceOptions) {
        if (active && mounts.get(plus) === record) record.update(options);
      },
    },
  );
}

const mounts = new WeakMap<RouterPlus, MountRecord>();

/** Mount the neutral default overlay. Repeated mounts share one renderer. */
export function mountOverlay(plus: RouterPlus, options: MountOverlayOptions = {}): OverlayMount {
  const existing = mounts.get(plus);
  if (existing) {
    existing.count += 1;
    return mountHandle(plus, existing);
  }

  const host =
    options.root?.nodeType === 9
      ? (options.root as Document).body
      : (options.root ?? document.body);
  let appearance: OverlayAppearanceOptions = options;
  const container = document.createElement('div');
  container.className = ['rp-overlay-root', appearance.className].filter(Boolean).join(' ');
  container.dataset.interactive = String(options.interactive ?? false);
  container.hidden = true;

  const style = document.createElement('style');
  style.dataset.routerPlus = 'overlay-styles';
  style.textContent = overlayStyles;

  const mask = document.createElement('div');
  mask.className = 'rp-overlay-mask';
  const highlightBox = document.createElement('div');
  highlightBox.className = 'rp-overlay-highlight';
  const aperture = document.createElement('div');
  aperture.className = 'rp-overlay-aperture';
  const defaultHost = document.createElement('div');
  defaultHost.className = 'rp-overlay-default-highlight-content';
  const defaultComponent = createDefaultHighlightRenderer();
  defaultComponent.mount(defaultHost);
  highlightBox.append(aperture, defaultHost);
  container.append(mask, highlightBox);
  applyOverlayTheme(container, appearance.theme);
  if (options.injectStyles !== false) host.append(style);
  host.append(container);

  let customHighlight: { renderer: OverlayHighlightRenderer; host: HTMLElement } | null = null;
  const setHighlightRenderer = (renderer?: OverlayHighlightRenderer) => {
    if (customHighlight?.renderer === renderer) return;
    let next: typeof customHighlight = null;
    if (renderer) {
      const host = document.createElement('div');
      host.className = 'rp-overlay-highlight-content';
      highlightBox.append(host);
      try {
        renderer.mount(host);
        next = { renderer, host };
      } catch (error) {
        try {
          renderer.destroy();
        } finally {
          host.remove();
        }
        throw error;
      }
    }
    const previous = customHighlight;
    customHighlight = next;
    container.dataset.customHighlight = String(Boolean(next));
    if (previous) {
      try {
        previous.renderer.destroy();
      } finally {
        previous.host.remove();
      }
    }
  };
  try {
    setHighlightRenderer(options.highlightRenderer);
  } catch (error) {
    defaultComponent.destroy();
    container.remove();
    style.remove();
    throw error;
  }

  let clickTarget: Element | null = null;
  let clickHandler: (() => void) | null = null;
  let frame = 0;
  let disposed = false;

  const clearClick = () => {
    if (clickTarget && clickHandler) clickTarget.removeEventListener('click', clickHandler);
    clickTarget = null;
    clickHandler = null;
  };

  const place = (state: HighlightState, tour: TourState | null) => {
    const rect = state.element.getBoundingClientRect();
    const interactive = state.interactive ?? appearance.interactive ?? false;
    container.className = ['rp-overlay-root', appearance.className, state.className]
      .filter(Boolean)
      .join(' ');
    container.hidden = false;
    container.dataset.interactive = String(interactive);
    mask.hidden = Boolean(state.spotlight) || interactive;
    highlightBox.hidden = false;
    aperture.hidden = !state.spotlight;
    // Only measured geometry is written dynamically. All presentation and gap calculations
    // remain CSS-owned, including App variables, percentages and calc() expressions.
    for (const [name, value] of Object.entries({
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      'center-x': rect.left + rect.width / 2,
      'center-y': rect.top + rect.height / 2,
    }))
      container.style.setProperty(`--rp-target-${name}`, `${value}px`);
    if (state.padding === undefined) highlightBox.style.removeProperty('--rp-command-padding');
    else highlightBox.style.setProperty('--rp-command-padding', `${state.padding}px`);
    const measured = highlightBox.getBoundingClientRect();
    const props: HighlightComponentProps = {
      width: measured.width,
      height: measured.height,
      left: measured.left,
      top: measured.top,
      context: {
        targetRect: { width: rect.width, height: rect.height, left: rect.left, top: rect.top },
        highlight: state,
        overlayRoot: container,
        page: plus.getContext(),
        tour,
        next(step = 1) {
          if (disposed) return Promise.resolve({ ok: false, reason: 'cancelled' });
          return plus.nextTourStep(step);
        },
      },
    };
    if (customHighlight) {
      resizeObserver?.observe(highlightBox);
      resizeObserver?.unobserve(defaultComponent.bubble);
      defaultComponent.render(null);
      customHighlight.renderer.render(props);
    } else {
      resizeObserver?.unobserve(highlightBox);
      resizeObserver?.observe(defaultComponent.bubble);
      defaultComponent.render({ ...props, styles: appearance.theme });
    }
    clearClick();
    const step = tour?.active ? tour.steps[tour.index] : undefined;
    if (step?.advanceOn === 'click' && 'addEventListener' in state.element) {
      clickTarget = state.element;
      clickHandler = () => void plus.nextTourStep();
      clickTarget.addEventListener('click', clickHandler, { once: true });
    }
  };

  const render = () => {
    const state = plus.getHighlight();
    const tour = plus.getTour();
    if (!state || plus.hasCustomRenderer) {
      container.hidden = true;
      customHighlight?.renderer.render(null);
      defaultComponent.render(null);
      clearClick();
      return;
    }
    place(state, tour);
  };

  const schedule = () => {
    if (frame || disposed) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      render();
    });
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || !plus.getHighlight() || plus.hasCustomRenderer) return;
    if (event.key === 'Escape') {
      if (plus.getTour()?.dismissible === false || plus.getHighlight()?.dismissible === false)
        return;
      event.preventDefault();
      if (plus.getTour()?.active) void plus.stopTour();
      else void plus.clearHighlight();
      return;
    }
    const tour = plus.getTour();
    if (!tour?.active || tour.keyboard === false) return;
    if (event.key === 'ArrowRight') void plus.nextTourStep();
    if (event.key === 'ArrowLeft') void plus.prevTourStep();
  };

  const resizeObserver =
    typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
  if (!customHighlight) resizeObserver?.observe(defaultComponent.bubble);
  const unsubscribe = plus.subscribe((event) => {
    if (event.type === 'highlight') {
      resizeObserver?.disconnect();
      if (!customHighlight) resizeObserver?.observe(defaultComponent.bubble);
      if (event.state && 'nodeType' in event.state.element)
        resizeObserver?.observe(event.state.element);
    }
    if (
      event.type === 'highlight' ||
      event.type === 'tour' ||
      event.type === 'renderer' ||
      event.type === 'location'
    )
      schedule();
  });
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  window.addEventListener('keydown', onKey);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  const dismiss = () => {
    if (plus.getTour()?.dismissible === false || plus.getHighlight()?.dismissible === false) return;
    if (plus.getTour()?.active) void plus.stopTour();
    else void plus.clearHighlight();
  };
  mask.addEventListener('click', dismiss);
  container.addEventListener('router-plus-dismiss', dismiss);

  render();

  const overlayDispose = () => {
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    unsubscribe();
    resizeObserver?.disconnect();
    window.visualViewport?.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener('scroll', schedule);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
    clearClick();
    try {
      setHighlightRenderer();
    } finally {
      defaultComponent.destroy();
      container.remove();
      style.remove();
    }
  };

  const runtimeRelease =
    options.installRuntime === false ? null : installDomRuntime(plus, { root: options.root });

  const record: MountRecord = {
    count: 1,
    update(next) {
      applyOverlayTheme(container, next.theme);
      setHighlightRenderer(next.highlightRenderer);
      appearance = next;
      container.className = ['rp-overlay-root', next.className, plus.getHighlight()?.className]
        .filter(Boolean)
        .join(' ');
      container.dataset.interactive = String(
        plus.getHighlight()?.interactive ?? next.interactive ?? false,
      );
      render();
    },
    dispose: () => {
      runtimeRelease?.();
      try {
        overlayDispose();
      } finally {
        mounts.delete(plus);
      }
    },
  };
  mounts.set(plus, record);
  void plus.ready.then(() => schedule());
  return mountHandle(plus, record);
}

function releaseMount(plus: RouterPlus): void {
  const record = mounts.get(plus);
  if (!record) return;
  record.count -= 1;
  if (record.count <= 0) record.dispose();
}

export type { PageContext };
