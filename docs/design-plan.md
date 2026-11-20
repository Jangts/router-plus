# @jangts/router-plus 设计规划

实施步骤与合同收敛方案见[实施方案](maintenance/implementation-plan.md)。本文保留为设计提案来源；实现阶段以实施方案确定的合同收敛规则消除下文原稿与调整之间的歧义。

> ~~状态：设计评审稿。本文用于多 Agent 评估，不构成已实现的公开 API；评估通过后再创建 `package.json`、登记 `packages/catalog.json` 并进入实现。~~
>
> **调整：状态为设计定稿。** 本文只定义 `@jangts/router-plus` 自身的公开契约、内核拆分与兼容规则。应用如何组织路由文件、如何迁移、如何校验业务命令与权限，属于调用方，不在本文范围。下文采用「原文保留 + 调整」写法，删除线或「原 N」标记的是原稿内容，紧随其后的「调整 N」是本轮修订。

## 0. 已达成共识

1. Router Plus 是纯页面库：只负责页面导航与页面状态（含页面交互状态），不碰 Agent、后端、SSE、业务指令或业务内容。
2. 页面状态分 `owned / delegated / external`；外部 store 通过命名桥集成，始终只有一个 source of truth。
3. 高亮、导览、聚焦、滚动由 Router Plus 统一持有状态、目标和覆盖层；组件只标记 `data-router-plus-target` 或注册 target。
4. ~~扩展通过插件实现：链接协议、目标解析、覆盖层、状态适配、守卫、保留、实例键、路由转换；不新增业务命令。~~
   - 调整 4：扩展项补「业务动作（`NavigationAction`）」与「滚动策略（`ScrollStrategy`）」；仍然只扩展实现，不新增业务命令。
5. React / Vue 同名、同行为、同结果码，共享 conformance；单端功能不进入公开版本。
6. ~~浏览器默认挂载 `window.__ROUTER_PLUS__`；门面只暴露命令、当前上下文/状态、交互、订阅和只读页面目录。~~
   - 调整 6：页面目录改为**脱敏投影**（`PageCatalog`），不暴露 `meta`、组件、视觉配置与 store 引用。
7. ~~页面目录在实例创建时固定；契约版本由 `apiVersion` 声明；首版按 `1.0.0`；未知命令/字段按向前兼容处理。~~
   - 调整 7：`apiVersion` 为**整数**契约版本，首版 `1`；包语义版本独立按 semver 发布，首版 `1.0.0`。
8. **原 8（已移出本文）**：原稿描述的是具体应用的路由替换与迁移内容，属于应用自己的迁移说明；本文只规定包接收调用方传入的 `PageDefinition[]` 与 `Target`。

**新增共识**

9. **路径优先**：`PageTarget` 的字符串形式就是站内路径或 href，`PageDefinition.id` 缺省等于 `path`。id 驱动是 path 驱动之上的可选写法，不是唯一写法。
10. **地址回灌**：适配层必须通过 `connect(ports)` 的 `subscribe` 把每一次真实地址变化（直链、前进/后退、外部 `pushState`）回灌核心；核心不轮询 `history`、不监听 `popstate`。
11. **手写路由是一等路径**：`createReactRoutes / createVueRoutes` 是可选便利，不要求使用；使用手写 `Route` 树时，页面目录、上下文、Tab、实例键、保留与守卫行为与生成方式完全一致。
12. **业务动作链接**：站内链接需要渲染成按钮或触发非导航动作时，通过 `registerNavigationAction` 注册处理器，由 `RouterPlusLink` 渲染 `<button>`；业务语义仍留在应用侧。
13. **只做契约校验**：包内只检查非法路径段、危险协议、重复参数、Tab 不存在、`{ page }` 未登记等自身契约问题，并安全返回 `null` 或结果码。
14. **业务校验先行**：路由白名单、权限、业务命令的 route/store/payload 校验、未保存确认，全部由调用方在调用 `plus.navigate` 之前完成。
15. **不感知业务组织**：路由文件放在哪里、是否使用 `packages/contracts`、迁移时删除哪些文件，都由调用方决定；包只接收调用方传入的 `PageDefinition[]` 与 `Target`。

## 1. 定位

`@jangts/router-plus` 是一个**纯粹、无业务依赖**的页面路由与页面状态库。核心职责仍然只有两类，但页面状态包含页面交互状态，因此它能覆盖比“存一个对象”更多的纯页面需求：

1. **页面路由跳转管理**：页面目录、目标解析、导航计划、历史、Tab、页面实例、离开守卫、保留策略、路由记录生成。
2. **页面内部状态的操作与读取**：按页面实例隔离的应用状态，以及页面交互状态——高亮、导览、聚焦、滚动位置。

它不知道任何具体业务应用、Agent、SSE、面板、表单、指南内容、对比、导出或业务概念。任何页面控件、视图组件、业务桥、脚本和浏览器控制台都可以调用同一套标准接口。

### 1.1 不做什么

- 不实现新的路由引擎；匹配与历史仍交给 React Router / Vue Router。
- 不提供业务指令目录、SSE 队列、模型工具 schema 或后端 Agent 接入。
- 不内置面板、表单、列表、指南内容、导出、store 业务动作的登记表。
- 不替组件决定高亮文案、导览步骤或业务目标含义；只提供通用的目标、状态和覆盖层。
- 不替换 Pinia、Redux 等业务状态管理；只提供页面状态适配契约。
- 不提供整套视觉风格或页面组件；默认覆盖层保持中性、可替换。
- ~~不与任何特定应用的路由命名、聊天协议或业务字段耦合。~~
  - 调整：业务深链协议由应用通过 `LinkProtocol` 注册，核心只提供通用编解码。
- **新增**：不要求应用使用生成式路由记录，手写路由与生成路由的能力、校验和实例语义一致。

### 1.2 调用者

| 调用者 | 使用方式 |
| --- | --- |
| 页面控件 / 视图组件 | hooks、composables、`data-router-plus-target` 标记或 `execute(command)` |
| 业务前端（任意） | 只通过标准接口，以 navigation / state / interaction 命令调用；业务指令留在业务侧 |
| 浏览器控制台 | `window.__ROUTER_PLUS__` 暴露的只读门面 |
| 测试与脚本 | `testing` 子入口创建内存实例 |

## 2. 核心原则

1. **核心零依赖**：`core` 不导入 React、Vue、React Router、Vue Router、状态管理库或任何业务模块。
2. **职责只有两类**：导航管理与页面状态（含页面交互状态）；业务内容不进入本包。
3. **交互状态统一持有**：高亮、导览、聚焦、滚动由 Router Plus 维护唯一状态和覆盖层，组件只标记目标，不各自保存高亮状态。
4. **命令优先**：`execute(command)` 是标准入口；类型化方法只是同一命令的语法糖。
5. **声明式页面**：页面目录是唯一事实来源，路由记录、参数校验、Tab、状态键和保留策略都从它派生。
6. **适配器只做绑定**：React / Vue 层只负责路由、生命周期与覆盖层挂载，不承载业务逻辑。
7. **控制台可用**：浏览器中默认把门面挂到 `window.__ROUTER_PLUS__`，支持直接导航、读写页面状态、发起高亮/导览。
8. **两端一致**：React 与 Vue 提供同名、同行为、同结果码的能力；单端功能不进入公开版本。

**新增原则**

9. **路径与 id 等价**：字符串目标就是站内路径或 href；`PageDefinition.id` 缺省等于 `path`，路径命中页面不需要调用方反查 id。
10. **地址由适配层回灌**：核心不轮询 `history`、不监听 `popstate`；直链进入、前进/后退、外部 `pushState` 都必须经 `connect(ports)` 的 `subscribe` 回灌，`connect` 后立即回灌一次。
11. **业务边界清晰**：包只保证非法目标安全返回 `null`、合法目标按契约执行；路由白名单、权限、业务命令参数与未保存确认由调用方先行完成。

## 3. 统一模型

### 3.1 PageDefinition

**原 3.1（保留）**

```ts
export interface PageDefinition<P = Record<string, string>, S = unknown> {
  /** 页面唯一标识，用于目标、路由名和状态键。 */
  readonly id: string;
  /** 路由模板，例如 /campaigns/:campaignId。 */
  readonly path: string;
  readonly title: string;
  /** 路径参数规则；缺省按字符串处理。 */
  readonly params?: ParamSchema<P>;
  /** 允许进入页面上下文的查询参数白名单。 */
  readonly queryKeys?: readonly string[];
  /** 页内 Tab；默认只写 history.state。 */
  readonly tabs?: readonly PageTab[];
  readonly defaultTab?: string;
  /** 页面状态初始值；省略时使用空对象。 */
  readonly state?: PageStateDefinition<S>;
  /** 页面实例键策略，默认随 pathname 切换。 */
  readonly instanceKey?: InstanceKeyStrategy;
  /** 离开后是否保留页面实例。 */
  readonly retain?: boolean;
  /** 页面组件键；适配层映射到 React/Vue 组件。 */
  readonly component?: string;
  /** 父页面 id；用于生成嵌套路由。 */
  readonly parentId?: string;
  /** 布局键；适配层映射到布局组件。 */
  readonly layout?: string;
  /** 页面守卫。 */
  readonly guards?: PageGuards<P, S>;
  /** 应用自定义元数据；核心不解释，只透传。 */
  readonly meta?: Readonly<Record<string, unknown>>;
}
```

原 `meta` 是唯一的业务扩展槽。应用可以放模块名、权限、指南 id 等，但核心不会读取或据此分支。

**调整 3.1**

```ts
export interface PageDefinition<P = Record<string, string>, S = unknown> {
  /** 页面标识；省略时等于 path。用于目标、状态键与 Tab 归属。 */
  readonly id?: string;
  /** 路由模板，例如 /campaigns/:campaignId、/works/writing/:bookId。 */
  readonly path: string;
  /** 同一页面的额外路径；解析目标时并入匹配。 */
  readonly pathAliases?: readonly string[];
  readonly title: string;
  /** 路径参数规则；缺省按字符串处理。 */
  readonly params?: ParamSchema<P>;
  /** 页内 Tab；默认只写 history.state。 */
  readonly tabs?: readonly PageTab[];
  readonly defaultTab?: string;
  /** 为 true 时 Tab 同时写入查询参数，便于分享与 SSR。 */
  readonly tabInUrl?: boolean;
  /** 页面状态初始值；省略时使用空对象。 */
  readonly state?: PageStateDefinition<S>;
  /** 页面实例键策略，默认随 pathname 切换。 */
  readonly instanceKey?: InstanceKeyStrategy;
  /** 离开后是否保留页面实例；可限制同时保留的数量。 */
  readonly retain?: boolean | { readonly max?: number };
  /** 页面组件键；适配层映射到 React/Vue 组件，核心只透传键。 */
  readonly component?: string;
  /** 父页面 id；用于生成嵌套路由。 */
  readonly parentId?: string;
  /** 布局键；适配层映射到布局组件。 */
  readonly layout?: string;
  /** 页面守卫。 */
  readonly guards?: PageGuards<P, S>;
  /** 应用自定义元数据；核心不解释、不分支，只透传给守卫与事件。 */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** 页内 Tab 声明。 */
export interface PageTab {
  readonly id: string;
  readonly label?: string;
}
```

调整说明：

- `id` 改为可选，缺省等于 `path`。调用方普遍以路径作为目标与 Tab 键，不应被迫先建立 id 表。
- 新增 `pathAliases`：兼容同页多路径与调用方自己的旧地址。
- 新增 `tabInUrl`：原 5.5 已引用该字段，但原接口未声明，补齐。
- `retain` 扩展为 `boolean | { max }`，支持同一页面多个实例同时保留。
- 删除 `queryKeys`：查询参数白名单属于业务校验，由调用方在调用前完成；包不裁剪、不校验 query。
- 明确 `PageDefinition` 不承载组件实现、图标、配色、背景等视觉与业务引用；这些由调用方自己的路由清单与适配层持有。
- `meta` 保留，但不进入 `PageCatalog` 与控制台门面。

### 3.2 PageContext

**原 3.2（保留）**

```ts
export interface PageContext {
  readonly pageId?: string;
  readonly title?: string;
  readonly path: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly tab: string | null;
  readonly instance: PageInstance | null;
}
```

原：前端只上报当前 path；`getContext()` 返回归一化结果。核心不解析指南、业务对象或后端数据。

**调整 3.2**

```ts
export interface PageContext {
  /** 命中页面目录时为页面 id，未登记路径为 null。 */
  readonly pageId: string | null;
  readonly title?: string;
  /** 完整站内地址（pathname + search + hash）。 */
  readonly path: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly tab: string | null;
  readonly instance: PageInstance | null;
  /** 脱敏后的页面条目；未登记路径为 null。 */
  readonly page: PageCatalogEntry | null;
}

/** 页面目录的脱敏投影：只含核心与调试需要的字段，不含 meta、组件与视觉。 */
export interface PageCatalogEntry {
  readonly id: string;
  readonly path: string;
  readonly pathAliases?: readonly string[];
  readonly title: string;
  readonly tabs?: readonly PageTab[];
  readonly defaultTab?: string;
  readonly tabInUrl?: boolean;
  readonly retain: boolean;
  readonly instanceKey: InstanceKeyStrategy;
  readonly parentId?: string;
  readonly component?: string;
  readonly layout?: string;
}

/** 当前地址的目录匹配结果。 */
export interface PageMatch {
  readonly page: PageCatalogEntry;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly tab: string | null;
}
```

