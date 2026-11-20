/**
 * `@jangts/router-plus/overlay` browser entry.
 *
 * Exports the DOM target runtime, the neutral default overlay and their styles.
 */
export { createDomRuntime, type DomRuntimeOptions } from './targets.js';
export {
  installDomRuntime,
  mountOverlay,
  type MountOverlayOptions,
  type OverlayAppearanceOptions,
  type OverlayMount,
} from './overlay.js';
export { installHistoryBridge } from './history.js';
export { overlayStyles } from './styles.js';

export { DEFAULT_OVERLAY_Z_INDEX, type OverlayTheme, type OverlayZIndexRange } from './theme.js';

export type {
  HighlightComponentProps,
  HighlightComponentContext,
  HighlightRectangle,
  OverlayHighlightRenderer,
} from './highlight.js';

export {
  createDefaultHighlightRenderer,
  type DefaultHighlightRenderer,
} from './default-highlight.js';
export type { DefaultHighlightComponentProps } from './highlight.js';
export type { DefaultHighlightStyles } from './theme.js';
