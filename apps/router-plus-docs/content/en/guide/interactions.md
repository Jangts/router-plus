# Highlights and tours

Highlights, guided tours, focus and scrolling share one target resolution and cancellation model. Constructing Core alone adds no UI; mount the overlay from a framework entry or install the DOM runtime directly.

## Mounting the overlay

React:

```tsx
import { RouterPlusOverlay } from '@jangts/router-plus/react';

<RouterPlusOverlay root={document.getElementById('app') ?? undefined} />
```

Vue:

```ts
import { RouterPlusOverlay } from '@jangts/router-plus/vue';

h(RouterPlusOverlay);
```

Unmounting clears the renderer and runtime. For DOM capabilities without the default UI:

```ts
import { installDomRuntime } from '@jangts/router-plus/overlay';

const stop = installDomRuntime(plus, { root: document.getElementById('app') ?? undefined });
```

Runtime-injected styles and `@jangts/router-plus/overlay.css` share one source; use either.

## Highlights

```ts
await plus.highlight(
  { selector: '#controls' },
  {
    message: 'Choose a filter here',
    placement: 'bottom',
    spotlight: true,
    scrollIntoView: true,
    dismissible: true,
    duration: 4000,
  },
);

await plus.clearHighlight();
```

Targets support:

- a selector object `{ selector }`;
- an element or element getter `{ element }`;
- a geometric anchor `{ rect, contextElement? }`;
- a registered id (string) or named resolver input `{ target, value }`.

String ids are never interpreted as CSS selectors, and registered ids are scoped per instance. Use `waitForTarget` and `timeout` for asynchronous targets; a missing target returns `target-not-found`.

Clearing a highlight, committing navigation, releasing a scope or disposing the instance invalidates pending resolution. A blocked navigation preserves interactions, and same-instance query/hash/tab updates keep them by default.

## Guided tours

```ts
await plus.startTour(
  [
    { target: { selector: '#controls' }, message: 'Choose an option', advanceOn: 'click' },
    { target: { selector: '#content' }, message: 'Inspect the result' },
  ],
  {
    keyboard: true,
    dismissible: true,
    beforeStep: async (index) => scrollToStep(index),
    onFinish: () => reportTourFinished(),
    onCancel: () => reportTourCancelled(),
  },
);
```

`advanceOn: 'click'` advances when the target is clicked; otherwise use `nextTourStep()` / `prevTourStep()` or the keyboard. `awaitUser` makes a step wait for confirmation. An explicit highlight replaces an active tour.

Superseded asynchronous work cannot overwrite a newer step. A throwing `beforeStep` / `afterStep` returns a failure receipt; the caller decides whether to stop or continue handling it.

## Focus and scrolling

```ts
await plus.focus({ selector: '#name' }, { preventScroll: true, restore: true });
await plus.scrollTo(
  { selector: '#items' },
  { behavior: 'smooth', block: 'center', offset: 16 },
);
```

- Focus can be restored on interaction cleanup or navigation.
- Scrolling supports explicit containers, offsets and reduced motion; non-native containers extend through `ScrollStrategy`.
- A geometric anchor can highlight a canvas region, but focusing requires a truly focusable element.

## Scope and roots

DOM marker lookup is constrained to the active host root and falls back to the runtime root. A shadow root can be used directly; same-origin iframes need a runtime in that document or explicit coordinate conversion, and cross-origin targets require the caller’s message bridge.

Default visual layout is separate from command/state correctness: position, size and styles can be adjusted to application acceptance without changing navigation or state contracts.

See [State access and command sequences](state-access) and [SSR and testing](state-ssr-and-testing) for state operations and environment isolation.

## App-owned stacking and appearance

The overlay defaults to a high level of 10000. Apps can choose a fixed value or bounds to reserve higher layers for navigation, dialogs and other UI.

```tsx
<RouterPlusOverlay theme={{
  zIndex: { max: 59 },
  highlightRadius: 4,
  highlightBorderWidth: 1,
  highlightBorderColor: 'var(--app-accent)',
  highlightPadding: 0,
  maskColor: 'rgba(0,0,0,.25)',
  surfaceColor: 'var(--app-surface)',
  textColor: 'var(--app-text)',
  tipBorderColor: 'var(--app-line)',
  tipBorderWidth: 1,
  radius: 8,
}} />
```