调整说明：

- `pageId` 改为 `string | null`：调用方可以传入未登记路径，包必须仍能返回上下文，不能因未命中页面目录而抛错或返回 `undefined`。
- 补齐 `pathname / search / hash`：调用方的查询参数封装、栏目归属与页面上下文上报都直接读这三段。
- 新增 `page`（脱敏条目）与 `PageMatch`：应用外壳、栏目归属、标题同步可以复用同一份匹配结果，不再各自匹配路径。
- 新增 `PageCatalogEntry` 作为目录的脱敏投影；`meta`、组件、视觉引用不暴露。

### 3.3 PageInstance

**原 3.3（保留）**

```ts
export interface PageInstance {
  readonly pageId: string;
  readonly instanceKey: string;
  readonly tab: string | null;
  readonly stateKey: string;
  readonly historyKey: string;
  readonly retained: boolean;
}

export type InstanceKeyStrategy =
  | 'pathname'
  | 'page'
  | 'param'
  | ((context: PageContext) => string);
```

原：同一页面可同时存在多个实例；实例键决定页面状态、保留和历史恢复是否复用。

**调整 3.3**

```ts
export interface PageInstance {
  readonly pageId: string;
  readonly instanceKey: string;
  readonly tab: string | null;
  readonly stateKey: string;
  readonly historyKey: string;
  readonly retained: boolean;
}

export type InstanceKeyStrategy =
  | 'pathname'
  | 'page'
  /** 取指定路径参数拼接实例键；任一参数缺失时退回 pathname。 */
  | { readonly params: readonly string[] }
  | ((context: PageContext) => string);
```

调整说明：

- 删除 `'param'`：原写法没有说明取哪个参数，无法实现也无法测试。改为 `{ params: readonly string[] }`，显式声明参与实例键的参数。
- 实例键只决定状态、保留与历史恢复是否复用，不参与业务权限或路由白名单判断。

### 3.4 PageTarget / NavigationPlan

**原 3.4（保留）**

```ts
export type PageTarget =
  | string
  | {
      readonly page: string;
      readonly params?: Record<string, string>;
      readonly query?: Record<string, string>;
      readonly tab?: string;
      readonly state?: unknown;
    };

export type NavigationPlan =
  | { kind: 'page'; href: string; pageId: string; tab?: string; state?: unknown }
  | { kind: 'external'; href: string };
```

原「解析与执行分离」：

```ts
resolveTarget(target, pages, location): NavigationPlan | null;
executePlan(plan, ports, options): Promise<NavigationResult>;

export interface RouterPlusPorts {
  navigate(href: string, options?: NavigateOptions): unknown;
  replace?(href: string, options?: NavigateOptions): unknown;
  back?(): unknown;
  forward?(): unknown;
  go?(delta: number): unknown;
}
```

**调整 3.4**

```ts
export type PageTarget =
  /** 站内路径、锚点、http(s) 外链或已注册协议的链接。 */
  | string
  /** 路径形式：以 path 表达页面目标。 */
  | {
      readonly path: string;
      readonly tab?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    }
  /** React Router To 形式的兼容分支；与 path 等价。 */
  | {
      readonly pathname: string;
      readonly search?: string;
      readonly hash?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    }
  /** 页面 id 形式：按 id 或 template path 命中页面并校验参数。 */
  | {
      readonly page: string;
      readonly params?: Record<string, string>;
      readonly query?: Record<string, string>;
      readonly tab?: string;
      readonly state?: unknown;
      readonly replace?: boolean;
    };

export type NavigationPlan =
  | {
      kind: 'page';
      href: string;
      /** 未登记路径为 null。 */
      pageId: string | null;
      /** 去掉查询与片段后的路径。 */
      path: string;
      params: Readonly<Record<string, string>>;
      query: Readonly<Record<string, string>>;
      tab?: string;
      state?: unknown;
      replace?: boolean;
    }
  | { kind: 'external'; href: string }
  /** 由应用注册的业务动作；RouterPlusLink 渲染为按钮。 */
  | { kind: 'action'; actionId: string; payload?: unknown };

/** 当前地址快照，由适配层回灌。 */
export interface RouterLocation {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly state?: unknown;
}
```

调整后的解析与执行：

```ts
/** 同步、纯函数；非法或无法识别时返回 null。 */
resolveTarget(
  target: PageTarget,
  pages: PageCatalog,
  location: RouterLocation,
): NavigationPlan | null;

executePlan(
  plan: NavigationPlan | null,
  ports: RouterPlusPorts,
  context: ExecuteContext,
  options?: NavigateOptions,
): Promise<NavigationResult>;

export interface ExecuteContext {
  readonly pages: PageCatalog;
  readonly current: PageContext;
  readonly actions: ReadonlyMap<string, NavigationActionHandler>;
  readonly historyStateKey: string;
}

export interface RouterPlusPorts {
  navigate(href: string, options?: NavigateOptions): unknown;
  replace?(href: string, options?: NavigateOptions): unknown;
  back?(): unknown;
  forward?(): unknown;
  go?(delta: number): unknown;
  /** 必填：每次真实地址变化都回调；connect 后立即回灌一次。 */
  subscribe(listener: (location: RouterLocation) => void): () => void;
}
```

调整说明：

- 原 `PageTarget` 只有 `string | { page }`，字符串语义未定义。字符串按路径 / href 解释，**不**按页面 id 解释，因此新增 `{ path, tab }` 分支。
- 兼容 React Router 的 `{ pathname, search, hash }` 目标：解析时合并为一个 href，调用方不需要改写导航调用点。
- `plus.resolveTarget(target)` 是公开语法糖，内部使用当前页面目录与已回灌地址；纯函数版本为 `resolveTarget(target, pages, location)`，供测试与应用侧复用。
- `NavigationPlan` 补齐 `path / params / query`；`pageId` 允许为 `null`，表示该路径不在调用方传入的页面目录中。包不对路径做业务白名单判断。
- 新增 `action` 计划：站内链接可能触发非导航动作，需要渲染成按钮而不是链接，原设计的 `page | external` 无法表达。
- `RouterPlusPorts` 新增必填的 `subscribe`。原接口只有出站方法，核心无法获知直链进入、前进/后退和外部 `pushState`，`getContext()`、守卫和历史恢复都缺少输入。
- `executePlan` 明确负责合并 `state` 并写入历史状态，避免适配层与应用各写一份。

### 3.5 PageStateDefinition

```ts
export interface PageStateDefinition<S> {
  readonly initial: S | (() => S);
  readonly version?: number;
  readonly migrate?: (value: unknown, fromVersion: number) => S;
  readonly persist?: 'memory' | 'session';
}
```

页面状态按实例隔离，默认内存保存；状态键由 `pageId + instanceKey` 派生，调用方不需要手写。

### 3.6 页面交互模型

```ts
/** 目标引用：id 优先查 data-router-plus-target 与注册表；selector / element 用于特殊场景。 */
export type TargetRef =
  | string
  | { readonly selector: string }
  | { readonly element: Element | (() => Element | null) }
  | { readonly target: string; readonly value: unknown };

export type HighlightPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface HighlightOptions {
  readonly message?: string;
  readonly placement?: HighlightPlacement;
  readonly spotlight?: boolean;
  readonly padding?: number;
  readonly scrollIntoView?: boolean;
  readonly waitForTarget?: boolean;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly interactive?: boolean;
  readonly className?: string;
}

export interface HighlightState {
  readonly target: TargetRef;
  readonly element: Element;
  readonly message?: string;
  readonly placement: HighlightPlacement;
  readonly startedAt: number;
}

export interface TourStep {
  readonly target: TargetRef;
  readonly message: string;
  readonly placement?: HighlightPlacement;
  readonly awaitUser?: boolean;
  readonly advanceOn?: 'manual' | 'click';
}

export interface TourState {
  readonly id?: string;
  readonly steps: readonly TourStep[];
  readonly index: number;
  readonly awaiting: boolean;
  readonly active: boolean;
}

export interface TourOptions {
  readonly id?: string;
  readonly dismissible?: boolean;
  readonly keyboard?: boolean;
  readonly beforeStep?: (index: number, step: TourStep) => void | Promise<void>;
  readonly afterStep?: (index: number, step: TourStep) => void | Promise<void>;
  readonly onStep?: (index: number, step: TourStep) => void;
  readonly onFinish?: () => void;
  readonly onCancel?: () => void;
}

export interface FocusOptions {
  readonly preventScroll?: boolean;
  readonly restore?: boolean;
}

export interface ScrollOptions {
  readonly behavior?: 'auto' | 'smooth';
  readonly block?: 'start' | 'center' | 'end' | 'nearest';
  readonly inline?: 'start' | 'center' | 'end' | 'nearest';
  readonly offset?: number;
  /** 自定义滚动容器（抽屉、面板、ShadowRoot 内的滚动区）。 */
  readonly container?: Element | string;
}

export interface TargetResolver {
  resolve(
    target: { readonly target: string; readonly value: unknown },
  ): Element | null | Promise<Element | null>;
}

export interface HighlightRenderer {
  mount(root: Document | ShadowRoot | Element): void;
  render(state: HighlightState | null): void;
  destroy(): void;
}
```

统一机制：

- 组件只标记目标：`data-router-plus-target="save-button"`，或在特殊场景 `registerTarget(id, () => element)`。
- Router Plus 负责目标解析、唯一高亮/导览状态、覆盖层渲染、滚动与重新定位。
- 组件不保存高亮状态、不各自渲染遮罩；所有调用者和控制台看到同一份状态。

### 3.7 标准命令

Router Plus 的命令只覆盖导航、页面状态与页面交互：

```ts
export type RouterCommand =
  | { kind: 'navigate'; target: PageTarget; options?: NavigateOptions }
  | { kind: 'replace'; target: PageTarget; options?: NavigateOptions }
  | { kind: 'back' }
  | { kind: 'forward' }
  | { kind: 'go'; delta: number }
  | { kind: 'tab.set'; tab: string }
  | { kind: 'tab.read' }
  | { kind: 'state.set'; key?: string; value: unknown }
  | { kind: 'state.patch'; key?: string; value: Record<string, unknown> }
  | { kind: 'state.reset'; key?: string }
  | { kind: 'state.read'; key?: string }
  | { kind: 'context.read' }
  | { kind: 'highlight.set'; target: TargetRef; options?: HighlightOptions }
  | { kind: 'highlight.clear' }
  | { kind: 'tour.start'; steps: readonly TourStep[]; options?: TourOptions }
  | { kind: 'tour.next' }
  | { kind: 'tour.prev' }
  | { kind: 'tour.stop' }
  | { kind: 'focus'; target: TargetRef; options?: FocusOptions }
  | { kind: 'scroll.to'; target: TargetRef; options?: ScrollOptions }
  | { kind: 'retain' }
  | { kind: 'release' };
```

```ts
export type CommandResult =
  | { readonly ok: true; readonly value?: unknown }
  | {
      readonly ok: false;
      readonly reason:
        | 'invalid-target'
        | 'unknown-page'
        | 'invalid-param'
        | 'invalid-tab'
        | 'unsupported-scheme'
        | 'unknown-action'
        | 'target-not-found'
        | 'state-readonly'
        | 'state-unsupported'
        | 'state-unknown'
        | 'unsupported-command'
        | 'dom-unavailable'
        | 'not-connected'
        | 'not-ready'
        | 'blocked'
        | 'cancelled'
        | 'failed';
      readonly message?: string;
    };
```

没有 `mode`、`label`、`required`、`dependsOn`、按钮状态或重试策略。这些属于调用方（例如调用方的指令卡片），由调用方自行管理，只把最终的导航/状态/交互动作交给 Router Plus。

**调整 3.7**

- 命令集新增 `tab.read`，与已有的 `tab.set` 和 `getTab()` 对齐。
- 结果码新增 `unsupported-scheme`、`unknown-action`、`dom-unavailable`：分别对应链接协议未注册、业务动作未注册、DOM 运行时未安装。原结果码全部保留。
- 不新增 `invalid-query`：查询参数白名单属于业务校验，包不判断 query 是否合法。

### 3.8 事件

```ts
export type RouterEvent =
  | { type: 'location'; context: PageContext }
  | { type: 'navigation'; from: PageContext; to: PageContext; result: NavigationResult }
  | { type: 'tab'; context: PageContext; tab: string }
  | { type: 'state'; context: PageContext; key: string; value: unknown }
  | { type: 'action'; actionId: string; payload?: unknown; context: PageContext }
  | { type: 'highlight'; state: HighlightState | null }
  | { type: 'tour'; state: TourState | null }
  | { type: 'retain'; instance: PageInstance }
  | { type: 'release'; instance: PageInstance };
```

`location` 事件在每次地址回灌后触发，包含直链进入、前进/后退与外部 `pushState`；`navigation` 只在经 Router Plus 发起的导航完成后触发，两者不互相替代。

控件、业务前端和控制台都可以订阅同一组事件，不需要额外业务桥。

**调整 3.8**

