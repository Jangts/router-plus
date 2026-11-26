---
title: "覆盖层入口"
outline: [2, 3]
---

# 覆盖层入口

`@jangts/router-plus/overlay` 是浏览器专属入口，提供 DOM 目标运行时、默认覆盖层、原生历史桥与样式。只创建 Core 不会增加任何界面。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`createDomRuntime`](#api-createdomruntime) | 函数 | 创建 DOM 目标运行时。 |
| [`DomRuntimeOptions`](#api-domruntimeoptions) | 接口 | DOM 运行时选项。 |
| [`installDomRuntime`](#api-installdomruntime) | 函数 | 向实例安装 DOM 目标能力，不安装默认覆盖层。 |
| [`mountOverlay`](#api-mountoverlay) | 函数 | 安装默认覆盖层渲染器与 DOM 运行时。 |
| [`MountOverlayOptions`](#api-mountoverlayoptions) | 接口 | 覆盖层挂载选项：根节点、交互与是否安装运行时。 |
| [`installHistoryBridge`](#api-installhistorybridge) | 函数 | 安装原生历史观察桥。 |
| [`overlayStyles`](#api-overlaystyles) | 常量 | 默认覆盖层样式文本；与 `overlay.css` 导出同源。 |
| [`OverlayTheme`](#api-overlaytheme) | 接口 | App 控制的覆盖层层级、遮罩与默认组件外观。 |
| [`OverlayZIndexRange`](#api-overlayzindexrange) | 接口 | 默认层级的包含式 min／max 范围。 |
| [`HighlightComponentProps`](#api-highlightcomponentprops) | 接口 | 默认与自定义高亮共用的 width、height、left、top、context 五参数合同。 |
| [`HighlightComponentContext`](#api-highlightcomponentcontext) | 接口 | 目标矩形、页面／高亮／导览状态、overlayRoot 与 next(step = 1)。 |
| [`HighlightRectangle`](#api-highlightrectangle) | 接口 | 测量后的宽高及视口坐标，单位为像素。 |
| [`DefaultHighlightComponentProps`](#api-defaulthighlightcomponentprops) | 接口 | 内置组件参数，在通用五参数之外接收 styles。 |
| [`DefaultHighlightStyles`](#api-defaulthighlightstyles) | 类型别名 | 仅用于内置高亮和气泡的样式参数，不包含公共层级策略。 |
| [`OverlayAppearanceOptions`](#api-overlayappearanceoptions) | 接口 | 实时可更新的外观、交互与高亮组件注册。 |
| [`OverlayMount`](#api-overlaymount) | 接口 | 可调用的清理句柄，通过 update 替换展示配置。 |
| [`DEFAULT_OVERLAY_Z_INDEX`](#api-default_overlay_z_index) | 常量 | 覆盖层默认高层级 10000，由 App 固定值或范围约束。 |
| [`OverlayHighlightRenderer`](#api-overlayhighlightrenderer) | 接口 | 只绘制高亮内容的挂载／更新／清理接口，宽高位置由 Plus 控制。 |
| [`createDefaultHighlightRenderer`](#api-createdefaulthighlightrenderer) | 函数 | 创建接收统一参数和额外样式的默认高亮组件实现。 |
| [`DefaultHighlightRenderer`](#api-defaulthighlightrenderer) | 接口 | 内置高亮组件渲染接口及其默认气泡节点。 |

## createDomRuntime {#api-createdomruntime}

创建 DOM 目标运行时。

**导入：** `@jangts/router-plus/overlay`。

### 定义

#### 调用

```ts
createDomRuntime(options?: DomRuntimeOptions): TargetRuntime
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `DomRuntimeOptions` | 可省略 | — |

**返回：** `TargetRuntime`

## DomRuntimeOptions {#api-domruntimeoptions}

DOM 运行时选项。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface DomRuntimeOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `root` | `Element \| Document \| ShadowRoot \| undefined` | 可省略 | 限制 DOM 目标解析范围的根节点。 |

## installDomRuntime {#api-installdomruntime}

向实例安装 DOM 目标能力，不安装默认覆盖层。

**导入：** `@jangts/router-plus/overlay`。

### 定义

#### 调用

```ts
installDomRuntime(plus: RouterPlus, options?: DomRuntimeOptions): () => void
```

Install the DOM target runtime on an instance. Repeated installation is reference counted and
shares one runtime.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `options` | `DomRuntimeOptions` | 可省略 | — |

**返回：** `() => void`

## mountOverlay {#api-mountoverlay}

安装默认覆盖层渲染器与 DOM 运行时。

**导入：** `@jangts/router-plus/overlay`。

### 定义

#### 调用

```ts
mountOverlay(plus: RouterPlus, options?: MountOverlayOptions): OverlayMount
```

Mount the neutral default overlay. Repeated mounts share one renderer.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `options` | `MountOverlayOptions` | 可省略 | — |

**返回：** `OverlayMount`

## MountOverlayOptions {#api-mountoverlayoptions}

覆盖层挂载选项：根节点、交互与是否安装运行时。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface MountOverlayOptions extends OverlayAppearanceOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `root` | `Element \| Document \| ShadowRoot \| undefined` | 可省略 | 覆盖层挂载的根节点；省略时使用文档 body。 |
| `installRuntime` | `boolean \| undefined` | 可省略 | Install the DOM runtime together with the overlay; defaults to true. |
| `injectStyles` | `boolean \| undefined` | 可省略 | Set false when importing overlay.css or providing the complete stylesheet yourself. |
| `interactive` | `boolean \| undefined` | 可省略 | 允许与高亮内容交互。 |
| `className` | `string \| undefined` | 可省略 | Persistent App class, retained when per-highlight classes change. |
| `theme` | `OverlayTheme \| undefined` | 可省略 | 见类型定义。 |
| `highlightRenderer` | `OverlayHighlightRenderer \| undefined` | 可省略 | Render only the highlight content inside a Plus-positioned box, preserving the overlay. |

## installHistoryBridge {#api-installhistorybridge}

安装原生历史观察桥。

**导入：** `@jangts/router-plus/overlay`。

### 定义

#### 调用

```ts
installHistoryBridge(plus: RouterPlus, target?: WindowLike): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `target` | `WindowLike \| undefined` | 可省略 | — |

**返回：** `() => void`

## overlayStyles {#api-overlaystyles}

默认覆盖层样式文本；与 `overlay.css` 导出同源。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
const overlayStyles: string
```

## OverlayTheme {#api-overlaytheme}

App 控制的覆盖层层级、遮罩与默认组件外观。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface OverlayTheme
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `zIndex` | `string \| number \| OverlayZIndexRange \| undefined` | 可省略 | A fixed CSS value, or inclusive bounds applied to the high renderer default. |
| `maskColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `maskRadius` | `string \| number \| undefined` | 可省略 | Shared spotlight cutout radius, independent of custom highlight content. |
| `surfaceColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `tipBorderColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `tipBorderWidth` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `textColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `radius` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `shadow` | `string \| undefined` | 可省略 | 见类型定义。 |
| `accentColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `highlightRadius` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `highlightBorderColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `highlightBorderWidth` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `highlightPadding` | `string \| number \| undefined` | 可省略 | CSS length; a number is interpreted as pixels. Used by highlights and tours. |
| `tipGap` | `string \| number \| undefined` | 可省略 | 见类型定义。 |

## OverlayZIndexRange {#api-overlayzindexrange}

默认层级的包含式 min／max 范围。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface OverlayZIndexRange
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `min` | `number \| undefined` | 可省略 | 见类型定义。 |
| `max` | `number \| undefined` | 可省略 | 见类型定义。 |

## HighlightComponentProps {#api-highlightcomponentprops}

默认与自定义高亮共用的 width、height、left、top、context 五参数合同。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface HighlightComponentProps extends HighlightRectangle
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `context` | `HighlightComponentContext` | 必需 | 见类型定义。 |
| `width` | `number` | 必需 | 见类型定义。 |
| `height` | `number` | 必需 | 见类型定义。 |
| `left` | `number` | 必需 | 见类型定义。 |
| `top` | `number` | 必需 | 见类型定义。 |

## HighlightComponentContext {#api-highlightcomponentcontext}

目标矩形、页面／高亮／导览状态、overlayRoot 与 next(step = 1)。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface HighlightComponentContext
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `overlayRoot` | `HTMLElement` | 必需 | Shared overlay root for App-owned portals that must retain the same stacking context. |
| `targetRect` | `HighlightRectangle` | 必需 | 见类型定义。 |
| `highlight` | `HighlightState` | 必需 | 见类型定义。 |
| `page` | `PageContext` | 必需 | 见类型定义。 |
| `tour` | `TourState \| null` | 必需 | 见类型定义。 |
| `next` | `(step?: number) => Promise<CommandResult>` | 必需 | Relative tour movement: positive forward, negative backward, zero leaves the step unchanged. |

## HighlightRectangle {#api-highlightrectangle}

测量后的宽高及视口坐标，单位为像素。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface HighlightRectangle
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `width` | `number` | 必需 | 见类型定义。 |
| `height` | `number` | 必需 | 见类型定义。 |
| `left` | `number` | 必需 | 见类型定义。 |
| `top` | `number` | 必需 | 见类型定义。 |

## DefaultHighlightComponentProps {#api-defaulthighlightcomponentprops}

内置组件参数，在通用五参数之外接收 styles。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface DefaultHighlightComponentProps extends HighlightComponentProps
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `styles` | `DefaultHighlightStyles \| undefined` | 可省略 | 见类型定义。 |
| `context` | `HighlightComponentContext` | 必需 | 见类型定义。 |
| `width` | `number` | 必需 | 见类型定义。 |
| `height` | `number` | 必需 | 见类型定义。 |
| `left` | `number` | 必需 | 见类型定义。 |
| `top` | `number` | 必需 | 见类型定义。 |

## DefaultHighlightStyles {#api-defaulthighlightstyles}

仅用于内置高亮和气泡的样式参数，不包含公共层级策略。

**导入：** `@jangts/router-plus/overlay`。

### 定义

**类型别名:** `DefaultHighlightStyles`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `surfaceColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `tipBorderColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `tipBorderWidth` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `textColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `radius` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `shadow` | `string \| undefined` | 可省略 | 见类型定义。 |
| `accentColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `highlightRadius` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `highlightBorderColor` | `string \| undefined` | 可省略 | 见类型定义。 |
| `highlightBorderWidth` | `string \| number \| undefined` | 可省略 | 见类型定义。 |
| `tipGap` | `string \| number \| undefined` | 可省略 | 见类型定义。 |

## OverlayAppearanceOptions {#api-overlayappearanceoptions}

实时可更新的外观、交互与高亮组件注册。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface OverlayAppearanceOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `interactive` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `className` | `string \| undefined` | 可省略 | Persistent App class, retained when per-highlight classes change. |
| `theme` | `OverlayTheme \| undefined` | 可省略 | 见类型定义。 |
| `highlightRenderer` | `OverlayHighlightRenderer \| undefined` | 可省略 | Render only the highlight content inside a Plus-positioned box, preserving the overlay. |

## OverlayMount {#api-overlaymount}

可调用的清理句柄，通过 update 替换展示配置。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface OverlayMount
```

#### 调用

```ts
OverlayMount(): void
```

无调用参数。

**返回：** `void`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `update` | `(options: OverlayAppearanceOptions) => void` | 必需 | 见类型定义。 |

## DEFAULT_OVERLAY_Z_INDEX {#api-default_overlay_z_index}

覆盖层默认高层级 10000，由 App 固定值或范围约束。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
const DEFAULT_OVERLAY_Z_INDEX: 10000
```

## OverlayHighlightRenderer {#api-overlayhighlightrenderer}

只绘制高亮内容的挂载／更新／清理接口，宽高位置由 Plus 控制。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface OverlayHighlightRenderer
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `mount` | `(host: HTMLElement) => void` | 必需 | 见类型定义。 |
| `render` | `(props: HighlightComponentProps \| null) => void` | 必需 | 见类型定义。 |
| `destroy` | `() => void` | 必需 | 见类型定义。 |

## createDefaultHighlightRenderer {#api-createdefaulthighlightrenderer}

创建接收统一参数和额外样式的默认高亮组件实现。

**导入：** `@jangts/router-plus/overlay`。

### 定义

#### 调用

```ts
createDefaultHighlightRenderer(): DefaultHighlightRenderer
```

The default component owns its rectangular bubble and uses context.next for every tour button.

无调用参数。

**返回：** `DefaultHighlightRenderer`

## DefaultHighlightRenderer {#api-defaulthighlightrenderer}

内置高亮组件渲染接口及其默认气泡节点。

**导入：** `@jangts/router-plus/overlay`。

### 定义

```ts
interface DefaultHighlightRenderer extends OverlayHighlightRenderer
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `render` | `(props: DefaultHighlightComponentProps \| null) => void` | 必需 | 见类型定义。 |
| `bubble` | `HTMLElement` | 必需 | 见类型定义。 |
| `mount` | `(host: HTMLElement) => void` | 必需 | 见类型定义。 |
| `destroy` | `() => void` | 必需 | 见类型定义。 |

## 使用示例

```tsx
import { RouterPlusOverlay } from '@jangts/router-plus/react';

<RouterPlusOverlay theme={{ zIndex: { max: 59 }, highlightPadding: 4 }} />
```

安装后可使用显式目标：

```ts
await plus.highlight({ selector: '#controls' }, { message: '操作区', spotlight: true });
await plus.clearHighlight();

await plus.startTour([
  { target: { selector: '#controls' }, message: '选择一个选项' },
  { target: { selector: '#content' }, message: '查看结果' },
]);
```

只安装 DOM 能力而不使用默认覆盖层：

```ts
import { installDomRuntime } from '@jangts/router-plus/overlay';

const stop = installDomRuntime(plus, { root: document.getElementById('app') ?? undefined });
```

运行时注入的样式与 `@jangts/router-plus/overlay.css` 来自同一来源，任选其一即可。自定义组件、五参数接口、气泡位置与 next 步长详见[高亮与导览](../guide/interactions)。
