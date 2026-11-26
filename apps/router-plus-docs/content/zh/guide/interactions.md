# 高亮与导览

高亮、分步导览、聚焦与滚动共用同一套目标解析和取消机制。仅创建 Core 不会增加界面；需要从框架入口挂载覆盖层，或单独安装 DOM 运行时。

## 挂载覆盖层

React：

```tsx
import { RouterPlusOverlay } from '@jangts/router-plus/react';

<RouterPlusOverlay root={document.getElementById('app') ?? undefined} />
```

Vue：

```ts
import { RouterPlusOverlay } from '@jangts/router-plus/vue';

h(RouterPlusOverlay);
```

组件卸载时会清理渲染器与运行时。只使用 DOM 能力、不要默认界面时：

```ts
import { installDomRuntime } from '@jangts/router-plus/overlay';

const stop = installDomRuntime(plus, { root: document.getElementById('app') ?? undefined });
```

运行时注入的样式与 `@jangts/router-plus/overlay.css` 来自同一来源，任选其一。

## 高亮

```ts
await plus.highlight(
  { selector: '#controls' },
  {
    message: '在这里选择筛选条件',
    placement: 'bottom',
    spotlight: true,
    scrollIntoView: true,
    dismissible: true,
    duration: 4000,
  },
);

await plus.clearHighlight();
```

目标支持：

- 选择器对象 `{ selector }`；
- 元素或元素 getter `{ element }`；
- 几何锚点 `{ rect, contextElement? }`；
- 已登记 id（字符串）或命名解析器输入 `{ target, value }`。

字符串 id 不会当作 CSS 选择器解释；登记 id 按实例作用域隔离。需要异步解析时使用 `waitForTarget` 与 `timeout`；目标找不到返回 `target-not-found`。

清除高亮、提交导航、释放作用域或销毁实例都会让待解析目标失效。被拒绝的导航会保留当前交互；同实例的查询／hash／状态更新默认保留。

## 分步导览

```ts
await plus.startTour(
  [
    { target: { selector: '#controls' }, message: '选择一个选项', advanceOn: 'click' },
    { target: { selector: '#content' }, message: '查看结果' },
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

`advanceOn: 'click'` 时由目标点击推进；否则用 `nextTourStep()`／`prevTourStep()` 或键盘。`awaitUser` 让步骤等待用户确认。显式高亮会替换正在进行的导览。

被更新步骤替代的异步工作不能覆盖新步骤；`beforeStep`／`afterStep` 抛错会返回失败回执，由调用方决定停止或后续处理。

## 聚焦与滚动

```ts
await plus.focus({ selector: '#name' }, { preventScroll: true, restore: true });
await plus.scrollTo(
  { selector: '#items' },
  { behavior: 'smooth', block: 'center', offset: 16 },
);
```

- 聚焦可以在交互清理或导航时恢复；
- 滚动支持显式容器、偏移与减少动态效果；非原生滚动容器通过 `ScrollStrategy` 扩展；
- 几何锚点可以高亮 canvas 区域，但聚焦需要真正可聚焦的元素。

## 作用域与根节点

DOM 目标解析限制在活动宿主的根节点内，找不到时回退到运行时根节点。Shadow root 可以直接作为根；同源 iframe 需要在该文档内安装运行时或显式提供坐标转换，跨源目标需要调用方自己的消息桥。

默认视觉布局与命令／状态正确性分开：位置、尺寸和样式可按应用验收调整，不影响导航与状态合同。

状态读取与操作见[状态访问与命令编组](state-access)，环境隔离见[SSR 与测试](state-ssr-and-testing)。

## 由 App 决定层级与外观

默认覆盖层使用较高的层级 10000，App 可指定固定值或范围，给自己的导航、弹窗等留出更高层级。

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

`zIndex: 58` 指定固定值，`{ min: 12000 }` 指定下限，`{ min: 30, max: 59 }` 同时约束上下限。范围包含边界，显式 0 有效。长度数字使用 px，也可传入 CSS 长度、`var()` 或 `calc()`。

Vue 使用相同 theme，通过 `:theme="guideTheme"` 传入；原生 DOM 使用 `mountOverlay(plus, { theme })`。挂载返回的清理函数还可通过 `update({ theme })` 更新展示配置，不重建运行时或当前高亮。默认 CSS 使用零优先级与变量回退，App 可以覆盖普通样式或继承变量；`injectStyles: false` 将样式安装交给 App。Root 选择挂载位置，但仍受祖先 stacking context 约束。

## 注册自己的高亮组件

```tsx
import { RouterPlusOverlay, type HighlightComponentProps } from '@jangts/router-plus/react';