- 新增 `location` 事件：原事件集只有 `navigation`，而直链进入、浏览器前进/后退、外部 `pushState` 不经过 `execute`，原设计没有任何事件能让订阅方感知。
- 新增 `action` 事件：业务动作链接被触发时通知订阅方，便于调试与埋点。

## 4. 标准接口

**原 4（保留）**

```ts
export interface RouterPlus {
  /** 标准命令入口；所有能力都可通过它完成。 */
  execute(command: RouterCommand): Promise<CommandResult>;

  /** 绑定框架导航端口；由 React/Vue 适配层调用，返回解绑函数。 */
  connect(ports: RouterPlusPorts): () => void;

  /** 运行时安装/卸载通用扩展插件。 */
  use(plugin: RouterPlusPlugin): Promise<void>;
  unuse(id: string): void;

  /** 类型化语法糖，内部等价于 execute。 */
  navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  replace(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  back(): Promise<CommandResult>;
  forward(): Promise<CommandResult>;
  go(delta: number): Promise<CommandResult>;

  getContext(): PageContext;
  getState<T = unknown>(key?: string): T;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  /** 把组件/业务 store 的页面状态切片委托给 Router Plus。 */
  registerStateBridge<S>(id: string, bridge: PageStateBridge<S>): () => void;
  listStateKeys(): readonly string[];
  getTab(): string | null;
  setTab(tab: string): Promise<CommandResult>;
  retain(): Promise<CommandResult>;
  release(): Promise<CommandResult>;

  registerTarget(id: string, resolve: () => Element | null): () => void;
  unregisterTarget(id: string): void;
  listTargets(): readonly string[];
  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  getHighlight(): HighlightState | null;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  getTour(): TourState | null;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;

  subscribe(listener: (event: RouterEvent) => void): () => void;

  /** 只读页面目录，供调试与生成链接。 */
  readonly pages: PageCatalog;
  readonly version: string;
}
```

**调整 4**

```ts
export interface RouterPlus {
  /** 标准命令入口；所有能力都可通过它完成。 */
  execute(command: RouterCommand): Promise<CommandResult>;

  /** 绑定框架导航端口；适配层调用，返回解绑函数。 */
  connect(ports: RouterPlusPorts): () => void;
  /** 是否已完成 connect；未连接时导航命令返回 not-connected。 */
  readonly connected: boolean;

  /** 运行时安装/卸载通用扩展插件。 */
  use(plugin: RouterPlusPlugin): Promise<void>;
  unuse(id: string): void;

  /** 类型化语法糖，内部等价于 execute。 */
  navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  replace(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  back(): Promise<CommandResult>;
  forward(): Promise<CommandResult>;
  go(delta: number): Promise<CommandResult>;

  /** 同步解析目标；非法返回 null。 */
  resolveTarget(target: PageTarget): NavigationPlan | null;
  /** 只生成站内 href；外链、业务动作与非站内返回 null。 */
  resolveHref(target: PageTarget): string | null;
  /** 用当前页面目录匹配地址；未登记时返回 null。 */
  match(pathname: string): PageMatch | null;

  getContext(): PageContext;
  getState<T = unknown>(key?: string): T;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  /** 把组件/业务 store 的页面状态切片委托给 Router Plus。 */
  registerStateBridge<S>(id: string, bridge: PageStateBridge<S>): () => void;
  listStateKeys(): readonly string[];
  getTab(): string | null;
  setTab(tab: string): Promise<CommandResult>;
  retain(): Promise<CommandResult>;
  release(): Promise<CommandResult>;

  registerTarget(id: string, resolve: () => Element | null): () => void;
  unregisterTarget(id: string): void;
  listTargets(): readonly string[];
  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  getHighlight(): HighlightState | null;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  getTour(): TourState | null;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;

  /** 注册站内链接的业务动作处理器；返回解绑函数。 */
  registerNavigationAction(id: string, handler: NavigationActionHandler): () => void;

  subscribe(listener: (event: RouterEvent) => void): () => void;

  /** 只读、脱敏的页面目录，供调试与生成链接。 */
  readonly pages: PageCatalog;
  /** 包语义版本，例如 1.0.0。 */
  readonly version: string;
  /** 契约版本，整数；首版为 1。 */
  readonly apiVersion: number;
}

export interface PageCatalog {
  readonly entries: readonly PageCatalogEntry[];
  readonly ids: readonly string[];
  get(id: string): PageCatalogEntry | undefined;
  byPath(pathname: string): PageMatch | null;
}
```

调整说明：

- 新增 `connect` 的连接态、`resolveTarget / resolveHref / match` 与 `registerNavigationAction`：原接口没有同步解析入口，`RouterPlusLink` 无法在渲染期判断链接是页面、外链还是业务动作，也无法在非法目标时降级。
- 新增 `apiVersion`：契约版本与包 semver 分离。
- `pages` 改为脱敏 `PageCatalog`，只返回条目投影，不暴露 `meta`、组件与视觉配置。

命令模式示例：

```ts
await plus.execute({
  kind: 'navigate',
  target: { page: 'products', query: { keyword: 'gold' } },
});

await plus.execute({ kind: 'tab.set', tab: 'filters' });
await plus.execute({ kind: 'state.patch', value: { keyword: 'gold' } });
await plus.execute({
  kind: 'state.patch',
  key: 'campaign-draft',
  value: { title: 'New title' },
});
const state = plus.getState<{ keyword: string }>();
const draft = plus.getState<{ title: string }>('campaign-draft');
const context = plus.getContext();

await plus.execute({
  kind: 'highlight.set',
  target: 'save-button',
  options: { message: '点击这里保存', placement: 'bottom', scrollIntoView: true },
});
```

### 4.1 业务调用方的边界

**原 4.1（保留）**

业务前端只需要：

1. 把业务动作中的“跳转 / 切 Tab / 读写页面状态 / 高亮目标 / 导览步骤”转换成 `RouterCommand`。
2. 如果页面状态归外部 store，注册对应的 `PageStateBridge`。
3. 调用 `plus.execute(command)`。

**调整 4.1**

在原有三条之外补充两条，调用顺序不变：

1. 需要站内链接渲染成按钮或触发非导航动作时，用 `registerNavigationAction` 注册处理器，让 `RouterPlusLink` 渲染 `<button>`。
2. 需要自定义链接协议时，用 `LinkProtocol` 注册解析器；不要在页面里另写一套跳转。

业务侧在调用 Router Plus 之前完成自己的校验：路由白名单、权限、业务命令的 route / store / payload 校验、未保存确认。Router Plus 只保证非法 `Target` 安全返回 `null`、合法 `Target` 按契约执行；它不持有业务指令目录，也不参与调用方的命令卡片、SSE 或模型工具 schema。

## 5. 导航

### 5.1 目标解析

**原 5.1（保留）**

- 只接受已登记页面、站内绝对路径、锚点和普通 `http(s)` 外链。
- 路径参数逐项解码与校验，拒绝空值、`.`、`..`、空白、反斜杠、斜杠和控制字符。
- 查询参数只保留 `queryKeys` 白名单；Tab 必须在该页 `tabs` 中。
- 未登记页面、危险协议、凭据、重复参数和非法路径一律返回 `null`，不产生副作用。

**调整 5.1**

- 字符串目标：以 `/` 开头按站内路径解析；以 `#` 开头保留当前路径与查询只替换片段；`http(s)` 为外链；其他 scheme 交给已注册的 `LinkProtocol`；无法识别返回 `null`。
- 对象目标：`{ path }` 按路径解析；`{ page, params }` 按页面 id 或 template path 命中并校验参数。
- 路径参数逐项解码与校验，拒绝空值、`.`、`..`、空白、反斜杠、斜杠和控制字符。
- Tab 必须在该页 `tabs` 中；`defaultTab` 只用于回退，不在校验失败时静默改写。
- 查询参数原样保留，包不裁剪、不校验、不去重；业务允许哪些 query 由调用方在调用前判断。
- 路径型目标不做业务白名单：路径不在调用方传入的页面目录时，仍返回 `pageId: null` 的页面计划；`{ page }` 未登记返回 `unknown-page` / `null`。
- 危险协议、凭据、重复参数和非法路径一律返回 `null`，不产生副作用。
- `resolveTarget` 必须同步、纯函数，不读 DOM、不写历史；异步准备只能发生在调用方或插件安装阶段。

调整说明：包只对自身契约负责。哪些路径可访问、哪些 query 允许、哪些页面需要登录，全部由调用方在调用 `plus.navigate` 前完成；包只保证非法目标安全返回 `null`。

### 5.2 页面链接

**原 5.2（保留）**

```ts
createPageLink({ page: 'campaign-detail', params: { campaignId: 'abc' } });
parsePageLink('app://page?page=campaign-detail&params=...');
```

原：页面链接只表达页面目标，不承载业务动作。协议 scheme 可配置；业务侧如需额外协议，在自己的层解析后转成 `PageTarget`。

**调整 5.2**

```ts
createPageLink({ path: '/campaigns/abc' }, { scheme: 'app', pathKey: 'path', tabKey: 'tab' });
parsePageLink('app://page?path=%2Fcampaigns%2Fabc', {
  scheme: 'app',
  pathKey: 'path',
  tabKey: 'tab',
});
```

- 编解码是通用能力：scheme、path 参数名、tab 参数名全部由调用方配置；包不内置业务 scheme。
- 只接受配置的 `pathKey` 与 `tabKey` 两个参数，拒绝组件、凭据、端口、hash 与重复键；Tab 仍按页面目录校验。
- 未配置 `pageLink` 时，包只处理 `/` 路径、`#` 锚点与 `http(s)` 外链；其他 scheme 通过 `LinkProtocol` 注册。
- 其他协议：

```ts
export interface LinkProtocol {
  readonly scheme: string;
  /** 同步解析；只返回页面目标，不执行副作用。 */
  resolve(value: string, location: RouterLocation): PageTarget | null;
}
```

- 业务协议（例如带页面与 Tab 语义的深链）由调用方注册为 `LinkProtocol`；包不复制调用方的 Tab 表，也不在包内维护业务数据。
- 页面链接只表达页面目标，不承载业务动作；业务动作走 `registerNavigationAction`。

调整说明：原示例把业务 scheme 写进包内默认值，会让包携带调用方协议。调整后编解码保留，但 scheme 与参数名必须由调用方显式配置。

### 5.3 路由记录生成

```ts
createReactRoutes(pages, {
  components: { products: lazyProducts, 'campaign-detail': lazyCampaignDetail },
  layouts: { workspace: WorkspaceLayout },
  wrap: element => <RequireAuth>{element}</RequireAuth>,
});

createVueRoutes(pages, {
  components: { products: () => import('./ProductsView.vue') },
  layouts: { workspace: WorkspaceLayout },
  wrap: component => withAuth(component),
});
```

**原 5.3（保留）**

- 路由 `name` 使用 `pageId`，`path` 使用 `PageDefinition.path`。
- `meta` 带上 `title`、`pageId`、`retain`、`instanceKey`。
- `parentId` 生成嵌套路由，`layout` 生成布局路由。
- 生成是默认路径；手写路由可以保留，导航与状态层不依赖生成方式。

**调整 5.3**

- 路由 `name` 使用 `pageId`（缺省即 `path`），`path` 使用 `PageDefinition.path`。
- 路由 `meta` 带 `title`、`pageId`、`retain`、`instanceKey`，供应用外壳读取。
- `parentId` 生成嵌套路由，`layout` 生成布局路由。
- 生成是可选便利；**手写路由是一等路径**。使用手写 `<Routes>` 时，`createRouterPlus({ pages })` 提供的目录匹配、上下文、Tab、实例键、保留与守卫行为与生成方式完全一致。
- 页面外壳（滚动容器、首屏外壳、频道常驻组件、入场动效上下文）由应用自己组合，生成器不接管；`PageDefinition.component / layout` 只是键，核心不引用 React/Vue 组件。

调整说明：原稿把生成写成默认路径。生成器无法表达调用方自己的页面外壳组合，因此明确手写路由为受支持的一等路径，生成器只作为可选便利。

### 5.4 守卫

```ts
export interface PageGuards<P, S> {
  beforeLeave?(context: LeaveContext<P, S>): GuardResult | Promise<GuardResult>;
  beforeEnter?(context: EnterContext<P, S>): GuardResult | Promise<GuardResult>;
  afterEnter?(context: EnterContext<P, S>): void | Promise<void>;
  onRetain?(context: RetainContext<P, S>): void;
  onRestore?(context: RestoreContext<P, S>): void;
}

export type GuardResult = true | false | { redirect: PageTarget } | { message: string };
```

顺序：解析校验 → 当前页 `beforeLeave` → 目标页 `beforeEnter` → 路由跳转 → 写历史状态 → `afterEnter`。异步守卫共享 `AbortSignal`；取消或替换目标时中止后续阶段。

未保存提醒由应用在 `beforeLeave` 中读取页面状态并决定，核心不内置“脏标记”业务语义。

### 5.5 Tab 与历史

**原 5.5（保留）**

- Tab 默认写入 `history.state.routerPlus`，不进入 URL。
- 页面声明 `tabInUrl: true` 时才写入查询参数，便于分享和 SSR。
- 浏览器前进/后退恢复历史项中的 Tab、实例键和保留状态。

