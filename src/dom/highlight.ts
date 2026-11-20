/**
 * Partial highlight renderer contract. Plus owns the host rectangle and overlay stacking;
 * App content owns its appearance and can inspect typed page/interaction details.
 */
import type { CommandResult, HighlightState, PageContext, TourState } from '../core/types.js';
import type { DefaultHighlightStyles } from './theme.js';

export interface HighlightRectangle {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly top: number;
}
export interface HighlightComponentContext {
  /** Shared overlay root for App-owned portals that must retain the same stacking context. */
  readonly overlayRoot: HTMLElement;
  readonly targetRect: HighlightRectangle;
  readonly highlight: HighlightState;
  readonly page: PageContext;
  readonly tour: TourState | null;
  /** Relative tour movement: positive forward, negative backward, zero leaves the step unchanged. */
  next(step?: number): Promise<CommandResult>;
}
/** Pixel measurements include padding; left/top are viewport coordinates of the outer host. */
export interface HighlightComponentProps extends HighlightRectangle {
  readonly context: HighlightComponentContext;
}
/** The built-in component uses the same geometry/context props with optional visual settings. */
export interface DefaultHighlightComponentProps extends HighlightComponentProps {
  readonly styles?: DefaultHighlightStyles;
}

/** Geometry-aware content only; the full Core HighlightRenderer remains a separate contract. */
export interface OverlayHighlightRenderer {
  mount(host: HTMLElement): void;
  render(props: HighlightComponentProps | null): void;
  destroy(): void;
}