function AppHighlight({ width, height, context }: HighlightComponentProps) {
  return <div aria-label={context.highlight.message}
    style={{ width, height, border: '2px solid currentColor', borderRadius: 12 }} />;
}

<RouterPlusOverlay highlightComponent={AppHighlight} />
```

组件统一接收 `width`、`height`、`left`、`top`、`context`。前四个是包含外扩的实际高亮框尺寸与视口坐标，Plus 已定位外层 host，内层不要再次叠加 left／top。`context` 提供原始 `targetRect`、高亮／当前页面／导览状态、公共 `overlayRoot` 和 `next(step = 1)`。

Vue 组件可用 `defineProps<HighlightComponentProps>()` 声明相同接口，再通过 `:highlight-component="AppHighlight"` 登记。React Portal／Vue Teleport 保留 App 的 Context／injection。自定义组件自行决定气泡、按钮、文案和样式；默认气泡在自定义模式下隐藏，不由 Plus 测量或定位。需要交互的自定义控件自行启用 `pointer-events: auto`；要维持共享层级，可将自己的 Portal 放到 `context.overlayRoot`。

默认和自定义组件共用同一合同，默认组件只额外接收 `styles: DefaultHighlightStyles`。默认高亮的边框、圆角、气泡与字体样式不套到 App 内容上。遮罩、几何外扩和 overlay 层级仍为公共能力；可用 `maskRadius` 对齐自定义图形的遮罩开口。撤下自定义组件后恢复内置组件。

## 默认气泡的位置和按钮

默认气泡是无尖角矩形，支持边色／边宽、底色、字色和圆角等基础样式。普通高亮用正文右侧的 × 关闭，与正文同排垂直居中，上下内边距为 8px，隐藏操作区不占空间；多步正文与操作区的垂直间距为 4px。多步时气泡内始终只有上一步／下一步两个按钮，首步禁用上一步，末步点下一步结束。这些 UI 规则只适用于默认组件，自定义组件可按状态自由呈现。

| placement | 含义 |
| --- | --- |
| `top` / `bottom` / `left` / `right` | 上／下／左／右居中 |
| `left-top` / `right-top` | 左／右侧，顶边对齐 |
| `left-bottom` / `right-bottom` | 左／右侧，底边对齐 |
| `top-left` / `top-right` | 上方，左／右边对齐 |
| `bottom-left` / `bottom-right` | 下方，左／右边对齐 |
| `top-auto` / `bottom-auto` / `left-auto` / `right-auto` | 优先指定方向，再按可见区避让 |
| `auto` | 全自动，优先下方 |
| `none` | 不显示默认气泡，保留高亮和导览状态 |

位置通过单次高亮或各 `TourStep.placement` 设置；`left-top` 与 `top-left` 分别是“左上”和“上左”。可见区模式测量实际气泡大小，依次尝试优先方向、反方向和其他可用方向，再收进可见区；内容过长时在卡片内滚动。

## 统一的相对步进

```ts
await context.next();    // 前进一步
await context.next(-1);  // 后退一步
await context.next(2);   // 前进两步
await context.next(0);   // 保持当前步骤
```

步长必须为安全整数；退到首步之前会停在首步，超过末步会结束，跳过的步骤不执行钩子。Core 对应 `nextTourStep(step = 1)`，命令对应 `{ kind: 'tour.next', step }`；`prevTourStep()` 复用 -1 的同一机制。未激活导览或 overlay 已卸载时，context 控制函数返回取消回执。自定义组件是否调用、何时调用或使用怎样的控件，都由 App 决定。

指定 DOM 滚动容器时，block 与 inline 在容器内部可视区域对齐；nearest 选择最近边缘的最小移动，目标完全可见时保持原位。inline 的 start/end 遵循 RTL 方向；offset 调整垂直起始对齐，水平方向仍遵循 inline。
