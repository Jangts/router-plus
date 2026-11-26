# State, SSR and interactions

## Native state ownership

Use the native hooks, existing-source hooks and store creation/registration functions described in [Native state bindings](state-bindings.md). Native state remains the only live source; Router Plus holds accessors and navigation snapshots. Hook registration is optional and cleaned up with its component/effect scope. Vue Options API calls the same composables inside `setup()`.

## SSR and hydration

Create one Router Plus instance and one set of stores per server request. Registered sources expose their current native values; query-bound navigation snapshots travel in `snapshot().location`. Supply the same native initial values on server and client. `whenReady()` waits for registered source restoration; React setters still require their normal render/commit. Native application state and non-JSON values follow the application's SSR serialization policy. The core imports no DOM or framework globals.

## Targets and interactions

Install `installDomRuntime(plus, { root? })` independently, or mount the default overlay with `mountOverlay`. Runtime installations share a reference count; each returned cleanup releases its own reference once. An older cleanup cannot detach a newer installation. React/Vue Overlay components provide lifecycle bindings. Default overlay CSS can be imported from `@jangts/router-plus/overlay.css`; runtime-injected styles and the CSS file are generated from one source.

Targets may be ids, explicit selectors, element getters, named resolver inputs or rectangular anchors. Registered ids are scoped by instance. DOM marker lookup is constrained to the active host root, falling back to the runtime root. String ids are not interpreted as selectors. Custom resolvers receive context and cancellation; they may prepare asynchronous targets during execution.

Highlighter clear, committed navigation, scope release and disposal invalidate pending resolution. Superseded resolver failures, asynchronous scrolling and tour callbacks return cancelled receipts after they settle; cancellation does not undo native side effects already issued. Direct interaction methods reject work after disposal. A blocked navigation preserves interactions. Same-instance query/hash/Tab updates preserve them by default. Explicit highlights replace tours. Duration, placement, spotlight, dismissible, interactive and className control the default presentation.

Tours support manual/click progression, beforeStep/afterStep, keyboard control, dismissal and finish/cancel callbacks. Superseded asynchronous steps cannot overwrite a newer step. The default renderer observes target resizing, window/viewport scrolling and viewport resizing. Focus supports restoration on interaction cleanup/navigation. Scrolling supports explicit containers, offsets and reduced motion; custom ScrollStrategy implementations can handle non-native scrolling.

Shadow roots can be passed as roots. Same-origin iframe work should install a runtime in that document or explicitly supply coordinate conversion; cross-origin targets require a caller-owned message bridge. A rectangular anchor can highlight a canvas region; focusing an anchor without a focusable element is rejected. Default visual layout is separate from command/state correctness and is subject to caller acceptance.

## App-owned overlay layer and appearance

The default overlay uses a high stacking level of `10000` so it can cover ordinary page content without App configuration. Apps choose its place among page content, navigation, dialogs, notifications and other overlays. A higher App stacking context can remain above the entire guide. The optional `root` selects the mount container (Document body, ShadowRoot or Element); ancestor stacking contexts still apply. Plus does not raise the target element, move App elements or use the browser top layer.

React and Vue `RouterPlusOverlay` accept the same `theme`, `className`, `interactive`, `root`, `installRuntime` and `injectStyles` options as the DOM mount, and register native highlight visuals through `highlightComponent`. `OverlayTheme` is exported from `/overlay`, `/react` and `/vue`. React prop changes and Vue reactive changes update appearance without replacing the renderer, DOM runtime or active highlight.

```tsx
<RouterPlusOverlay
  className="app-guide"
  theme={{
    zIndex: 50,
    maskColor: 'rgba(15, 23, 42, 0.25)',
    highlightRadius: 4,
    highlightBorderColor: 'var(--app-accent)',
    highlightBorderWidth: 1,
    highlightPadding: 0,
    radius: 8,
    surfaceColor: 'var(--app-surface)',
    textColor: 'var(--app-text)',
  }}
/>
```

In Vue use `<RouterPlusOverlay :theme="guideTheme" class-name="app-guide" />`. Without a framework:

```ts
const unmount = mountOverlay(plus, { theme: { zIndex: 50, highlightPadding: 0 } });
unmount.update({ theme: { zIndex: 45, highlightPadding: 2 } });
unmount();
```

`update()` replaces the appearance options; omitted theme keys relinquish their overrides. Repeated mounts share one renderer; the first mount chooses the container and stylesheet/runtime installation. Each live mount handle can update shared appearance, and each cleanup releases only its own reference.

| Theme field | CSS variable | Fallback |
| --- | --- | --- |
| `zIndex` | `--rp-z-index`, `--rp-z-index-min`, `--rp-z-index-max` | `10000` |
| `maskColor` | `--rp-mask` | `rgba(0, 0, 0, 0.42)` |
| `maskRadius` | `--rp-mask-radius` | Default highlight radius; `0px` with custom content |
| `highlightRadius` | `--rp-highlight-radius` | `--rp-radius`, then `10px` |
| `highlightBorderColor` | `--rp-highlight-border-color` | `--rp-accent`, then `#3b82f6` |
| `highlightBorderWidth` | `--rp-highlight-border-width` | `2px` |
| `highlightPadding` | `--rp-highlight-padding` | `6px` |
| `radius` | `--rp-radius` | `10px` |
| `tipBorderColor` | `--rp-tip-border-color` | `transparent` |
| `tipBorderWidth` | `--rp-tip-border-width` | `0px` |
| `surfaceColor` | `--rp-surface` | `#ffffff` |
| `textColor` | `--rp-text` | `#1f2329` |
| `shadow` | `--rp-shadow` | `0 12px 32px rgba(0, 0, 0, 0.18)` |
| `accentColor` | `--rp-accent` | `#3b82f6` |
| `tipGap` | `--rp-tip-gap` | `12px` |

`zIndex` accepts a fixed number/CSS value or inclusive bounds on the default:

```ts
{ zIndex: 900 }                    // Exact value
{ zIndex: { max: 59 } }            // Reserve 60 and above for App UI
{ zIndex: { min: 12000 } }         // Raise the default to at least 12000
{ zIndex: { min: 30, max: 59 } }   // Keep it within the App's range
```

Omitted bounds are unrestricted within the browser's integer range. Range numbers must be finite safe integers, with `min <= max`; invalid updates are rejected without altering current appearance. Explicit 0 is valid. CSS uses `clamp(--rp-z-index-min, 10000, --rp-z-index-max)` with integer-bound fallbacks; `--rp-z-index` is a fixed override that bypasses those bounds. CSS variable changes remain reactive without JavaScript measurements or dynamic layer escalation.

Length numbers are pixels; strings accept CSS lengths, `var()` and `calc()`. `zIndex` numbers remain unitless. Explicit zero values are preserved. `highlightPadding` controls the expansion of the target rectangle for both highlights and tours; a single `highlight(..., { padding })` overrides it for that highlight, then releases the override on the next highlight without explicit padding. The default highlight border is drawn inside the expanded rectangle. Radius, width, padding and mask are presentation settings, separate from target measurement.

Default selectors use zero specificity (`:where(...)`), with variable fallbacks at the consuming declarations. They do not declare defaults on the root that would block inherited App variables. Ordinary App selectors can override visual properties even if the default stylesheet is injected later:

```css
:root {
  --rp-z-index: 50;
  --rp-mask: rgba(15, 23, 42, 0.25);
  --rp-highlight-padding: 0px;
}
.app-guide .rp-overlay-spotlight {
  border-radius: 4px;
  border-color: var(--app-accent);
  border-width: 1px;
}
```

Theme options set inline CSS variables, so explicitly supplied theme values take precedence over inherited variables or App declarations of those same variables. Direct App declarations such as `border-color` remain overridable through the ordinary cascade. Per-highlight `className` is added alongside the persistent mount `className`. Geometry writes contain measured target coordinates and an optional explicit command padding, never a forced z-index or appearance property. Set `injectStyles: false` when importing `overlay.css` yourself or replacing the stylesheet completely. App styles in a ShadowRoot must be available in that root; scoped component CSS needs a selector that reaches the mounted overlay.

