---
title: "Overlay entry"
outline: [2, 3]
---

# Overlay entry

`@jangts/router-plus/overlay` is the browser-only entry for the DOM target runtime, default overlay, raw history bridge and styles. Constructing Core alone adds no UI.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`createDomRuntime`](#api-createdomruntime) | function | Create the DOM target runtime. |
| [`DomRuntimeOptions`](#api-domruntimeoptions) | interface | DOM runtime options. |
| [`installDomRuntime`](#api-installdomruntime) | function | Install DOM target capabilities without the default overlay. |
| [`mountOverlay`](#api-mountoverlay) | function | Install the default overlay renderer and DOM runtime. |
| [`MountOverlayOptions`](#api-mountoverlayoptions) | interface | Overlay mount options: root, interaction and runtime installation. |
| [`installHistoryBridge`](#api-installhistorybridge) | function | Install the raw history observation bridge. |
| [`overlayStyles`](#api-overlaystyles) | constant | Default overlay style text; shares one source with the `overlay.css` export. |
| [`OverlayTheme`](#api-overlaytheme) | interface | App-owned overlay stacking, mask and built-in component appearance. |
| [`OverlayZIndexRange`](#api-overlayzindexrange) | interface | Inclusive min/max bounds on the default stacking level. |
| [`HighlightComponentProps`](#api-highlightcomponentprops) | interface | Shared width, height, left, top and context contract for default/custom highlights. |
| [`HighlightComponentContext`](#api-highlightcomponentcontext) | interface | Target bounds, page/highlight/tour state, overlayRoot and next(step = 1). |
| [`HighlightRectangle`](#api-highlightrectangle) | interface | Measured pixel dimensions and viewport position. |
| [`DefaultHighlightComponentProps`](#api-defaulthighlightcomponentprops) | interface | Shared component props plus optional built-in styles. |
| [`DefaultHighlightStyles`](#api-defaulthighlightstyles) | type alias | Built-in highlight/bubble styles, excluding shared stacking policy. |
| [`OverlayAppearanceOptions`](#api-overlayappearanceoptions) | interface | Live appearance, interaction and highlight registration options. |
| [`OverlayMount`](#api-overlaymount) | interface | Callable cleanup handle with update for replacing presentation options. |
| [`DEFAULT_OVERLAY_Z_INDEX`](#api-default_overlay_z_index) | constant | High default stacking level 10000, constrained by App values or bounds. |
| [`OverlayHighlightRenderer`](#api-overlayhighlightrenderer) | interface | Content mount/render/destroy port; Plus owns measured geometry. |
| [`createDefaultHighlightRenderer`](#api-createdefaulthighlightrenderer) | function | Create the built-in highlight using shared props and extra styles. |
| [`DefaultHighlightRenderer`](#api-defaulthighlightrenderer) | interface | Built-in component renderer and its default bubble node. |

## createDomRuntime {#api-createdomruntime}

Create the DOM target runtime.

**Import:** `@jangts/router-plus/overlay`。

### Definition

#### Call

```ts
createDomRuntime(options?: DomRuntimeOptions): TargetRuntime
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `DomRuntimeOptions` | Optional | — |

**Returns:** `TargetRuntime`

## DomRuntimeOptions {#api-domruntimeoptions}

DOM runtime options.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface DomRuntimeOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `root` | `Element \| Document \| ShadowRoot \| undefined` | Optional | Root that limits DOM target resolution. |

## installDomRuntime {#api-installdomruntime}

Install DOM target capabilities without the default overlay.

**Import:** `@jangts/router-plus/overlay`。

### Definition

#### Call

```ts
installDomRuntime(plus: RouterPlus, options?: DomRuntimeOptions): () => void
```

Install the DOM target runtime on an instance. Repeated installation is reference counted and
shares one runtime.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `options` | `DomRuntimeOptions` | Optional | — |

**Returns:** `() => void`

## mountOverlay {#api-mountoverlay}

Install the default overlay renderer and DOM runtime.

**Import:** `@jangts/router-plus/overlay`。

### Definition

#### Call

```ts
mountOverlay(plus: RouterPlus, options?: MountOverlayOptions): OverlayMount
```

Mount the neutral default overlay. Repeated mounts share one renderer.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `options` | `MountOverlayOptions` | Optional | — |

**Returns:** `OverlayMount`

## MountOverlayOptions {#api-mountoverlayoptions}

Overlay mount options: root, interaction and runtime installation.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface MountOverlayOptions extends OverlayAppearanceOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `root` | `Element \| Document \| ShadowRoot \| undefined` | Optional | Root for the overlay; the document body is used when omitted. |
| `installRuntime` | `boolean \| undefined` | Optional | Install the DOM runtime together with the overlay; defaults to true. |
| `injectStyles` | `boolean \| undefined` | Optional | Set false when importing overlay.css or providing the complete stylesheet yourself. |
| `interactive` | `boolean \| undefined` | Optional | Allow interaction with highlighted content. |
| `className` | `string \| undefined` | Optional | Persistent App class, retained when per-highlight classes change. |
| `theme` | `OverlayTheme \| undefined` | Optional | See the type definition. |
| `highlightRenderer` | `OverlayHighlightRenderer \| undefined` | Optional | Render only the highlight content inside a Plus-positioned box, preserving the overlay. |

## installHistoryBridge {#api-installhistorybridge}

Install the raw history observation bridge.

**Import:** `@jangts/router-plus/overlay`。

### Definition

#### Call

```ts
installHistoryBridge(plus: RouterPlus, target?: WindowLike): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `target` | `WindowLike \| undefined` | Optional | — |

**Returns:** `() => void`

## overlayStyles {#api-overlaystyles}

Default overlay style text; shares one source with the `overlay.css` export.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
const overlayStyles: string
```

## OverlayTheme {#api-overlaytheme}

App-owned overlay stacking, mask and built-in component appearance.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface OverlayTheme
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `zIndex` | `string \| number \| OverlayZIndexRange \| undefined` | Optional | A fixed CSS value, or inclusive bounds applied to the high renderer default. |
| `maskColor` | `string \| undefined` | Optional | See the type definition. |
| `maskRadius` | `string \| number \| undefined` | Optional | Shared spotlight cutout radius, independent of custom highlight content. |
| `surfaceColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `textColor` | `string \| undefined` | Optional | See the type definition. |
| `radius` | `string \| number \| undefined` | Optional | See the type definition. |
| `shadow` | `string \| undefined` | Optional | See the type definition. |
| `accentColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightRadius` | `string \| number \| undefined` | Optional | See the type definition. |
| `highlightBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `highlightPadding` | `string \| number \| undefined` | Optional | CSS length; a number is interpreted as pixels. Used by highlights and tours. |
| `tipGap` | `string \| number \| undefined` | Optional | See the type definition. |

## OverlayZIndexRange {#api-overlayzindexrange}

Inclusive min/max bounds on the default stacking level.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface OverlayZIndexRange
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `min` | `number \| undefined` | Optional | See the type definition. |
| `max` | `number \| undefined` | Optional | See the type definition. |

## HighlightComponentProps {#api-highlightcomponentprops}

Shared width, height, left, top and context contract for default/custom highlights.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface HighlightComponentProps extends HighlightRectangle
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `context` | `HighlightComponentContext` | Required | See the type definition. |
| `width` | `number` | Required | See the type definition. |
| `height` | `number` | Required | See the type definition. |
| `left` | `number` | Required | See the type definition. |
| `top` | `number` | Required | See the type definition. |

## HighlightComponentContext {#api-highlightcomponentcontext}

Target bounds, page/highlight/tour state, overlayRoot and next(step = 1).

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface HighlightComponentContext
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `overlayRoot` | `HTMLElement` | Required | Shared overlay root for App-owned portals that must retain the same stacking context. |
| `targetRect` | `HighlightRectangle` | Required | See the type definition. |
| `highlight` | `HighlightState` | Required | See the type definition. |
| `page` | `PageContext` | Required | See the type definition. |
| `tour` | `TourState \| null` | Required | See the type definition. |
| `next` | `(step?: number) => Promise<CommandResult>` | Required | Relative tour movement: positive forward, negative backward, zero leaves the step unchanged. |

## HighlightRectangle {#api-highlightrectangle}

Measured pixel dimensions and viewport position.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface HighlightRectangle
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `width` | `number` | Required | See the type definition. |
| `height` | `number` | Required | See the type definition. |
| `left` | `number` | Required | See the type definition. |
| `top` | `number` | Required | See the type definition. |

## DefaultHighlightComponentProps {#api-defaulthighlightcomponentprops}

Shared component props plus optional built-in styles.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface DefaultHighlightComponentProps extends HighlightComponentProps
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `styles` | `DefaultHighlightStyles \| undefined` | Optional | See the type definition. |
| `context` | `HighlightComponentContext` | Required | See the type definition. |
| `width` | `number` | Required | See the type definition. |
| `height` | `number` | Required | See the type definition. |
| `left` | `number` | Required | See the type definition. |
| `top` | `number` | Required | See the type definition. |

## DefaultHighlightStyles {#api-defaulthighlightstyles}

Built-in highlight/bubble styles, excluding shared stacking policy.

**Import:** `@jangts/router-plus/overlay`。

### Definition

**Type alias:** `DefaultHighlightStyles`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `surfaceColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `textColor` | `string \| undefined` | Optional | See the type definition. |
| `radius` | `string \| number \| undefined` | Optional | See the type definition. |
| `shadow` | `string \| undefined` | Optional | See the type definition. |
| `accentColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightRadius` | `string \| number \| undefined` | Optional | See the type definition. |
| `highlightBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `tipGap` | `string \| number \| undefined` | Optional | See the type definition. |

## OverlayAppearanceOptions {#api-overlayappearanceoptions}

Live appearance, interaction and highlight registration options.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface OverlayAppearanceOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `interactive` | `boolean \| undefined` | Optional | See the type definition. |
| `className` | `string \| undefined` | Optional | Persistent App class, retained when per-highlight classes change. |
| `theme` | `OverlayTheme \| undefined` | Optional | See the type definition. |
| `highlightRenderer` | `OverlayHighlightRenderer \| undefined` | Optional | Render only the highlight content inside a Plus-positioned box, preserving the overlay. |

## OverlayMount {#api-overlaymount}

Callable cleanup handle with update for replacing presentation options.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface OverlayMount
```

#### Call

```ts
OverlayMount(): void
```

No call parameters.

**Returns:** `void`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `update` | `(options: OverlayAppearanceOptions) => void` | Required | See the type definition. |

## DEFAULT_OVERLAY_Z_INDEX {#api-default_overlay_z_index}

High default stacking level 10000, constrained by App values or bounds.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
const DEFAULT_OVERLAY_Z_INDEX: 10000
```

## OverlayHighlightRenderer {#api-overlayhighlightrenderer}

Content mount/render/destroy port; Plus owns measured geometry.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface OverlayHighlightRenderer
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `mount` | `(host: HTMLElement) => void` | Required | See the type definition. |
| `render` | `(props: HighlightComponentProps \| null) => void` | Required | See the type definition. |
| `destroy` | `() => void` | Required | See the type definition. |

## createDefaultHighlightRenderer {#api-createdefaulthighlightrenderer}

Create the built-in highlight using shared props and extra styles.

**Import:** `@jangts/router-plus/overlay`。

### Definition

#### Call

```ts
createDefaultHighlightRenderer(): DefaultHighlightRenderer
```

The default component owns its rectangular bubble and uses context.next for every tour button.

No call parameters.

**Returns:** `DefaultHighlightRenderer`

## DefaultHighlightRenderer {#api-defaulthighlightrenderer}

Built-in component renderer and its default bubble node.

**Import:** `@jangts/router-plus/overlay`。

### Definition

```ts
interface DefaultHighlightRenderer extends OverlayHighlightRenderer
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `render` | `(props: DefaultHighlightComponentProps \| null) => void` | Required | See the type definition. |
| `bubble` | `HTMLElement` | Required | See the type definition. |
| `mount` | `(host: HTMLElement) => void` | Required | See the type definition. |
| `destroy` | `() => void` | Required | See the type definition. |

## Examples

```tsx
import { RouterPlusOverlay } from '@jangts/router-plus/react';

<RouterPlusOverlay theme={{ zIndex: { max: 59 }, highlightPadding: 4 }} />
```

Then use explicit targets:

```ts
await plus.highlight({ selector: '#controls' }, { message: 'Controls', spotlight: true });
await plus.clearHighlight();

await plus.startTour([
  { target: { selector: '#controls' }, message: 'Choose an option' },
  { target: { selector: '#content' }, message: 'Inspect the result' },
]);
```

Install only DOM capabilities without the default overlay:

```ts
import { installDomRuntime } from '@jangts/router-plus/overlay';

const stop = installDomRuntime(plus, { root: document.getElementById('app') ?? undefined });
```

Runtime-injected styles and `@jangts/router-plus/overlay.css` share one source; use either. See [highlights and tours](../guide/interactions) for custom components, shared props, bubble placements and signed movement.
