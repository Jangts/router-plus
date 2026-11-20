/**
 * Neutral default overlay styles.
 *
 * Consumers can override every value with CSS variables or replace the renderer entirely.
 * Colours and spacing here are intentionally minimal and not tied to any application design.
 */
import { DEFAULT_OVERLAY_Z_INDEX } from './theme.js';

export const overlayStyles = `
:where(.rp-overlay-root){
  position: fixed;
  inset: 0;
  z-index: var(--rp-z-index, clamp(var(--rp-z-index-min, -2147483648), ${DEFAULT_OVERLAY_Z_INDEX}, var(--rp-z-index-max, 2147483647)));
  pointer-events: none;
}
:where(.rp-overlay-mask){
  position: fixed;
  inset: 0;
  background: var(--rp-mask, rgba(0, 0, 0, 0.42));
  pointer-events: auto;
}
:where(.rp-overlay-root[data-interactive="true"] .rp-overlay-mask){
  pointer-events: none;
}
:where(.rp-overlay-highlight){
  position: fixed;
  left: calc(var(--rp-target-left) - var(--rp-command-padding, var(--rp-highlight-padding, 6px)));
  top: calc(var(--rp-target-top) - var(--rp-command-padding, var(--rp-highlight-padding, 6px)));
  width: calc(var(--rp-target-width) + 2 * var(--rp-command-padding, var(--rp-highlight-padding, 6px)));
  height: calc(var(--rp-target-height) + 2 * var(--rp-command-padding, var(--rp-highlight-padding, 6px)));
  box-sizing: border-box;
  pointer-events: none;
}
:where(.rp-overlay-root:not([data-custom-highlight="true"]) .rp-overlay-highlight){
  transition: left 120ms ease, top 120ms ease, width 120ms ease, height 120ms ease;
}
:where(.rp-overlay-aperture, .rp-overlay-spotlight, .rp-overlay-highlight-content, .rp-overlay-default-highlight-content){
  position: absolute;
  inset: 0;
  box-sizing: border-box;
}
:where(.rp-overlay-aperture){
  border-radius: var(--rp-mask-radius, var(--rp-highlight-radius, var(--rp-radius, 10px)));
  box-shadow: 0 0 0 9999px var(--rp-mask, rgba(0, 0, 0, 0.42));
  pointer-events: none;
}
:where(.rp-overlay-root[data-custom-highlight="true"] .rp-overlay-aperture){
  border-radius: var(--rp-mask-radius, 0px);
}
:where(.rp-overlay-default-highlight-content){
  font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
}
:where(.rp-overlay-spotlight){
  border-radius: var(--rp-highlight-radius, var(--rp-radius, 10px));
  border: var(--rp-highlight-border-width, 2px) solid var(--rp-highlight-border-color, var(--rp-accent, #3b82f6));
  pointer-events: none;
}
:where(.rp-overlay-tip){
  /*
   * Size to the content instead of the anchor-to-viewport remainder. Without this, a bubble
   * anchored by left/top near an edge shrinks until its text wraps one character per line.
   */
  width: max-content;
  position: fixed;
  max-width: min(320px, max(0px, calc(var(--rp-viewport-width, 100vw) - 32px)));
  max-height: max(0px, calc(var(--rp-viewport-height, 100vh) - 32px));
  overflow: auto;
  box-sizing: border-box;
  border: var(--rp-tip-border-width, 0px) solid var(--rp-tip-border-color, transparent);
  translate: var(--rp-tip-shift-x, 0px) var(--rp-tip-shift-y, 0px);
  padding: 8px 14px;
  border-radius: var(--rp-radius, 10px);
  background: var(--rp-surface, #ffffff);
  color: var(--rp-text, #1f2329);
  box-shadow: var(--rp-shadow, 0 12px 32px rgba(0, 0, 0, 0.18));
  pointer-events: auto;
  /* Measure the gap from the visible highlight edge, not the unpadded target rectangle. */
  --rp-highlight-inset: var(--rp-command-padding, var(--rp-highlight-padding, 6px));
  --rp-tip-offset: calc(var(--rp-highlight-inset) + var(--rp-tip-gap, 12px));
}
:where(.rp-overlay-tip:not([hidden])){
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 4px 8px;
}
:where(.rp-overlay-tip[data-close="true"]){ grid-template-columns: minmax(0, 1fr) auto; }
:where(.rp-overlay-tip[data-side="top"]){ left: var(--rp-target-center-x); top: calc(var(--rp-target-top) - var(--rp-tip-offset)); transform: translate(-50%, -100%); }
:where(.rp-overlay-tip[data-side="bottom"]){ left: var(--rp-target-center-x); top: calc(var(--rp-target-bottom) + var(--rp-tip-offset)); transform: translate(-50%, 0); }
:where(.rp-overlay-tip[data-side="left"]){ left: calc(var(--rp-target-left) - var(--rp-tip-offset)); top: var(--rp-target-center-y); transform: translate(-100%, -50%); }
:where(.rp-overlay-tip[data-side="right"]){ left: calc(var(--rp-target-right) + var(--rp-tip-offset)); top: var(--rp-target-center-y); transform: translate(0, -50%); }
:where(.rp-overlay-tip[data-side="top"][data-align="start"]){ left: calc(var(--rp-target-left) - var(--rp-highlight-inset)); transform: translate(0, -100%); }
:where(.rp-overlay-tip[data-side="top"][data-align="end"]){ left: calc(var(--rp-target-right) + var(--rp-highlight-inset)); transform: translate(-100%, -100%); }
:where(.rp-overlay-tip[data-side="bottom"][data-align="start"]){ left: calc(var(--rp-target-left) - var(--rp-highlight-inset)); transform: translate(0, 0); }
:where(.rp-overlay-tip[data-side="bottom"][data-align="end"]){ left: calc(var(--rp-target-right) + var(--rp-highlight-inset)); transform: translate(-100%, 0); }
:where(.rp-overlay-tip[data-side="left"][data-align="start"]){ top: calc(var(--rp-target-top) - var(--rp-highlight-inset)); transform: translate(-100%, 0); }
:where(.rp-overlay-tip[data-side="left"][data-align="end"]){ top: calc(var(--rp-target-bottom) + var(--rp-highlight-inset)); transform: translate(-100%, -100%); }
:where(.rp-overlay-tip[data-side="right"][data-align="start"]){ top: calc(var(--rp-target-top) - var(--rp-highlight-inset)); transform: translate(0, 0); }
:where(.rp-overlay-tip[data-side="right"][data-align="end"]){ top: calc(var(--rp-target-bottom) + var(--rp-highlight-inset)); transform: translate(0, -100%); }
:where(.rp-overlay-message){ grid-column: 1; grid-row: 1; margin: 0; min-width: 0; overflow-wrap: anywhere; }
:where(.rp-overlay-tip[data-close="false"] .rp-overlay-message){ grid-column: 1 / -1; }
:where(.rp-overlay-actions){ grid-column: 1 / -1; grid-row: 2; gap: 8px; justify-content: flex-end; align-items: center; }
:where(.rp-overlay-actions:not([hidden])){ display: flex; }
/*
 * Host resets commonly target bare button/input elements with font, line-height and margin.
 * These descendant selectors keep the built-in controls' box and glyph geometry intact while
 * colour and radius still follow the --rp-* variables above.
 */
.rp-overlay-tip .rp-overlay-button,
.rp-overlay-tip .rp-overlay-close{
  margin: 0;
  font-family: inherit;
  cursor: pointer;
}
.rp-overlay-tip .rp-overlay-button{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background: transparent;
  padding: 2px 10px;
  font-size: 14px;
  line-height: 20px;
  color: inherit;
}
.rp-overlay-tip .rp-overlay-close{
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: inherit;
}
.rp-overlay-tip .rp-overlay-button:focus-visible,
.rp-overlay-tip .rp-overlay-close:focus-visible{
  outline: 2px solid var(--rp-accent, #3b82f6);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  :where(.rp-overlay-highlight) { transition: none; }
}
`.trim();