The guide ignores keyboard events already handled with `preventDefault()` by the App, and handles no keys while there is no active highlight. Native top-layer elements and ancestor stacking contexts continue to follow browser rules.

## App-registered highlight components

An App can replace only the highlight visual while retaining Plus-owned geometry, mask, keyboard behavior and overlay stacking. Its own bubble, message presentation and controls are also App-owned; the default bubble is hidden and is not positioned or measured in custom mode:

```tsx
import { RouterPlusOverlay, type HighlightComponentProps } from '@jangts/router-plus/react';

function AppHighlight({ width, height, context }: HighlightComponentProps) {
  return <div
    aria-label={context.highlight.message}
    style={{ width, height, border: '2px solid currentColor', borderRadius: 12 }}
  />;
}

<RouterPlusOverlay highlightComponent={AppHighlight} theme={{ zIndex: { max: 59 } }} />
```

The component contract has five top-level props, all with complete names:

| Prop | Meaning |
| --- | --- |
| `width`, `height` | Measured outer highlight-box dimensions in pixels, including configured padding |
| `left`, `top` | Measured outer highlight-box position in viewport coordinates |
| `context` | Typed interaction and page details described below |

Plus positions an outer host and updates it for target resizing, host size changes, scrolling and viewport changes. Default highlight motion transitions do not apply to custom content. App content renders inside that box; use width/height for drawing or fill the parent with `100%`. Do not apply viewport left/top again to the inner component. `context.targetRect` contains the unexpanded target rectangle; `context.highlight` contains the target, message and highlight options; `context.page` is the current page context; `context.tour` contains current tour state or null; `context.next(step = 1)` is the tour movement action (positive forward, negative backward); `context.overlayRoot` is the shared overlay root for App-owned portals that must remain in the same stacking context. These are named, typed contracts, not arbitrary metadata. Types `HighlightComponentProps`, `HighlightComponentContext` and `HighlightRectangle` are available from the framework and overlay entries.

Vue uses the same prop contract and preserves App injections through Teleport:

```vue
<!-- AppHighlight.vue -->
<script setup lang="ts">
import type { HighlightComponentProps } from '@jangts/router-plus/vue';
defineProps<HighlightComponentProps>();
</script>

<template>
  <div class="app-highlight" :style="{ width: `${width}px`, height: `${height}px` }" />
</template>
```

Register it with `<RouterPlusOverlay :highlight-component="AppHighlight" />`. React uses a Portal so App providers and native router context remain available. Components mount while a highlight or tour step is active, unmount when it is cleared, and can be replaced without recreating the overlay or DOM runtime. Removing the registered component restores the default highlight.

Framework-free integrations pass `highlightRenderer` to `mountOverlay`. `OverlayHighlightRenderer` implements `mount(host)`, `render(propsOrNull)` and `destroy()`. Its render input is the same five-field contract; null means inactive. Mount failure cleans up the attempted host. This content-only renderer differs from the Core `HighlightRenderer`, which replaces the full overlay and receives raw highlight state.

Custom content is not assigned `.rp-overlay-spotlight`; default highlight border/radius CSS and theme fields do not decorate it. App styles own the content. Geometry (`highlightPadding`) and shared overlay settings (stacking and mask) remain Plus-controlled. For a custom spotlight, the shared cutout is rectangular unless the App supplies `theme.maskRadius` / `--rp-mask-radius`; this affects the mask opening, not the custom component's appearance. A custom component is shown for active highlights and tour steps even without `spotlight: true`; that option controls the spotlight mask. Custom hosts pass pointer events through; App-owned interactive bubbles/buttons can opt into `pointer-events: auto`. Ordinary CSS inheritance and intentionally broad App selectors still follow browser rules.

## Default bubble placement and basic style

`highlight(target, { placement })` and each `TourStep.placement` use the same placement catalog. The bubble remains a rectangular card without an arrow or pointed corner.