**调整 5.5**

- Tab 默认写入 `history.state.routerPlus`，不进入 URL；结构固定为：

```ts
interface RouterHistoryState {
  readonly routerPlus: {
    readonly path: string;
    readonly pageId: string | null;
    readonly instanceKey: string;
    readonly tab: string | null;
  };
}
```

- `executePlan` 负责写入：合并调用方 `options.state` 后放入 `routerPlus`；适配层与应用代码不得自行拼装该键。
- `tabInUrl: true` 时 Tab 同时写入查询参数；URL 中的 Tab 优先于 `history.state`，便于分享与 SSR。
- 浏览器前进/后退按历史项恢复 Tab、实例键与保留状态；实例已被释放时回退到该页 `defaultTab` 或第一个 Tab。

调整说明：原稿只说「写入 `history.state.routerPlus`」，没有结构、写入方与合并规则。调整后固定结构、由 `executePlan` 统一写入；历史状态的旧键兼容属于调用方迁移，不在包内处理。

### 5.6 页面保留

**原 5.6（保留）**

- `retain` 与 `instanceKey` 决定页面实例是否保留。
- Vue：`KeepAlive` + `RouterView :key`。
- React：默认仅状态保留；DOM 保留可选 `Activity` 或缓存 Outlet。
- 保留与释放只影响页面实例和状态，不改变导航结果。

**调整 5.6**

- `retain` 与 `instanceKey` 决定页面实例是否保留；`retain: { max }` 限制同一页面同时保留的实例数，超出按最久未访问释放。
- 保留是**多实例并存**，不是单页 keep-alive：同一页面不同实例键的实例可以同时保留并隐藏，只有当前地址命中的实例可见。
- Vue：`KeepAlive` + `RouterView :key`，按实例键缓存。
- React：`Activity` 按实例键维护多个保留实例；未使用 `Activity` 时退化为仅状态保留，保留决策与释放时机不变。
- 保留与释放只影响页面实例和状态，不改变导航结果；释放后再次进入按 `state.initial` 重建。
- 非保留页面离开即释放，DOM 与状态都不跨地址复用。

调整说明：原稿的措辞接近「单页 keep-alive」。保留必须按实例键并存并允许上限，才能覆盖同一页面多个实例同时保留的场景。

## 6. 页面状态

Router Plus 管理的是**页面实例状态**，不是全局应用状态。页面状态分为三档：Router Plus 托管、委托管理、外部自管。

### 6.1 所有权模式

| 模式 | 谁创建状态 | 谁持有 source of truth | 适用 |
| --- | --- | --- | --- |
| `owned` | Router Plus 按 `PageDefinition.state` 创建 | Router Plus | 页面局部 UI 状态、筛选、分页、草稿标记 |
| `delegated` | 页面/组件自己创建 | 组件或业务 store | 已有表单、复杂组件、Pinia/Redux 中的页面切片 |
| `external` | 应用自己的 store | 应用自己的 store | 全局业务实体，不交给 Router Plus |

规则：

- `owned`：Router Plus 创建状态桶，`get / set / patch / reset / snapshot / restore` 全部由它负责；组件可以用 `usePageState` 受控。
- `delegated`：组件通过 `registerStateBridge` 注册 `read / write / subscribe / snapshot / restore`；Router Plus 负责作用域、生命周期、命令、事件和控制台访问，但不复制状态。
- `external`：全局业务实体继续由 Pinia / Redux 持有。需要页面级访问时，用只读或受控的 `delegated` bridge 暴露切片，不把业务 store 变成 Router Plus 状态。
- 两种模式都按 `pageId + instanceKey` 隔离；命令和控制台只能操作当前页面实例。
- “全局读写”指当前页面内的任何控件和控制台都能访问同一份页面状态，不表示跨页面或全应用共享一个可变大对象。

### 6.2 `owned`：声明式页面状态

```ts
export interface PageStateDefinition<S> {
  readonly initial: S | (() => S);
  readonly version?: number;
  readonly migrate?: (value: unknown, fromVersion: number) => S;
  readonly persist?: 'memory' | 'session';
}
```

- 页面在 `PageDefinition.state` 声明初始值与版本。
- 未声明 `state` 的页面使用空对象桶，仍可读写。
- `usePageState<T>(key?)` 返回受控的 `[state, { set, patch, reset }]`；不传 key 使用 `default`，传 key 读取同名桥；组件不需要自己保存副本。
- 状态变化触发 `state` 事件；任何控件、业务前端和控制台都能订阅。

### 6.3 `delegated`：委托给现有状态

```ts
export interface PageStateBridge<S> {
  read(): S;
  /** 省略表示只读；写入由桥自己决定是否接受。 */
  write?(next: S): void | Promise<void>;
  /** 优先使用切片自己的合并语义；省略时 Router Plus 做 read + 浅合并 + write。 */
  patch?(value: Record<string, unknown>): void | Promise<void>;
  /** 省略时 state.reset 返回 state-unsupported。 */
  reset?(): void | Promise<void>;
  subscribe?(listener: () => void): () => void;
  snapshot?(): unknown | Promise<unknown>;
  restore?(value: unknown): void | Promise<void>;
}

registerStateBridge<S>(id: string, bridge: PageStateBridge<S>): () => void;
```

- 默认状态键为 `default`；`state.read / set / patch / reset` 不传 `key` 时操作默认状态，传 `key` 时操作同名桥。
- 页面或组件在自己的 setup / mount 时注册，绑定当前页面实例；卸载或页面实例释放时调用返回的解绑函数。
- `state.read` 和 `getState(key)` 走 `bridge.read()`；`state.set` 走 `write`，`state.patch` 优先走 `patch`，`state.reset` 走 `reset`。
- 写入返回 Promise 时命令会等待；失败折叠为 `failed`，由桥负责回滚或暴露冲突信息。
- 没有 `write` 的桥是只读的；写入命令返回 `state-readonly`。
- 没有 `reset` 时 `state.reset` 返回 `state-unsupported`。
- 事件规则：有 `subscribe` 时，`state` 事件由桥的订阅回调驱动，写入本身不重复发事件；没有 `subscribe` 时，Router Plus 在写入完成后补发一次。
- 桥的 source of truth 仍在组件或业务 store；委托方组件继续使用自己的状态，bridge 只是给其他控件、业务前端和控制台提供统一入口。
- Router Plus 不复制、不缓存第二份状态；桥负责选择器、派生值、冲突合并和事务语义。

### 6.4 `owned` 的存储适配器

```ts
export interface PageStateAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  subscribe(key: string, listener: () => void): () => void;
  snapshot(): unknown;
  restore(value: unknown): void;
}
```

默认内存实现；可选 session 持久化。可选状态管理适配器：

- Vue：Pinia、Vuex。
- React：Redux Toolkit、Zustand、Jotai、MobX。

适配器只服务 `owned` 页面状态，不改变业务 store 结构。

### 6.5 版本与恢复

- `owned`：`PageStateDefinition.version` 与 `migrate` 负责旧状态升级；`snapshot / restore` 用于页面保留和历史恢复。
- `delegated`：版本迁移由桥自己负责；Router Plus 只调用 `snapshot / restore`（如果提供）。
- 状态订阅与 `state` 事件让控件、业务前端和控制台看到同一份数据。

## 7. 页面交互

页面交互状态属于页面状态的一部分，但由 Router Plus 统一持有，避免每个组件各自维护高亮、导览和滚动状态。

相比“每个组件保存自己的高亮布尔值并渲染遮罩”：

- 组件只标记目标，不再保存高亮状态，也不会出现多个组件同时渲染遮罩；
- 目标解析、定位、滚动和覆盖层只有一份实现，行为一致；
- 任何调用者（页面控件、业务前端、控制台）都能触发同一份高亮/导览状态；
- 状态变化通过事件和订阅暴露，页面其他部分可以响应。

### 7.1 统一机制

- **目标标记**：组件只写 `data-router-plus-target="save-button"`，或在特殊场景注册 `registerTarget(id, () => element)`。
- **目标解析**：Router Plus 统一解析 id、CSS selector、元素引用，并在需要时等待目标出现。
- **唯一状态**：同一时刻只有一个高亮状态和一个导览状态；由 Router Plus 维护，组件不保存。
- **唯一覆盖层**：默认 DOM 覆盖层只挂载一次，负责遮罩、聚光、提示框、箭头和重新定位。
- **事件与命令**：高亮、导览、聚焦、滚动都通过同一套命令与事件对外暴露，控件、业务前端和控制台行为一致。
- **覆盖层来源**：默认覆盖层由 `@jangts/router-plus/overlay` 提供；React/Vue 适配层自动挂载，无框架场景调用 `mountOverlay(plus)`。
- **新增 · DOM 运行时分离**：核心只维护交互状态与目标注册表，不导入 `document` / `window`。DOM 目标解析、聚焦与滚动执行由 `@jangts/router-plus/overlay` 的 `installDomRuntime(plus)` 注册；未安装时 `focus / scrollTo` 返回 `dom-unavailable`。
- **新增 · 命名空间**：交互目标只使用 `data-router-plus-target`，不接管应用自己的 `data-*` 标记；目标解析结果按当前页面实例隔离，导航或实例切换时清空缓存。

### 7.2 目标解析

```ts
registerTarget(id: string, resolve: () => Element | null): () => void;
unregisterTarget(id: string): void;
listTargets(): readonly string[];
```

解析顺序：

1. `{ target, value }` 形式的自定义目标，交给已注册的同名 `TargetResolver`；
2. 已注册的 `id`；
3. `[data-router-plus-target="id"]`；
4. `{ selector }` 形式的 CSS selector；
5. `{ element }` 形式的直接元素或 getter。

规则：

- 字符串按目标 id 处理，不按 CSS selector 解释，避免歧义；CSS 必须显式写 `{ selector: '#save' }`。
- 多个匹配时取第一个可见元素；不可见时继续查找。
- `waitForTarget: true` 使用 `MutationObserver` 等待目标出现，超时返回 `target-not-found`。
- 虚拟列表可由应用注册 getter：getter 可以先滚动/加载，再返回元素。
- 复杂目标（Shadow DOM、iframe 内元素、画布坐标、第三方组件）通过 `TargetResolver` 扩展；解析器只返回元素，不执行副作用。
- 页面导航或实例切换时清空目标解析缓存。

### 7.3 高亮

```ts
await plus.highlight('save-button', {
  message: '点击这里保存',
  placement: 'bottom',
  spotlight: true,
  padding: 8,
  scrollIntoView: true,
  dismissible: true,
});
```

- 状态：目标、元素、文案、位置、开始时间；同一时刻只保留一个高亮。
- 覆盖层：背景遮罩 + 聚光镂空 + 提示框 + 箭头；默认不阻塞页面点击，`interactive` 可选。
- 定位：`ResizeObserver`、滚动、窗口尺寸变化时重新计算；支持 `visualViewport`。
- 无障碍：提示文案使用 `aria-live`；`Escape` 可关闭；尊重 `prefers-reduced-motion`。
- 样式：默认中性覆盖层，提供 CSS 变量与 `className` 覆盖；不写入任何应用视觉规范。
- 生命周期：`duration` 到期、用户关闭、页面导航或 `clearHighlight()` 时结束。

### 7.4 导览

```ts
await plus.startTour([
  { target: 'campaign-name', message: '先确认活动名称' },
  { target: 'campaign-products', message: '再检查选品', awaitUser: true },
  { target: 'campaign-save', message: '最后保存', advanceOn: 'click' },
], { dismissible: true, keyboard: true });
```

- `tour.start / next / prev / stop` 与 `nextTourStep / prevTourStep / stopTour` 同义。
- `awaitUser` 为 true 时等待用户操作或手动下一步；`advanceOn: 'click'` 监听目标点击。
- 导览状态包含 steps、当前 index、awaiting、active；每一步复用高亮覆盖层。
- 键盘：左右方向切换，`Escape` 退出；焦点在提示框与页面之间正确恢复。
- 页面导航默认结束当前导览；页面保留时，返回后不自动恢复。

### 7.5 聚焦与滚动

```ts
await plus.focus('campaign-name', { preventScroll: false });
await plus.scrollTo('campaign-products', { block: 'center', behavior: 'smooth' });
```

- `focus` 只负责 DOM 聚焦与可选的焦点恢复，不改变业务表单状态。
- `scrollTo` 支持 `offset`，用于避开固定页头或面板。
- 两者与高亮/导览共用目标解析，目标不存在时返回 `target-not-found`。
- **新增 · 滚动执行可替换**：应用注册 `ScrollStrategy` 后，`scrollTo` 先交给策略；未注册时由 `./overlay` 的默认策略执行原生滚动。分页阅读、虚拟列表等无法用原生滚动表达的场景必须提供策略，核心不内置分页语义。
- **新增 · 减弱动效**：默认策略与 `ScrollOptions.container` 只作用于可滚动容器；在 `prefers-reduced-motion: reduce` 下强制 `behavior: 'auto'`。

### 7.6 调用示例

组件只标记目标：

```html
<button data-router-plus-target="campaign-save">保存</button>
```

任何页面代码或控制台都可以发起：

```ts
await plus.highlight('campaign-save', { message: '保存前请确认', placement: 'top' });
```