Use `zIndex: 58` for a fixed value, `{ min: 12000 }` for a lower bound, or `{ min: 30, max: 59 }` for both. Bounds are inclusive and explicit zero is preserved. Numeric lengths use pixels; strings can use CSS lengths, `var()` or `calc()`.

Vue accepts the same theme through `:theme="guideTheme"`; DOM consumers use `mountOverlay(plus, { theme })`. Its callable cleanup handle supports `update({ theme })` without reinstalling the runtime or active highlight. Default CSS uses zero specificity and variable fallbacks. App styles can override ordinary declarations or inherited variables; `injectStyles: false` delegates stylesheet installation to the App. Mount roots remain subject to ancestor stacking contexts.

## Registering App highlight content

```tsx
import { RouterPlusOverlay, type HighlightComponentProps } from '@jangts/router-plus/react';

function AppHighlight({ width, height, context }: HighlightComponentProps) {
  return <div aria-label={context.highlight.message}
    style={{ width, height, border: '2px solid currentColor', borderRadius: 12 }} />;
}

<RouterPlusOverlay highlightComponent={AppHighlight} />
```

The shared props are `width`, `height`, `left`, `top` and `context`. Measurements include padding and use viewport coordinates. Plus already positions the outer host; do not apply viewport left/top again inside it. Context provides raw `targetRect`, highlight/page/tour state, the shared `overlayRoot` and `next(step = 1)`.

Vue components can declare `defineProps<HighlightComponentProps>()` and register with `:highlight-component="AppHighlight"`. React Portal and Vue Teleport preserve App providers/injections. Apps own custom bubbles, controls, messages and styles. The default bubble is hidden and never positioned or measured in custom mode. Interactive custom controls opt into `pointer-events: auto`; App portals can target `context.overlayRoot` to retain its stacking context.

Default/custom components use the same contract, with extra `styles: DefaultHighlightStyles` only for the built-in component. Built-in borders, radius, bubble and font styling do not decorate custom content. The shared mask, geometry padding and overlay layer remain available; use `maskRadius` to match a custom mask opening. Removing registration restores the built-in component.

## Default bubble placement and controls

The default bubble is a rectangular card without an arrow. It exposes basic border color/width, background, text color and radius. Ordinary highlights place a compact × to the right of the message, vertically centered in the same row. Vertical padding is 8px; hidden actions occupy no space, and tours separate the message/actions by 4px. Tours always show exactly Previous/Next inside the bubble; Previous is disabled at the start and Next finishes at the end. These UI conventions do not restrict custom components.

| placement | Meaning |
| --- | --- |
| `top` / `bottom` / `left` / `right` | Centered on that side |
| `left-top` / `right-top` | Beside the target with top edges aligned |
| `left-bottom` / `right-bottom` | Beside the target with bottom edges aligned |
| `top-left` / `top-right` | Above, aligned to the left/right edge |
| `bottom-left` / `bottom-right` | Below, aligned to the left/right edge |
| `top-auto` / `bottom-auto` / `left-auto` / `right-auto` | Prefer that side, then fit the visible viewport |
| `auto` | Fully automatic, preferring the bottom |
| `none` | Hide the default bubble while retaining highlight/tour state |

Set placement on a highlight or each tour step. `left-top` and `top-left` represent different side/alignment combinations. Viewport-aware modes measure actual bubble size, try the preferred side, its opposite and other available sides, then clamp into view. Long content scrolls within the card.

## Shared relative movement

```ts
await context.next();    // Forward one
await context.next(-1);  // Backward one
await context.next(2);   // Forward two
await context.next(0);   // Keep the current step
```

Steps must be safe integers. Moving before the start clamps to the first step; moving past the end finishes. Skipped steps do not run their hooks. Core exposes `nextTourStep(step = 1)` and `{ kind: 'tour.next', step }`; `prevTourStep()` delegates with -1. Context movement returns cancellation when no tour is active or after overlay disposal. Custom components choose whether, when and how to invoke it.

For an explicit DOM scroll container, `block` and `inline` align within its inner viewport. `nearest` chooses the smallest edge movement and leaves fully visible targets in place; inline start/end honor RTL direction. An offset applies to vertical start alignment while horizontal alignment still follows inline.