| Placement | Position |
| --- | --- |
| `top`, `bottom`, `left`, `right` | 上、下、左、右；centered on that side |
| `left-top`, `right-top` | 左上、右上；beside the target, top edges aligned |
| `left-bottom`, `right-bottom` | 左下、右下；beside the target, bottom edges aligned |
| `top-left`, `top-right` | 上左、上右；above the target, left/right edges aligned |
| `bottom-left`, `bottom-right` | 下左、下右；below the target, left/right edges aligned |
| `top-auto`, `bottom-auto`, `left-auto`, `right-auto` | 指定方向的可见区自动；prefer that side, fit the visible viewport |
| `auto` | Fully automatic, defaulting to bottom preference |
| `none` | 无；hide only the bubble, retaining highlight, mask and tour state |

For example, `left-top` puts the bubble on the left with top edges aligned; `top-left` puts it above with left edges aligned. Fixed placements prefer their requested side and alignment; when that side cannot hold the bubble but the opposite side can, they flip to the opposite side. Viewport-aware placements prefer the requested side, then its opposite, then another fitting side; if no side fits, choose the most available space. Every placement is clamped within the visible viewport, with a 16px gutter, and bubbles size to their content up to the viewport limit. `tipGap` is measured from the visible highlight edge, so per-highlight or theme padding does not shrink the perceived gap. The measurements account for the bubble's actual content size and VisualViewport offsets. Very long content scrolls within the bubble's viewport-constrained height. `data-placement` records the requested mode, while `data-side` and `data-align` record the rendered anchor.

```ts
await plus.highlight(target, { placement: 'top-left', message: 'Above, aligned left' });
await plus.highlight(target, { placement: 'right-auto', message: 'Prefer visible space on the right' });
await plus.highlight(target, { placement: 'none' });
```

Basic bubble appearance uses existing `surfaceColor`, `textColor`, `radius` and optional `shadow`, plus `tipBorderColor` and `tipBorderWidth`. CSS equivalents are `--rp-surface`, `--rp-text`, `--rp-radius`, `--rp-shadow`, `--rp-tip-border-color` and `--rp-tip-border-width`. The default border width is 0; `tipGap` controls distance from the target. These fields and all default bubble placements apply only when using the default component. Custom components own their bubbles and controls, and Plus neither styles nor positions those bubbles.

## Shared default/custom component contract and tour movement

The built-in component consumes `DefaultHighlightComponentProps`, which extends the same five-field `HighlightComponentProps` contract with optional `styles: DefaultHighlightStyles`. Its implementation is available as `createDefaultHighlightRenderer()` from `/overlay`. There is one geometry/context path for both built-in and App renderers. Built-in style parameters affect its own highlight and bubble; custom components are never passed those style parameters.

For an ordinary dismissible highlight, the default bubble places an accessible × control to the right of the message, vertically centered in the same row. The message uses a neutral container independent of host paragraph styles. Default vertical padding is 8px; tours separate message/actions by 4px. Hidden actions do not participate in layout.

For the default component only, tour navigation appears inside the bubble as exactly two buttons: 上一步 and 下一步. The first step disables 上一步; 下一步 on the final step finishes the tour. The component adds no separate floating navigation or third completion button. This default UI convention places no requirements on custom components, which can interpret state and present any controls or none.

`context.next(step = 1)` is the single movement function supplied in component context and returns a command receipt. It moves relative to the active tour: positive values advance, negative values go back, and zero leaves state and hooks unchanged. Moving before the beginning clamps to the first step; moving beyond the end finishes. The step must be a finite safe integer. Skipped steps do not execute their step hooks. A retained context function can operate on the active tour, but after overlay disposal it returns cancellation. When no tour is active, movement also returns cancellation.

The typed Core method is `plus.nextTourStep(step = 1)` and the command form is `{ kind: 'tour.next', step }`. Existing `prevTourStep()` and `tour.prev` delegate to the same movement mechanism with -1. Default buttons call `context.next(-1)` and `context.next()`; custom components decide how and when to call it. `placement: 'none'` hides default navigation together with the default bubble, without finishing the tour.