```js
__ROUTER_PLUS__.highlight('campaign-save', { message: '保存前请确认' });
__ROUTER_PLUS__.startTour([
  { target: 'campaign-name', message: '活动名称' },
  { target: 'campaign-save', message: '保存' },
]);
```

### 7.7 边界

- Router Plus 不知道高亮目标的业务含义，也不提供业务文案或步骤编排。
- 同一时刻一个高亮、一个导览；新导览会替换旧高亮，高亮不会叠加多个遮罩。
- 交互状态不进入业务页面状态，不与业务 store 混用。
- 默认覆盖层可替换：通过插件注册自定义 `HighlightRenderer`，核心状态与命令不变。

## 8. 全局访问

浏览器中默认挂载：

**原 8（保留）**

```ts
export interface CreateRouterPlusOptions {
  readonly pages: readonly PageDefinition[];
  readonly state?: PageStateAdapter;
  /** 默认 '__ROUTER_PLUS__'；false 关闭自动挂载。 */
  readonly globalKey?: string | false;
  readonly apiVersion?: number;
  readonly plugins?: readonly RouterPlusPlugin[];
}

export function createRouterPlus(options: CreateRouterPlusOptions): RouterPlus;
export function attachGlobal(plus: RouterPlus, key?: string): () => void;
export function detachGlobal(key?: string): void;

/** 控制台只拿到这个门面，而不是完整实例。 */
export interface RouterPlusGlobal {
  execute(command: RouterCommand): Promise<CommandResult>;
  getContext(): PageContext;
  getState<T = unknown>(key?: string): T;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  listStateKeys(): readonly string[];
  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  getHighlight(): HighlightState | null;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  getTour(): TourState | null;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;
  listTargets(): readonly string[];
  subscribe(listener: (event: RouterEvent) => void): () => void;
  readonly pages: PageCatalog;
  readonly version: string;
}

const plus = createRouterPlus({
  pages,
  globalKey: '__ROUTER_PLUS__',
});
```

**调整 8**

```ts
export interface CreateRouterPlusOptions {
  readonly pages: readonly PageDefinition[];
  readonly state?: PageStateAdapter;
  /** 默认 '__ROUTER_PLUS__'；false 关闭自动挂载。 */
  readonly globalKey?: string | false;
  /** 契约版本，整数；首版为 1。与包 semver 无关。 */
  readonly apiVersion?: number;
  readonly plugins?: readonly RouterPlusPlugin[];
  /** 调用方配置的页面链接编解码；未配置时只处理路径、锚点与 http(s)。 */
  readonly pageLink?: PageLinkOptions;
  /** 写入 history.state 的键；默认 'routerPlus'。 */
  readonly historyStateKey?: string;
  /** 站内链接业务动作处理器。 */
  readonly actions?: readonly NavigationActionRegistration[];
}

export interface PageLinkOptions {
  readonly scheme: string;
  readonly pathKey?: string;
  readonly tabKey?: string;
}

export interface NavigationActionRegistration {
  readonly id: string;
  readonly handler: NavigationActionHandler;
}

export function createRouterPlus(options: CreateRouterPlusOptions): RouterPlus;
export function attachGlobal(plus: RouterPlus, key?: string): () => void;
export function detachGlobal(key?: string): void;

/** 控制台只拿到这个门面，而不是完整实例。 */
export interface RouterPlusGlobal {
  execute(command: RouterCommand): Promise<CommandResult>;
  navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>;
  getContext(): PageContext;
  getState<T = unknown>(key?: string): T;
  setState(value: unknown, key?: string): Promise<CommandResult>;
  patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>;
  resetState(key?: string): Promise<CommandResult>;
  listStateKeys(): readonly string[];
  getTab(): string | null;
  setTab(tab: string): Promise<CommandResult>;
  highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>;
  clearHighlight(): Promise<CommandResult>;
  getHighlight(): HighlightState | null;
  startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>;
  nextTourStep(): Promise<CommandResult>;
  prevTourStep(): Promise<CommandResult>;
  stopTour(): Promise<CommandResult>;
  getTour(): TourState | null;
  focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>;
  scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>;
  listTargets(): readonly string[];
  subscribe(listener: (event: RouterEvent) => void): () => void;
  readonly pages: PageCatalog;
  readonly version: string;
  readonly apiVersion: number;
}

const plus = createRouterPlus({
  pages,
  globalKey: '__ROUTER_PLUS__',
});
```

调整说明：

- `apiVersion` 明确为整数；原稿首版写 `1.0.0` 与 `number` 类型矛盾。
- 新增 `pageLink`、`historyStateKey`、`actions`：分别用于调用方配置的链接编解码、历史状态键与业务动作注册。
- 门面补 `navigate`、`getTab`、`setTab` 与 `apiVersion`，控制台可直接调试导航和 Tab；不暴露解析器、适配器或业务 handler。

```js
// 浏览器控制台
__ROUTER_PLUS__.getContext();
__ROUTER_PLUS__.getState();
__ROUTER_PLUS__.execute({
  kind: 'navigate',
  target: { page: 'campaign-detail', params: { campaignId: 'abc' } },
});
__ROUTER_PLUS__.patchState({ keyword: 'gold' });
__ROUTER_PLUS__.patchState({ title: 'New title' }, 'campaign-draft');
__ROUTER_PLUS__.listStateKeys();
__ROUTER_PLUS__.subscribe(event => console.log(event));
```

**原 8 规则（保留）**

- 只暴露命令门面、当前上下文/状态、交互命令、订阅和只读页面目录；不暴露内部适配器、历史实现或业务 handler。
- 控制台只能操作当前页面实例的导航、状态与交互，不能写后端、不能跨页面读写状态。
- 挂载不自动执行任何命令；只创建全局引用。
- 导航命令要求应用适配层已完成 `connect(ports)`；未连接时返回 `not-connected`，状态读取与订阅仍可用。
- SSR 或非浏览器环境不挂载；提供 `attachGlobal()` / `detachGlobal()` 供显式控制。
- 多实例场景使用不同 `globalKey` 或关闭自动挂载。

**调整 8 规则**

- 只暴露命令门面、当前上下文/状态、交互命令、订阅和脱敏页面目录；不暴露内部适配器、历史实现、业务 handler、组件或视觉配置。
- 控制台只能操作当前页面实例的导航、状态与交互，不能写后端、不能跨页面读写状态。
- 挂载不自动执行任何命令；只创建全局引用。
- 导航命令要求应用适配层已完成 `connect(ports)`；未连接时返回 `not-connected`，状态读取与订阅仍可用；`getContext()` 返回空地址而不是抛错。
- `pages` 是 `PageCatalog` 脱敏投影，`meta` 与组件不可见。
- SSR 或非浏览器环境不挂载；提供 `attachGlobal()` / `detachGlobal()` 供显式控制。
- 多实例场景使用不同 `globalKey` 或关闭自动挂载。

## 9. 框架适配

### 9.1 React

**原 9.1（保留）**

```tsx
const plus = createRouterPlus({ pages, state: memoryStateAdapter });

<RouterPlusProvider plus={plus} router={router}>
  <App />
</RouterPlusProvider>
```

- `useRouterPlus()`：`execute`、导航、上下文、状态、Tab。
- `usePageContext()`：当前 `PageContext`。
- `usePageState<T>(key?)`：页面状态读写；默认 `default`，也可读取委托桥切片。
- `usePageTab()`：Tab 读写。
- `usePageLeaveGuard()`：把应用自己的未保存判断接入 `beforeLeave`。
- `RouterPlusLink`：替代 `Link`。
- `RouterPlusRedirect`：替代 `Navigate`。
- `RouterPlusOutlet`：替代 `Outlet`。
- `useHighlight()` / `useTour()`：高亮与导览状态、命令。
- `RouterPlusOverlay`：挂载默认覆盖层；Provider 只挂载一次。
- `createReactRoutes()`：生成路由记录。

原：Provider 在挂载时调用 `plus.connect(ports)` 并安装 DOM 目标解析与覆盖层，卸载时解绑；导航端口只包装 React Router，不包含业务逻辑。

**调整 9.1**

- `useRouterPlus()`：`execute`、导航、上下文、状态、Tab。
- `usePageContext()`：当前 `PageContext`。
- **新增** `usePageMatch()`：当前 `PageMatch`（页面、参数、查询、Tab）；未登记路径返回 `null`。
- `usePageState<T>(key?)`：页面状态读写；默认 `default`，也可读取委托桥切片。
- `usePageTab()`：Tab 读写；**兼容路径键**，接受可选 `page`（路径或 id），省略时取当前页面。
- **新增** `usePageQuery()`：查询参数读写，替代 `useSearchParams`；读取来自当前上下文，写入经统一导航，**保留 `defaultInit` 参数**。
- `usePageLeaveGuard()`：把应用自己的未保存判断接入 `beforeLeave`。
- `RouterPlusLink`：替代 `Link`；**新增** `fallback`（非法目标降级为文本）与业务动作目标（渲染 `<button>`）。常规 Link 属性透传：`relative / preventScrollReset / viewTransition / target / download / onClick`；中键与新标签页仍交还浏览器；`fallback` 保留 `className / title / aria-label`。
- `RouterPlusRedirect`：替代 `Navigate`。
- `RouterPlusOutlet`：替代 `Outlet`。
- `useHighlight()` / `useTour()`：高亮与导览状态、命令。
- `RouterPlusOverlay`：挂载默认覆盖层并安装 DOM 运行时；Provider 只挂载一次。
- `createReactRoutes()`：改为可选的路由记录生成器；手写路由不需要它。

调整后的 Provider：挂载时调用 `plus.connect(ports)`，`ports.subscribe` 订阅 React Router 的地址变化并在首次挂载立即回灌，卸载时解绑；导航端口只包装 React Router，不包含业务逻辑。

`RouterPlusLink` 渲染规则：解析结果 `page / external` 渲染原生 `<a>` 并只接管普通左键；`action` 渲染 `<button>` 并调用已注册处理器；解析失败时渲染 `fallback`，未提供 `fallback` 时按纯文本渲染，保证不出现点击无反应的链接。

React 适配层不导出任何业务应用的兼容别名；应用如需要旧名称，在自己的代码里做薄封装。

### 9.2 Vue

**原 9.2（保留）**

```ts
const plus = createRouterPlus({ pages, state: memoryStateAdapter });
app.use(createVueRouterPlus({ plus, router }));
```

- `useRouterPlus()`：`execute`、导航、上下文、状态、Tab。
- `usePageContext()`：当前 `PageContext`。
- `usePageState<T>(key?)`：页面状态读写；默认 `default`，也可读取委托桥切片。
- `usePageTab()`：Tab 读写。
- `usePageLeaveGuard()`：未保存判断。
- `RouterPlusLink`：用 `defineComponent` + `h` 实现。
- `RouterPlusRedirect`：重定向。
- `RouterPlusView`：包装 `RouterView`，按 `retain` 接入 `KeepAlive`。
- `useHighlight()` / `useTour()`：高亮与导览状态、命令。
- `RouterPlusOverlay`：挂载默认覆盖层；插件只挂载一次。
- `createVueRoutes()`：生成路由记录。

原：Vue 插件在安装时调用 `plus.connect(ports)` 并安装 DOM 目标解析与覆盖层，卸载时解绑；导航端口只包装 Vue Router，不包含业务逻辑。

**调整 9.2**

- `useRouterPlus()`：`execute`、导航、上下文、状态、Tab。
- `usePageContext()`：当前 `PageContext`。
- **新增** `usePageMatch()`：当前 `PageMatch`；未登记路径返回 `null`。
- `usePageState<T>(key?)`：页面状态读写；默认 `default`，也可读取委托桥切片。
- `usePageTab()`：Tab 读写；接受可选 `page`（路径或 id），省略时取当前页面。
- **新增** `usePageQuery()`：查询参数读写；保留 `defaultInit` 参数，语义与现有查询参数封装一致。
- `usePageLeaveGuard()`：未保存判断。
- `RouterPlusLink`：用 `defineComponent` + `h` 实现；**新增**同样的 `fallback` 与业务动作渲染规则。
- `RouterPlusRedirect`：重定向。
- `RouterPlusView`：包装 `RouterView`，按 `retain` 与实例键接入 `KeepAlive`。
- `useHighlight()` / `useTour()`：高亮与导览状态、命令。
- `RouterPlusOverlay`：挂载默认覆盖层并安装 DOM 运行时；插件只挂载一次。
- `createVueRoutes()`：改为可选的路由记录生成器。

调整后的 Vue 插件：安装时调用 `plus.connect(ports)`，`ports.subscribe` 订阅 `router.afterEach` 与首次 `router.currentRoute` 并立即回灌，卸载时解绑；导航端口只包装 Vue Router，不包含业务逻辑。

### 9.3 两端对齐

