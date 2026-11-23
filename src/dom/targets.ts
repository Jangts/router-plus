/**
 * DOM target runtime: data markers, selectors, element refs, waiting and scrolling.
 *
 * Loaded only through `@jangts/router-plus/overlay`, so importing the core never touches DOM
 * globals at module load.
 */
import type {
  FocusOptions,
  TargetAnchor,
  PageContext,
  ScrollOptions,
  TargetRef,
  TargetRuntime,
} from '../core/types.js';

export interface DomRuntimeOptions {
  readonly root?: Document | ShadowRoot | Element;
}

type QueryRoot = Document | ShadowRoot | Element;

function cssEscape(value: string): string {
  const scope = globalThis as unknown as { CSS?: { escape?: (input: string) => string } };
  if (scope.CSS?.escape) return scope.CSS.escape(value);
  return value.replace(/["\\]/g, '\\$&');
}

function visible(element: Element | null): element is Element {
  if (!element) return false;
  if (!('getClientRects' in element)) return false;
  const rects = element.getClientRects();
  if (rects.length > 0) return true;
  return typeof document !== 'undefined' && document.activeElement === element;
}

function firstVisible(root: QueryRoot, selector: string): Element | null {
  for (const element of root.querySelectorAll(selector)) {
    if (visible(element)) return element;
  }
  return null;
}

function resolveImmediately(ref: TargetRef, root: QueryRoot): TargetAnchor | null {
  if (typeof ref === 'object' && 'rect' in ref)
    return { getBoundingClientRect: ref.rect, contextElement: ref.contextElement };
  if (typeof ref === 'string') {
    return firstVisible(root, `[data-router-plus-target="${cssEscape(ref)}"]`);
  }
  if ('element' in ref) {
    const value = typeof ref.element === 'function' ? ref.element() : ref.element;
    return value ?? null;
  }
  if ('selector' in ref) return firstVisible(root, ref.selector);
  return null;
}

function waitFor(
  ref: TargetRef,
  root: QueryRoot,
  timeout: number,
  signal: AbortSignal,
): Promise<TargetAnchor | null> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve(null);
      return;
    }
    let settled = false;
    const finish = (element: TargetAnchor | null) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      resolve(element);
    };
    const attempt = () => {
      const element = resolveImmediately(ref, root);
      if (element) finish(element);
    };
    const abort = () => finish(null);
    const observer = new MutationObserver(() => attempt());
    observer.observe(root instanceof Document ? root.documentElement : root, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    const timer = setTimeout(() => finish(null), Math.max(0, timeout));
    signal.addEventListener('abort', abort, { once: true });
    attempt();
  });
}

/** CSSOM nearest alignment keeps spanning/visible targets fixed and chooses the closest edge. */
function alignAxis(
  start: number,
  end: number,
  viewportStart: number,
  viewportEnd: number,
  alignment: NonNullable<ScrollOptions['block']>,
): number {
  if (![start, end, viewportStart, viewportEnd].every(Number.isFinite)) return 0;
  if (alignment === 'start') return start - viewportStart;
  if (alignment === 'end') return end - viewportEnd;
  if (alignment === 'center') return (start + end - viewportStart - viewportEnd) / 2;
  if (start < viewportStart && end > viewportEnd) return 0;
  const small = end - start <= viewportEnd - viewportStart;
  if (start < viewportStart) return small ? start - viewportStart : end - viewportEnd;
  if (end > viewportEnd) return small ? end - viewportEnd : start - viewportStart;
  return 0;
}

export function createDomRuntime(options: DomRuntimeOptions = {}): TargetRuntime {
  const root = options.root ?? document;
  let previousFocus: HTMLElement | null = null;
  return {
    restoreFocus() {
      const target = previousFocus;
      previousFocus = null;
      if (target?.isConnected) target.focus({ preventScroll: true });
    },
    async resolve(ref, _context: PageContext, resolveOptions) {
      const targetRoot = resolveOptions.root ?? root;
      const immediate = resolveImmediately(ref, targetRoot);
      if (immediate || !resolveOptions.waitForTarget) return immediate;
      return waitFor(ref, targetRoot, resolveOptions.timeout, resolveOptions.signal);
    },
    focus(element: TargetAnchor, focusOptions: FocusOptions) {
      const target = element as HTMLElement;
      if (typeof target.focus !== 'function') return false;
      if (focusOptions.restore)
        previousFocus = target.ownerDocument?.activeElement as HTMLElement | null;
      target.focus({ preventScroll: focusOptions.preventScroll });
      return true;
    },
    scroll(element: TargetAnchor, scrollOptions: ScrollOptions) {
      const reduced =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const behavior = reduced ? 'auto' : (scrollOptions.behavior ?? 'auto');
      const container =
        typeof scrollOptions.container === 'string'
          ? root.querySelector(scrollOptions.container)
          : scrollOptions.container;
      if (container) {
        const rect = element.getBoundingClientRect(),
          bounds = container.getBoundingClientRect();
        const top = bounds.top + (container.clientTop || 0);
        const left = bounds.left + (container.clientLeft || 0);
        const bottom = top + (container.clientHeight || bounds.height);
        const right = left + (container.clientWidth || bounds.width);
        const direction =
          container.ownerDocument?.defaultView?.getComputedStyle(container).direction;
        let inline = scrollOptions.inline ?? 'nearest';
        if (direction === 'rtl' && (inline === 'start' || inline === 'end'))
          inline = inline === 'start' ? 'end' : 'start';
        container.scrollBy({
          top: scrollOptions.offset
            ? rect.top - top - scrollOptions.offset
            : alignAxis(rect.top, rect.bottom, top, bottom, scrollOptions.block ?? 'start'),
          left: alignAxis(rect.left, rect.right, left, right, inline),
          behavior,
        });
        return;
      }
      if (scrollOptions.offset) {
        const rect = element.getBoundingClientRect();
        const offset = scrollOptions.offset;
        if (typeof window !== 'undefined') {
          window.scrollBy({ top: rect.top - offset, behavior });
        }
        return;
      }
      const scrollTarget = 'scrollIntoView' in element ? element : element.contextElement;
      if (!scrollTarget) throw new Error('Target has no scrollable element');
      scrollTarget.scrollIntoView({
        behavior,
        block: scrollOptions.block ?? 'start',
        inline: scrollOptions.inline ?? 'nearest',
      });
    },
  };
}
