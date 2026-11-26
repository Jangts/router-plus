/** Declarative bubble anchors and pure visible-viewport placement helpers. */
import type { HighlightPlacement } from '../core/types.js';

export type TipSide = 'top' | 'bottom' | 'left' | 'right';
interface TipPlacement {
  readonly side: TipSide;
  readonly align: 'center' | 'start' | 'end';
  readonly viewport: boolean;
}
export const tipPlacements = {
  top: { side: 'top', align: 'center', viewport: false },
  bottom: { side: 'bottom', align: 'center', viewport: false },
  left: { side: 'left', align: 'center', viewport: false },
  right: { side: 'right', align: 'center', viewport: false },
  'left-top': { side: 'left', align: 'start', viewport: false },
  'right-top': { side: 'right', align: 'start', viewport: false },
  'left-bottom': { side: 'left', align: 'end', viewport: false },
  'right-bottom': { side: 'right', align: 'end', viewport: false },
  'top-left': { side: 'top', align: 'start', viewport: false },
  'top-right': { side: 'top', align: 'end', viewport: false },
  'bottom-left': { side: 'bottom', align: 'start', viewport: false },
  'bottom-right': { side: 'bottom', align: 'end', viewport: false },
  'top-auto': { side: 'top', align: 'center', viewport: true },
  'bottom-auto': { side: 'bottom', align: 'center', viewport: true },
  'left-auto': { side: 'left', align: 'center', viewport: true },
  'right-auto': { side: 'right', align: 'center', viewport: true },
  auto: { side: 'bottom', align: 'center', viewport: true },
  none: { side: 'bottom', align: 'center', viewport: false },
} as const satisfies Record<HighlightPlacement, TipPlacement>;

export interface ViewportRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}
export interface MeasuredRect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}
const opposites: Record<TipSide, TipSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Choose a preferred side, its opposite, then the side with most usable room. */
export function chooseTipSide(
  requested: HighlightPlacement,
  target: MeasuredRect,
  tip: MeasuredRect,
  viewport: ViewportRect,
  gap: number,
): TipSide {
  const preferred = tipPlacements[requested].side;
  const available: Record<TipSide, number> = {
    top: target.top - viewport.top - 16,
    bottom: viewport.top + viewport.height - target.bottom - 16,
    left: target.left - viewport.left - 16,
    right: viewport.left + viewport.width - target.right - 16,
  };
  const needed: Record<TipSide, number> = {
    top: tip.height + gap,
    bottom: tip.height + gap,
    left: tip.width + gap,
    right: tip.width + gap,
  };
  const candidates = [
    ...new Set<TipSide>([preferred, opposites[preferred], 'bottom', 'top', 'right', 'left']),
  ];
  return (
    candidates.find((side) => available[side] >= needed[side]) ??
    candidates.reduce((best, side) =>
      available[side] - needed[side] > available[best] - needed[best] ? side : best,
    )
  );
}

/**
 * Fixed placements keep their requested side while it can hold the bubble.
 * When that side cannot fit but the opposite side can, flip so the bubble stays usable.
 */
export function chooseFixedTipSide(
  preferred: TipSide,
  target: MeasuredRect,
  tip: MeasuredRect,
  viewport: ViewportRect,
  gap: number,
): TipSide {
  const space: Record<TipSide, number> = {
    top: target.top - viewport.top,
    bottom: viewport.top + viewport.height - target.bottom,
    left: target.left - viewport.left,
    right: viewport.left + viewport.width - target.right,
  };
  const size = preferred === 'top' || preferred === 'bottom' ? tip.height : tip.width;
  const opposite = opposites[preferred];
  return space[preferred] < size + gap && space[opposite] > space[preferred] ? opposite : preferred;
}

/** Clamp the measured bubble into the visible viewport without changing target geometry. */
export function tipViewportShift(
  tip: MeasuredRect,
  viewport: ViewportRect,
): { x: number; y: number } {
  const left = viewport.left + 16,
    top = viewport.top + 16;
  return {
    x:
      Math.max(
        left,
        Math.min(tip.left, Math.max(left, viewport.left + viewport.width - 16 - tip.width)),
      ) - tip.left,
    y:
      Math.max(
        top,
        Math.min(tip.top, Math.max(top, viewport.top + viewport.height - 16 - tip.height)),
      ) - tip.top,
  };
}