| 能力 | React | Vue | 行为一致性 |
| --- | --- | --- | --- |
| 路由记录生成 | `createReactRoutes` | `createVueRoutes` | 同一 `PageDefinition` 与 `meta` |
| 统一导航 | `useRouterPlus().execute` | `useRouterPlus().execute` | 同一命令、结果码与守卫 |
| 历史 | `back / forward / go` | `back / forward / go` | 同一数字语义 |
| 链接 | `RouterPlusLink` | `RouterPlusLink` | 同一 `to`、active 与点击规则 |
| 重定向 | `RouterPlusRedirect` | `RouterPlusRedirect` | 同一 replace 语义 |
| 出口 / 视图 | `RouterPlusOutlet` | `RouterPlusView` | 同一嵌套与保留决策 |
| 页面上下文 | `usePageContext` | `usePageContext` | 同一 `PageContext` |
| Tab | `usePageTab` | `usePageTab` | 同一 history state 与默认值 |
| 页面状态 | `usePageState` | `usePageState` | 同一 `PageStateAdapter` |
| 目标标记 | `data-router-plus-target` / `registerTarget` | `data-router-plus-target` / `registerTarget` | 同一解析顺序与容错 |
| 高亮 | `useHighlight` / `highlight` | `useHighlight` / `highlight` | 同一状态、命令与结果码 |
| 导览 | `useTour` / `startTour` | `useTour` / `startTour` | 同一步骤、awaitUser 与事件 |
| 聚焦 / 滚动 | `focus` / `scrollTo` | `focus` / `scrollTo` | 同一目标解析与选项 |
| 覆盖层 | `RouterPlusOverlay` | `RouterPlusOverlay` | 同一 DOM 渲染器，仅挂载方式不同 |
| 离开守卫 | `usePageLeaveGuard` | `usePageLeaveGuard` | 同一守卫管线 |
| 页面保留 | Activity / 缓存 Outlet / 仅状态 | KeepAlive | 保留决策一致，机制按框架 |
| 状态管理 | Redux / Zustand / Jotai / MobX | Pinia / Vuex | 同一 `PageStateAdapter` 契约 |

**调整 9.3 新增行**

| 能力 | React | Vue | 行为一致性 |
| --- | --- | --- | --- |
| 地址回灌 | `ports.subscribe`（`useLocation`） | `ports.subscribe`（`afterEach` + `currentRoute`） | 同一 `RouterLocation`，`connect` 后立即回灌一次 |
| 页面匹配 | `usePageMatch` / `plus.match` | `usePageMatch` / `plus.match` | 同一 `matchPath` 语义与参数解码 |
| 查询参数 | `usePageQuery` | `usePageQuery` | 同一读写规则，写入走统一导航 |
| 业务动作链接 | `RouterPlusLink` 渲染 `<button>` | `RouterPlusLink` 渲染 `<button>` | 同一 `NavigationActionHandler` |
| 手写路由 | 保留 `<Routes>` | 保留 `RouterView` 路由表 | 目录、Tab、实例键与保留决策一致 |

规则：

- 同一能力必须同时提供两端实现、同名接口和同一结果码；单端功能不进入公开版本。
- 只有框架术语不同才允许分叉：`Outlet` / `View`、`createReactRoutes` / `createVueRoutes`。
- React DOM 保留依赖 React 版本；Vue 使用 KeepAlive。行为决策一致，机制不同。
- 共享 conformance 套件与导出清单对比测试，防止两端漂移。

## 10. 复杂扩展

### 10.1 扩展分层

| 层 | 能扩展什么 | 不能扩展什么 |
| --- | --- | --- |
| 核心命令 | 导航、页面状态、高亮/导览/聚焦/滚动 | 业务指令 |
| 插件 | 链接协议、状态适配、守卫、保留、实例键、路由转换、目标解析、覆盖层渲染 | 业务 handler、业务命令、页面目录 |
| 应用业务层 | 面板、表单、指南文案、导出、store 动作 | 不得绕过 Router Plus 的导航/状态校验 |

Router Plus 的扩展是**实现扩展**，不是**语义扩展**：插件可以改变“怎么解析目标、怎么渲染覆盖层、怎么持久化状态”，但不能新增一整套业务命令。

### 10.2 插件生命周期

```ts
export interface RouterPlusPlugin {
  readonly id: string;
  /** 依赖的其他插件 id；安装时按依赖排序。 */
  readonly requires?: readonly string[];
  /** 排在这些插件之前安装。 */
  readonly before?: readonly string[];
  setup(
    api: RouterPlusPluginApi,
  ): void | (() => void) | Promise<void | (() => void)>;
}

export interface RouterPlusPluginApi {
  registerLinkProtocol(protocol: LinkProtocol): void;
  registerStateAdapter(name: string, adapter: PageStateAdapter): void;
  registerGuard(guard: GlobalGuard, options?: { priority?: number }): void;
  registerRetentionStrategy(strategy: RetentionStrategy): void;
  registerInstanceKeyStrategy(name: string, strategy: InstanceKeyStrategy): void;
  registerRouteTransformer(transformer: RouteTransformer): void;
  registerTargetResolver(kind: string, resolver: TargetResolver): void;
  registerHighlightRenderer(renderer: HighlightRenderer): void;
}
```

- 插件可以在 `createRouterPlus({ plugins })` 时静态安装，也可以运行期 `plus.use(plugin)`；`plus.unuse(id)` 执行清理并移除注册。
- `requires` / `before` 用于排序；缺少依赖或循环依赖启动报错。
- 同一插件 id、同一协议 scheme、同一 target kind、同一 renderer 名称重复注册时报错；卸载后可重新注册。
- `setup` 可以是异步的；安装完成前导航/交互命令排队或返回 `not-ready`。
- 页面目录在实例创建时固定。微前端模块在 shell 创建实例前把 `PageDefinition` 合并进目录；不支持运行期增删页面，避免路由记录与校验漂移。
- `registerStateBridge` 是页面实例级运行时 API，不是插件 API；页面/组件挂载时注册，卸载时解绑。

**调整 10.2**

插件 API 在原八项之外新增两项：

```ts
export interface RouterPlusPluginApi {
  registerLinkProtocol(protocol: LinkProtocol): void;
  registerStateAdapter(name: string, adapter: PageStateAdapter): void;
  registerGuard(guard: GlobalGuard, options?: { priority?: number }): void;
  registerRetentionStrategy(strategy: RetentionStrategy): void;
  registerInstanceKeyStrategy(name: string, strategy: InstanceKeyStrategy): void;
  registerRouteTransformer(transformer: RouteTransformer): void;
  registerTargetResolver(kind: string, resolver: TargetResolver): void;
  registerHighlightRenderer(renderer: HighlightRenderer): void;
  /** 新增：站内链接的业务动作。 */
  registerNavigationAction(id: string, handler: NavigationActionHandler): void;
  /** 新增：滚动执行策略。 */
  registerScrollStrategy(strategy: ScrollStrategy): void;
}

export interface NavigationActionHandler {
  /** 渲染为按钮；默认 true。设为 false 表示只允许通过事件触发。 */
  readonly button?: boolean;
  /** 触发动作；返回 rejected Promise 时命令折叠为 failed。 */
  invoke(payload: unknown, context: PageContext): void | Promise<void>;
}

export interface ScrollStrategy {
  readonly id: string;
  scroll(element: Element, options: ScrollOptions, context: PageContext): void | Promise<void>;
}

export interface RetentionStrategy {
  readonly id: string;
  /** 返回需要释放的实例键；空数组表示不主动释放。 */
  decide(instances: readonly PageInstance[], entering: PageInstance): readonly string[];
}

export interface LinkProtocol {
  readonly scheme: string;
  resolve(value: string, location: RouterLocation): PageTarget | null;
}

export interface GlobalGuard {
  readonly id: string;
  beforeLeave?(context: PageContext): GuardResult | Promise<GuardResult>;
  beforeEnter?(context: PageContext): GuardResult | Promise<GuardResult>;
}

export interface RouteTransformer {
  readonly id: string;
  transform<T>(routes: readonly T[], context: { readonly framework: 'react' | 'vue' }): readonly T[];
}
```

调整说明：原插件 API 缺少「业务动作」与「滚动策略」两个扩展点。业务动作不是导航，也不应变成业务命令；分页阅读与虚拟列表也无法用原生滚动表达，必须允许替换滚动执行。

### 10.3 导航扩展

**原 10.3（保留）**

- `LinkProtocol`：自定义深链 scheme，解析结果只能是 `PageTarget`，不能直接执行副作用。
- `RouteTransformer`：在 `createReactRoutes / createVueRoutes` 生成结果上增加嵌套、布局、权限包装或微前端挂载点。
- `InstanceKeyStrategy`：按租户、模块、参数等自定义页面实例身份。
- `RetentionStrategy`：自定义页面保留/释放；核心仍只输出“是否保留”的决策。
- `GlobalGuard`：按优先级插入全局 `beforeLeave / beforeEnter`，用于权限、未保存提醒、审计等复杂流程。

**调整 10.3 新增项**

- `NavigationAction`：解析结果为 `{ kind: 'action' }` 时，`RouterPlusLink` 渲染按钮并调用已注册处理器；处理器可以打开面板、代发消息或执行应用自己的动作，但不进入导航计划。
- `ScrollStrategy`：替换 `scrollTo` 的执行方式，用于分页阅读、虚拟列表与自定义滚动容器。
- `RetentionStrategy` 补充接口：必须显式返回要释放的实例键，避免「按名称判断」的隐式策略。

### 10.4 外部状态管理集成

`owned` 状态用 `PageStateAdapter`；复杂业务状态用 `PageStateBridge` 接入外部 store。原则是**只有一个 source of truth**：外部 store 继续持有数据，Router Plus 只提供页面作用域、命令和统一入口。

#### 10.4.1 通用映射

| 外部状态 | `read` | `write / patch` | `subscribe` | `snapshot / restore` |
| --- | --- | --- | --- | --- |
| Pinia | store 的页面切片 | store action / `$patch` | `$subscribe` | `$state` / `$patch` |
| Vuex | state 选择器 | `commit` action | `store.subscribe` | module state / hydrate action |
| Redux Toolkit | `selector(store.getState())` | `dispatch(slice.action)` | `store.subscribe` | selector / hydrate action |
| Zustand | `selector(store.getState())` | store action / `setState` | `store.subscribe` | `getState` / `setState` |
| Jotai | `store.get(atom)` | `store.set(atom, value)` | `store.sub(atom, listener)` | `store.get/set` |
| MobX | observable 切片 | action | `reaction` / `autorun` | `toJS` / `applySnapshot` |
| Context / useState | ref / state | setter | 自建 listener | 可选 |

规则：

- `read` 返回**页面切片**，不是整个 store。
- `write / patch` 必须走 store action 或受控 setter，不直接替换整棵 store；只有 hydrate 场景才允许整体恢复。
- 有 `subscribe` 时，`state` 事件由订阅驱动；没有 `subscribe` 时 Router Plus 在写入后补发一次。
- 只读页面切片省略 `write`，控制台写入返回 `state-readonly`。
- 权限、审计、乐观更新、冲突合并、事务由 store action 或桥负责；Router Plus 不绕过。
- 不把外部 store 镜像到 `owned` 状态，避免双写。

#### 10.4.2 数据流与事件

```text
RouterPlus.execute({ kind: 'state.patch', key, value })
  → 状态引擎定位同名桥
  → bridge.patch(value)（store action）
  → store 提交
  → bridge.subscribe 回调
  → RouterEvent { type: 'state', key, value }
  → usePageState(key) / 控制台 / 其他控件更新
```

- 读取始终走 `bridge.read()`，Router Plus 不缓存第二份。
- 有 `subscribe` 时，事件由订阅回调驱动；写入本身不重复发事件。
- 没有 `subscribe` 时，Router Plus 在 `write / patch / reset` 完成后补发一次事件。
- `bridge.patch` 存在时优先使用；否则 `read + 浅合并 + write`。
- 异步写入会等待 Promise；失败返回 `failed`，由桥负责回滚或提供冲突信息。
- 外部 store 被其他 action 修改时，同一 `subscribe` 也会触发 `state` 事件，页面保持同步。

#### 10.4.3 生命周期

1. 页面组件 setup / mount 时 `registerStateBridge('key', bridge)`，绑定当前页面实例。
2. 页面活跃时订阅桥；页面保留但隐藏时暂停订阅；恢复时重新订阅。
3. 页面实例释放或组件卸载时调用解绑函数，移除桥与监听。
4. 同名 key 重复注册报错；先解绑再注册。
5. 未注册 key 读取返回 `undefined`，写入返回 `state-unknown`。
6. 异步数据加载完成后再注册桥；注册前状态命令明确失败，不阻塞导航。

`./stores/*` 子入口提供薄封装：`createPiniaPageStateBridge`、`createVuexPageStateBridge`、`createReduxPageStateBridge`、`createZustandPageStateBridge`、`createJotaiPageStateBridge`、`createMobxPageStateBridge`。它们只负责按下面示例组装 `PageStateBridge`，不引入新的状态语义。

#### 10.4.4 Helper 签名

