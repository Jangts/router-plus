/** Built-in highlight component. It consumes the same geometry/context contract as App renderers. */
import type { HighlightPlacement } from '../core/types.js';
import type { DefaultHighlightComponentProps, OverlayHighlightRenderer } from './highlight.js';
import { applyDefaultHighlightStyles } from './theme.js';
import {
  chooseFixedTipSide,
  chooseTipSide,
  tipPlacements,
  tipViewportShift,
  type MeasuredRect,
  type TipSide,
} from './placement.js';

export interface DefaultHighlightRenderer extends OverlayHighlightRenderer {
  render(props: DefaultHighlightComponentProps | null): void;
  readonly bubble: HTMLElement;
}

/** The default component owns its rectangular bubble and uses context.next for every tour button. */
export function createDefaultHighlightRenderer(): DefaultHighlightRenderer {
  let root: HTMLElement;
  const spotlight = document.createElement('div');
  spotlight.className = 'rp-overlay-spotlight';
  const bubble = document.createElement('div');
  bubble.className = 'rp-overlay-tip';
  bubble.setAttribute('role', 'dialog');
  bubble.setAttribute('aria-live', 'polite');
  // A neutral container avoids inheriting host typography rules for paragraphs.
  const message = document.createElement('div');
  message.className = 'rp-overlay-message';
  const actions = document.createElement('div');
  actions.className = 'rp-overlay-actions';
  bubble.append(message, actions);
  const button = (label: string, action: () => void) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'rp-overlay-button';
    node.textContent = label;
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      action();
    });
    return node;
  };
  const close = button('×', () =>
    root.dispatchEvent(
      new root.ownerDocument.defaultView!.CustomEvent('router-plus-dismiss', { bubbles: true }),
    ),
  );
  close.classList.add('rp-overlay-close');
  close.setAttribute('aria-label', '关闭');
  close.title = '关闭';
  bubble.append(close);
  return {
    bubble,
    mount(host) {
      root = host;
      root.classList.add('rp-overlay-default-highlight-content');
      root.append(spotlight, bubble);
    },
    render(props) {
      if (!props) {
        root.hidden = true;
        spotlight.hidden = true;
        bubble.hidden = true;
        return;
      }
      root.hidden = false;
      applyDefaultHighlightStyles(root, props.styles);
      const { highlight, tour, next, overlayRoot } = props.context;
      spotlight.hidden = !highlight.spotlight;
      message.textContent = highlight.message ?? tour?.steps[tour.index]?.message ?? '';
      actions.replaceChildren();
      actions.hidden = !tour?.active;
      close.hidden = Boolean(tour?.active) || highlight.dismissible === false;
      if (close.hidden) close.remove();
      else if (close.parentElement !== bubble) bubble.append(close);
      bubble.dataset.close = String(!close.hidden);
      bubble.dataset.tour = String(Boolean(tour?.active));
      if (tour?.active) {
        const counter = document.createElement('span');
        counter.textContent = `${tour.index + 1}/${tour.steps.length}`;
        actions.append(counter);
        const previous = button('上一步', () => void next(-1));
        previous.disabled = tour.index === 0;
        actions.append(
          previous,
          button('下一步', () => void next()),
        );
        actions.dataset.awaiting = String(tour.awaiting);
      }
      const target = props.context.targetRect;
      placeTip(
        bubble,
        highlight.placement,
        { ...target, right: target.left + target.width, bottom: target.top + target.height },
        overlayRoot,
      );
    },
    destroy() {
      spotlight.remove();
      bubble.remove();
    },
  };
}

/** Distance from the bubble to the target on each side, using the rendered anchor. */
function tipGaps(tip: MeasuredRect, target: MeasuredRect): Record<TipSide, number> {
  return {
    top: target.top - tip.bottom,
    bottom: tip.top - target.bottom,
    left: target.left - tip.right,
    right: tip.left - target.right,
  };
}

/** Place the default bubble after its content is committed so viewport fitting uses real size. */
function placeTip(
  tip: HTMLElement,
  requested: HighlightPlacement,
  target: MeasuredRect,
  container: HTMLElement,
): void {
  tip.dataset.placement = requested;
  tip.hidden = requested === 'none';
  if (tip.hidden) return;
  const placement = Object.hasOwn(tipPlacements, requested) ? requested : 'auto';
  const definition = tipPlacements[placement];
  const view = tip.ownerDocument.defaultView ?? window;
  const visible = view.visualViewport;
  const viewport = {
    left: visible?.offsetLeft ?? 0,
    top: visible?.offsetTop ?? 0,
    width: visible?.width ?? view.innerWidth,
    height: visible?.height ?? view.innerHeight,
  };
  container.style.setProperty('--rp-viewport-width', `${viewport.width}px`);
  container.style.setProperty('--rp-viewport-height', `${viewport.height}px`);
  tip.dataset.placement = placement;
  tip.dataset.side = definition.side;
  tip.dataset.align = definition.align;
  tip.style.removeProperty('--rp-tip-shift-x');
  tip.style.removeProperty('--rp-tip-shift-y');
  let bounds = tip.getBoundingClientRect();
  const gap = Math.max(0, tipGaps(bounds, target)[definition.side]);
  const side = definition.viewport
    ? chooseTipSide(placement, target, bounds, viewport, gap)
    : chooseFixedTipSide(definition.side, target, bounds, viewport, gap);
  if (side !== definition.side) {
    tip.dataset.side = side;
    bounds = tip.getBoundingClientRect();
  }
  // Every placement stays inside the visible viewport; anchored sides flip above, then clamp.
  const shift = tipViewportShift(bounds, viewport);
  tip.style.setProperty('--rp-tip-shift-x', `${shift.x}px`);
  tip.style.setProperty('--rp-tip-shift-y', `${shift.y}px`);
}