```ts
export interface StoreBridgeOptions<Store, S> {
  readonly store: Store;
  /** 只读取页面切片，返回稳定引用或 memoized selector 结果。 */
  readonly select: (store: Store) => S;
  /** 写入必须走 store action；省略表示只读。 */
  readonly patch?: (store: Store, value: Partial<S>) => void | Promise<void>;
  readonly reset?: (store: Store) => void | Promise<void>;
  /** 只订阅切片变化，避免整棵 store 触发。 */
  readonly subscribe?: (store: Store, listener: () => void) => () => void;
  readonly snapshot?: (store: Store) => unknown | Promise<unknown>;
  readonly restore?: (store: Store, value: unknown) => void | Promise<void>;
}

export function createPiniaPageStateBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S>;
export function createVuexPageStateBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S>;
export function createReduxPageStateBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S>;
export function createZustandPageStateBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S>;
export function createMobxPageStateBridge<Store, S>(
  options: StoreBridgeOptions<Store, S>,
): PageStateBridge<S>;

export interface JotaiBridgeOptions<S> {
  readonly store: { get(atom: unknown): S; set(atom: unknown, value: S): void; sub(atom: unknown, listener: () => void): () => void };
  readonly atom: unknown;
  readonly reset?: () => void | Promise<void>;
}
export function createJotaiPageStateBridge<S>(
  options: JotaiBridgeOptions<S>,
): PageStateBridge<S>;
```

#### 10.4.5 典型接入

Pinia：

```ts
const draft = useCampaignDraftStore();

plus.registerStateBridge('campaign-draft', {
  read: () => draft.draft,
  patch: value => draft.patch(value),
  reset: () => draft.$reset(),
  subscribe: listener => draft.$subscribe(listener, { detached: true }),
  snapshot: () => draft.draft,
  restore: value => draft.$patch({ draft: value }),
});
```

Redux Toolkit：

```ts
plus.registerStateBridge('campaign-draft', {
  read: () => selectCampaignDraft(store.getState()),
  patch: value => store.dispatch(campaignDraftPatched(value)),
  reset: () => store.dispatch(campaignDraftReset()),
  subscribe: listener => store.subscribe(listener),
  snapshot: () => selectCampaignDraft(store.getState()),
  restore: value => store.dispatch(campaignDraftHydrated(value)),
});
```

Zustand：

```ts
plus.registerStateBridge('filters', {
  read: () => selectFilters(store.getState()),
  patch: value => store.getState().patchFilters(value),
  reset: () => store.getState().resetFilters(),
  subscribe: listener => store.subscribe(listener),
});
```

Jotai：

```ts
plus.registerStateBridge('draft', {
  read: () => jotaiStore.get(draftAtom),
  write: value => jotaiStore.set(draftAtom, value),
  subscribe: listener => jotaiStore.sub(draftAtom, listener),
});
```

MobX：

```ts
plus.registerStateBridge('draft', {
  read: () => draftStore.draft,
  patch: value => draftStore.patch(value),
  subscribe: listener => reaction(() => draftStore.draft, listener),
});
```

Vuex：

```ts
plus.registerStateBridge('draft', {
  read: () => store.state.campaign.draft,
  patch: value => store.commit('campaign/patchDraft', value),
  reset: () => store.commit('campaign/resetDraft'),
  subscribe: listener => store.subscribe(listener),
});
```

React Context / useState：

- 组件内维护 `stateRef` 与 listener 集合；
- `read: () => stateRef.current`；
- `write: next => setState(next)`；
- `subscribe` 在 setState 后通知；
- 卸载时 `unregister()`。

#### 10.4.6 复杂场景

- **全局实体 + 页面视图**：Pinia/Redux 持有产品、Campaign 等实体；Router Plus `owned` 状态保存筛选、分页、Tab；选中项或草稿用 `delegated` 切片。
- **表单草稿**：React Hook Form / VeeValidate / FormKit 等继续持有表单；桥提供 `read / patch / subscribe`；Router Plus 页面状态只保存步骤、脏标记和提交状态。
- **跨页向导**：跨路由的数据放外部 store；每个页面注册同一或不同切片桥；Router Plus 页面状态只保存当前步骤 UI。
- **乐观更新**：桥的 `patch` 返回 Promise；store 先乐观更新，失败时回滚；Router Plus 等待 Promise，失败返回 `failed`，事件由 store 订阅驱动。
- **只读权限**：省略 `write`；控制台和业务前端都只能读，写入返回 `state-readonly`。
- **SSR**：外部 store 在服务端生成快照；桥 `read` 返回服务端切片；Router Plus 自身不序列化外部 store，水合后由桥订阅。
- **多实例/多页面**：外部 store 跨页面存在；桥绑定当前页面实例，页面释放时解绑；全局实体不受页面切换影响。
- **页面保留/释放**：活跃页面订阅桥；保留但隐藏时暂停订阅，恢复时重订阅；页面实例释放时自动解绑，避免遗留监听。
- **冲突与错误**：桥的写入失败、版本冲突、权限拒绝都抛出带消息的错误；Router Plus 返回 `failed`，不自动重试，由业务提示或重新加载。
- **事务**：一个 Router Plus 命令只对应一次桥调用；多字段/多 store 事务由 store action 或桥内部完成，Router Plus 不提供跨 store 事务。
- **性能**：`select` 返回稳定引用或 memoized 结果；`subscribe` 只订阅切片；Router Plus 浅比较，不深拷贝；保留但隐藏的页面暂停订阅。
- **安全**：桥的写入必须走 store action 的权限、审计和乐观锁；只读切片省略 `write`；控制台与页面走同一桥，没有特权路径。

#### 10.4.7 反模式

- 把 Pinia/Redux 的整棵状态镜像进 Router Plus `owned` 状态。
- 桥直接 `setState` 覆盖业务 store，绕过 action、权限、审计和乐观锁。
- 为全局实体注册可写桥，让页面或控制台任意修改。
- 深拷贝大型 store 作为 `read` 返回值。
- 把 Router Plus 当全局事件总线；业务事件继续走 store action 与订阅。

### 10.5 交互扩展

- `TargetResolver`：按 `{ target, value }` 解析自定义目标，适用于虚拟列表、Shadow DOM、iframe 内元素、画布坐标、第三方组件。
- `HighlightRenderer`：替换默认覆盖层，支持设计系统、阴影 DOM 挂载、多层聚光、自定义动画与布局。
- `TourOptions.beforeStep / afterStep`：异步准备目标、切换 Tab、加载数据后再显示步骤。
- `ScrollOptions.container`：指定抽屉、面板或 ShadowRoot 内的滚动容器。
- 默认覆盖层提供 `mountOverlay(plus, { root })`，`root` 可以是 `document.body`、自定义容器或 ShadowRoot：

```ts
mountOverlay(
  plus: RouterPlus,
  options?: { readonly root?: Document | ShadowRoot | Element },
): () => void;
```
- 复杂多高亮场景由自定义 `HighlightRenderer` 处理；核心仍维护一份主高亮/导览状态，避免状态分叉。
- **新增** `ScrollStrategy`：替换 `scrollTo` 的执行方式，用于分页阅读、虚拟列表和自定义滚动容器；核心只负责解析目标与选择策略。
- **新增** `installDomRuntime(plus, { root })`：注册默认目标解析、聚焦与滚动执行；React/Vue 适配层通过 `RouterPlusOverlay` 调用，无框架场景显式调用。

### 10.6 多实例与微前端

- 一个应用根创建一个 Router Plus 实例；多个独立根使用不同 `globalKey` 和不同覆盖层 root。
- 微前端 shell 负责合并页面目录并创建实例；子模块以插件形式注册自己的 target resolver、状态桥、renderer 和 guard。
- iframe 内的应用使用自己的 Router Plus 实例；跨文档目标由 iframe 内部解析，不在父文档直接操作。
- 页面保留和状态作用域按实例隔离，不跨 shell 共享。

### 10.7 复杂扩展示例

```ts
// 虚拟列表：自定义目标解析
plus.use({
  id: 'virtual-list',
  setup(api) {
    api.registerTargetResolver('virtual-row', {
      async resolve({ value }) {
        await list.scrollToRow(value.rowId);
        return list.elementFor(value.rowId);
      },
    });
  },
});

// Shadow DOM：覆盖层挂进 shadow root
mountOverlay(plus, { root: host.shadowRoot ?? host });

// 外部 store：只读页面切片
const unregister = plus.registerStateBridge('campaign-current', {
  read: () => campaignStore.current,
  subscribe: listener => campaignStore.subscribe(listener),
});
```

### 10.8 边界

- 不提供业务指令注册表；复杂业务流由应用编排，只调用 Router Plus 的导航、状态与交互命令。
- 插件不能绕过页面目录、参数校验、目标解析和结果码语义。
- 如果出现新的**通用页面能力**，应进入核心（minor）而不是作为业务插件；插件只扩展实现细节。
- 页面目录不支持运行期动态增删；需要不同目录时重建实例或按微前端 root 拆分。

## 11. 目录与导出

```text
packages/router-plus/
├── package.json
├── tsconfig.json
├── tsconfig.cjs.json
├── src/
│   ├── core/
│   │   ├── types.ts          # PageDefinition / Context / Target / Command / Event
│   │   ├── pages.ts          # 页面目录、definePages
│   │   ├── target.ts         # PageTarget 解析、页面链接
│   │   ├── plan.ts           # 计划执行与端口分派
│   │   ├── context.ts        # resolvePageContext
│   │   ├── guards.ts         # 守卫管线
│   │   ├── state.ts          # 状态契约、内存实现、版本迁移
│   │   ├── instance.ts       # instanceKey、历史状态、保留决策
│   │   ├── interaction/
│   │   │   ├── targets.ts    # TargetRef、注册表、解析编排
│   │   │   ├── highlight.ts  # 高亮状态机
│   │   │   ├── tour.ts       # 导览状态机
│   │   │   └── focus.ts      # 聚焦与滚动
│   │   ├── commands.ts       # RouterCommand、execute、CommandResult
│   │   ├── events.ts         # 订阅与事件
│   │   ├── global.ts         # window 挂载与门面
│   │   ├── plugins.ts        # 通用扩展注册
│   │   └── version.ts        # apiVersion 与兼容检查
│   ├── dom/
│   │   ├── target-resolver.ts # data-router-plus-target / selector / MutationObserver
│   │   ├── overlay.ts         # 默认遮罩、聚光、提示框、定位
│   │   └── styles.css         # 中性默认样式与 CSS 变量
│   ├── react/
│   │   ├── index.ts
│   │   ├── provider.tsx
│   │   ├── hooks.ts
│   │   ├── link.tsx
│   │   ├── redirect.tsx
│   │   ├── outlet.tsx
│   │   ├── routes.tsx
│   │   ├── overlay.tsx
│   │   └── retention.tsx
│   ├── vue/
│   │   ├── index.ts
│   │   ├── plugin.ts
│   │   ├── composables.ts
│   │   ├── link.ts
│   │   ├── redirect.ts
│   │   ├── view.ts
│   │   ├── routes.ts
│   │   └── overlay.ts
│   ├── stores/
│   │   ├── pinia.ts
│   │   ├── vuex.ts
│   │   ├── redux.ts
│   │   ├── zustand.ts
│   │   ├── jotai.ts
│   │   └── mobx.ts
│   ├── testing/
│   │   ├── memory-ports.ts
│   │   └── memory-pages.ts
│   └── index.ts              # 仅导出 core
├── test/
└── docs/
    └── design-plan.md
```

```json
{
  ".": "framework-agnostic core",
  "./react": "React adapter",
  "./vue": "Vue adapter",
  "./overlay": "default DOM target resolver / highlight overlay",
  "./overlay.css": "neutral overlay styles",
  "./stores/pinia": "Pinia page-state adapter",
  "./stores/vuex": "Vuex page-state adapter",
  "./stores/redux": "Redux page-state adapter",
  "./stores/zustand": "Zustand page-state adapter",
  "./stores/jotai": "Jotai page-state adapter",
  "./stores/mobx": "MobX page-state adapter",
  "./testing": "memory pages / ports"
}
```

**调整 11**

- `core/target.ts` 改名 `core/navigate-target.ts`，与 `core/interaction/targets.ts`（交互目标）区分，避免两个 target 概念混用。
- 新增 `core/link.ts`（`LinkProtocol` 注册与解析）、`core/actions.ts`（`NavigationActionHandler` 注册）、`core/location.ts`（地址回灌与 history state 编解码）。
- `core/interaction/focus.ts` 只保留策略选择与状态，不直接调用 `element.focus()` / `scrollIntoView`；DOM 执行放到 `dom/scroll.ts`。
- `dom/` 新增 `scroll.ts` 与 `dom-runtime.ts`（`installDomRuntime`）。
- `react/hooks.ts` 增加 `usePageMatch / usePageQuery`；`react/link.tsx` 增加 `fallback` 与业务动作渲染；Vue 的 `composables.ts`、`link.ts` 同步。
- 导出保持不变，`./overlay` 额外导出 `installDomRuntime`。

## 12. 构建与依赖

- 双格式构建：ESM + CJS，`exports` 同时提供 `types / import / require`。
- `sideEffects: false`；核心与适配器按子入口 tree-shaking。
- 公开包配置：`publishConfig.access: "public"`、`files: ["dist", "LICENSE"]`、`license`、`keywords`，不设置 `private`。
- `environment: "universal"`：核心可在浏览器与 Node/SSR 使用，不导入 `node:` 模块。
- `./overlay` 与 `./overlay.css` 仅浏览器使用；核心入口不导入 DOM 实现。React/Vue 适配层自动挂载默认覆盖层，vanilla/控制台场景可显式调用 `mountOverlay(plus)`。
- `react`、`react-router-dom`、`vue`、`vue-router` 以及状态管理库全部作为可选 peer dependency。
- 包内 `devDependencies` 安装框架与测试所需库，用于构建、类型检查和 `check:workspace` 导入检查。
- 所有入口在模块加载时不访问 `window` / `document`；全局挂载只在浏览器创建实例时执行。
- 发布后以 npm 版本安装，升级遵循 semver；首版按 `1.0.0`。

### 12.1 版本与兼容

- `createRouterPlus({ apiVersion })` 声明应用期望的契约版本；不匹配时启动报错。
- 未知命令 kind 返回 `unsupported-command`；未知状态 key 返回 `state-unknown`；未知页面返回 `unknown-page`；未知字段忽略。
- 新增页面、命令字段、扩展点属于 minor；删除导出、改变既有语义或收紧参数才允许 major。
- 页面目录在实例创建时固定；需要不同目录时重建实例或按微前端 root 拆分。
- 页面状态版本由 `PageStateDefinition.version / migrate` 管理；委托桥的版本迁移由桥自己负责。

**调整 12**

- `sideEffects` 改为 `["**/*.css"]`：原 `false` 会让打包器丢弃 `overlay.css`。
- `environment` 保持 `"universal"`，但前提是按调整 11 把 DOM 执行移出 `core`；`./overlay` 仍仅浏览器使用，`focus / scrollTo` 在未安装 DOM 运行时返回 `dom-unavailable`。
- `react / react-router-dom / vue / vue-router` 及状态管理库声明为可选 peer，并在 `peerDependenciesMeta` 标记 `optional: true`。
- 包需要登记进 `packages/catalog.json`；`consumers` 由实际接入的应用登记，接入方在自己的 `package.json` 显式声明 `@jangts/router-plus`，否则 `check:workspace` 会报未声明依赖。
- `apiVersion` 为整数 `1`，与包 semver `1.0.0` 分开；升级检查只比较整数契约版本。

## 13. 测试

- 核心：目标解析、页面链接往返、参数与查询校验、Tab、实例键、守卫顺序、结果码、取消传播。
- 状态：`owned` 内存/session 适配器、`delegated` 命名桥读写/订阅/快照、只读桥的 `state-readonly`、异步写入/失败、事件去重、版本迁移、跨实例隔离。
- 交互：目标解析顺序、`waitForTarget`、虚拟列表 getter、自定义 `TargetResolver`、Shadow DOM、高亮状态机、导览步骤与 `awaitUser`、聚焦/滚动、页面切换清理。
- 插件：依赖排序、重复注册、异步 setup 的 `not-ready`、`unuse` 清理、动态安装。
- 多实例：不同 `globalKey`、覆盖层 root、页面目录静态组合、状态隔离。
- 覆盖层：默认 DOM 渲染、定位与重新计算、`Escape`、`aria-live`、`prefers-reduced-motion`、自定义 renderer。
- 全局：浏览器挂载、门面只暴露允许的 API、SSR 不挂载、`detachGlobal`、控制台高亮/导览。
- 路由记录：两端生成 name/path/meta/嵌套/布局/懒加载。
- 适配器：React/Vue 共享 conformance；导出清单对比。
- 状态管理适配：用假 store 或最小真实 store 验证契约。
- 不包含浏览器视觉测试；页面外观由使用方验收。

**调整 13 新增用例**

- 地址回灌：`connect` 后立即回灌一次；直链进入、`popstate` 前进/后退、外部 `pushState` 都产生 `location` 事件并更新 `getContext()`。
- 历史状态：`executePlan` 合并 `options.state`；`routerPlus` 结构完整；实例释放后 Tab 回退。
- 目标解析：字符串路径、`{ path, tab }`、`{ page, params }` 三种形式结果一致；字符串不会被当作页面 id。
- 页面链接：配置的 scheme 与参数名往返；拒绝组件、凭据、端口、hash、重复键与未登记 Tab。
- 未登记路径：路径不在页面目录时返回 `pageId: null` 的页面计划；`{ page }` 未登记返回 `unknown-page`。
- 业务动作：`{ kind: 'action' }` 渲染按钮并调用处理器；未注册返回 `unknown-action`；解析失败按 `fallback` 渲染纯文本。
- 保留：同一页面多个实例并存、隐藏与恢复；`retain: { max }` 按最久未访问释放；释放后按 `state.initial` 重建。
- 两端 conformance 覆盖新钩子：`usePageMatch`、`usePageQuery`、`LinkProtocol`、`NavigationAction`、地址回灌。

## 14. 与业务层的边界

**原 14（已移出本文）**

原稿的迁移章节描述的是具体应用的文件替换与迁移顺序。这类内容属于应用仓库自己的迁移说明，不再保留在 Router Plus 文档中。

**调整 14**

- Router Plus 只接收调用方传入的 `PageDefinition[]` 与 `Target`，不读取、不推断路由文件位置。
- 路由目录、路径白名单、权限、页面外壳、状态归属与历史状态旧键兼容，全部由调用方维护。
- 业务命令的 route / store / payload 校验、未保存确认与提示文案，由调用方在调用 `plus.navigate` 之前完成。
- 包内只做契约校验：非法路径段、危险协议、凭据、重复参数、Tab 不存在、`{ page }` 未登记；失败时返回 `null` 或对应结果码，不产生副作用。
- 应用如何迁移到 Router Plus、替换哪些文件、是否继续维护自己的路由表，均由应用自己决定，本文不提供迁移步骤。

## 15. 评估重点

1. **职责边界**：导航 + 页面状态是否足以覆盖页面控件与业务桥的全部基础需求？是否还有应下沉的通用能力？
2. **命令集**：`navigate / replace / back / forward / go / tab.set / state.set|patch|reset|read / context.read / highlight.set|clear / tour.start|next|prev|stop / focus / scroll.to / retain / release` 是否完整、是否有冗余？
3. **控制台暴露**：默认挂载 `window.__ROUTER_PLUS__` 是否安全？门面 API 是否足够且不泄露内部实现？
4. **状态所有权**：`owned / delegated / external` 三档是否清晰？控制台全局读写只限当前页面是否够用？只读 bridge 与 `state-readonly` 是否表达完整？
5. **React DOM 保留**：`Activity`、缓存 Outlet、仅状态保留如何选择？是否只承诺行为一致而不承诺同一机制？
6. **两端对齐**：conformance 与导出清单对比是否足以保证 React / Vue 一致？
7. **扩展范围**：只开放链接协议、状态适配器、守卫、保留和路由转换是否足够？是否真的不需要业务指令扩展？
8. **接入成本**：调用方删除自实现路由后，业务层需要改多少调用点？
9. **SSR**：历史状态、Tab、状态恢复在服务端渲染时的规则是否明确？
10. **版本**：命令集与页面目录如何做向前兼容？未知字段、未知页面如何处理？
11. **目标解析**：`data-router-plus-target` + 注册表 + selector/element 的优先级是否足够？虚拟列表、异步渲染和重复 target 如何处理？
12. **覆盖层**：默认 DOM 覆盖层是否应由包提供？聚光、定位、`aria-live`、`Escape`、`prefers-reduced-motion` 和自定义 renderer 的边界是否清晰？
13. **导览语义**：`awaitUser`、`advanceOn: 'click'`、页面导航时结束导览是否符合通用页面需求？是否需要步骤级 `beforeStep` 钩子？
14. **复杂插件**：`requires / before`、异步 `setup`、动态 `use / unuse`、重复注册与清理是否足以支撑复杂扩展？
15. **复杂目标**：自定义 `TargetResolver` 能否覆盖虚拟列表、Shadow DOM、iframe、画布和第三方组件？解析器返回 Promise 的边界是否清晰？
16. **复杂状态**：异步 `write / snapshot / restore`、只读桥、外部 store 切片是否足够？是否需要事务或冲突合并接口？
17. **微前端**：页面目录静态组合、每 root 一个实例、不同 `globalKey` 和覆盖层 root 是否满足多团队并行开发？是否需要运行期页面注册？
18. **外部状态集成**：selectors、store actions、异步写入、只读切片、事件去重和页面实例生命周期是否足够？是否需要事务、乐观更新或冲突合并的通用 helper？

**调整 15：本轮已决定项**

1. **职责边界**：导航 + 页面状态 + 页面交互足够；业务动作通过 `NavigationAction` 扩展，不进入核心命令集。
2. **命令集**：保留原命令，新增 `tab.read`；不新增业务命令。
3. **控制台暴露**：`pages` 使用脱敏 `PageCatalog`；不暴露 `meta`、组件、视觉配置与业务 handler。
4. **状态所有权**：调用方只对真正按实例隔离的 UI 状态使用 `delegated` 桥；全局单例 store 不接桥。
5. **React DOM 保留**：`Activity` 按实例键多实例并存；只承诺保留决策一致，不承诺与 Vue 同一机制。
6. **两端对齐**：共享 conformance 与导出清单对比，覆盖新增钩子与地址回灌。
7. **扩展范围**：在原有扩展点上增加 `NavigationAction` 与 `ScrollStrategy`；仍不开放业务命令扩展。
8. **接入成本**：调用方只需提供 `PageDefinition[]`、`Target` 与适配层端口；路由文件组织与迁移步骤不在包内。
9. **SSR**：核心不接触 DOM；Tab 与历史状态由适配层回灌；服务端不挂载全局门面。
10. **版本**：整数 `apiVersion: 1`；未知命令返回 `unsupported-command`，`{ page }` 未登记返回 `unknown-page`，路径型目标按目录仅决定 `pageId` 是否为 `null`，未知字段忽略。
11. **目标解析**：id、注册表、`data-router-plus-target`、显式 selector、element 五级；字符串只按 id 解释，不按 selector。
12. **覆盖层**：包提供中性默认实现；调用方通过自定义 `HighlightRenderer` 适配自身视觉，样式不写入包内。
13. **导览语义**：保留 `awaitUser` 与 `advanceOn: 'click'`；页面导航默认结束导览，保留页面返回后不自动恢复。
14. **复杂插件**：`requires / before` 排序、异步 `setup`、运行期 `use / unuse`、重复注册报错与卸载清理全部保留。
15. **复杂目标**：`TargetResolver` 可返回 Promise，但只允许在命令执行期异步；`resolveTarget` 本身保持同步。
16. **复杂状态**：桥支持异步 `write / snapshot / restore`；不提供跨 store 事务与自动冲突合并。
17. **微前端**：页面目录在 shell 静态组合，每个 root 一个实例与一个覆盖层 root。
18. **外部状态集成**：选择器、store action、只读切片、事件去重与页面实例生命周期按 10.4 执行。

## 16. 结论

Router Plus 应保持为**纯路由 + 页面状态**的通用库，但页面状态包含完整的页面交互状态：

- 核心零依赖，只有页面导航与页面状态两类能力；
- 页面状态明确区分 `owned`（Router Plus 创建）、`delegated`（组件/业务 store 持有，委托 Router Plus 管理）和 `external`（业务 store 自管）；`delegated` 以命名切片接入 Pinia/Vuex/Redux/Zustand/Jotai/MobX，读写走 store action，异步写入等待完成，始终只有一个 source of truth；Router Plus 不做第二个全局 store，控制台只读写当前页面实例；
- 高亮、导览、聚焦、滚动由 Router Plus 统一持有状态、目标和覆盖层，组件只标记 `data-router-plus-target`；
- 页面控件、视图、业务桥和控制台都通过同一套 `execute(command)` / 类型化接口调用；
- 业务前端只在需要跳转、切 Tab、读写页面状态、高亮目标或推进导览时调用 Router Plus，业务指令与业务内容全部留在业务侧；
- React 与 Vue 提供一致的能力与接口，共享 conformance；
- 浏览器默认挂载 `window.__ROUTER_PLUS__`，支持全局调试、直接导航、读写状态和发起高亮/导览；
- 复杂扩展通过插件扩展实现细节：链接协议、目标解析、覆盖层、状态适配、守卫、保留、路由转换；不新增业务命令。
- 微前端按 root 拆分实例，页面目录在 shell 创建时静态组合；子模块以插件注册自己的解析器、状态桥和 renderer。

**调整 16：定稿结论**

- **路径优先**：字符串目标就是站内路径或 href，`PageDefinition.id` 缺省等于 `path`；`{ page, params }` 只是可选写法。
- **地址回灌是必需契约**：`RouterPlusPorts.subscribe` 为必填，`connect` 后立即回灌一次，直链、前进/后退和外部 `pushState` 都进入同一上下文。
- **手写路由是一等路径**：生成器是可选项，调用方可以继续使用自己的路由表与页面外壳。
- **业务动作链接**：`NavigationAction` 让站内链接可以渲染成按钮；业务动作不进入导航计划，也不变成业务命令。
- **路径型目标不做业务白名单**：路径不在页面目录时 `pageId` 为 `null`；`{ page }` 未登记返回 `unknown-page`。
- **协议与业务数据留在调用方**：`LinkProtocol` 与页面 Tab 表由调用方注册和提供，包内不复制业务数据。
- **不提供迁移步骤**：包只定义契约；应用如何替换自己的路由实现、保留哪些文件，由应用自己维护。

评估通过后，创建 `package.json`、登记 `packages/catalog.json`、更新根 lockfile，并按调整 11 的目录拆分进入实现。
