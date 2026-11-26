---
title: "核心类型"
outline: [2, 3]
---

# 核心类型

页面定义、目标、命令回执、连接、插件与交互合同。应用通常只实现 `PageDefinition` 与少量连接或插件接口，其余类型用于标注回执和扩展点。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`ParamValidator`](#api-paramvalidator) | 类型别名 | 单参数校验函数；返回 `true` 或错误消息，返回字符串表示非法。 |
| [`ParamSchema`](#api-paramschema) | 类型别名 | 按路径参数名登记的可选校验表。 |
| [`StateField`](#api-statefield) | 接口 | 页面导航状态声明。原生 hooks 的登记配置使用 StateBindingOptions。 |
| [`StateValueOptions`](#api-statevalueoptions) | 接口 | 一个完整字段的 QS、枚举与编解码配置；字段内部不递归展开。 |
| [`StateBindingOptions`](#api-statebindingoptions) | 类型别名 | 原生初值之外的 ID、QS、枚举与整组编解码配置。 |
| [`StateIdOrOptions`](#api-stateidoroptions) | 类型别名 | 可选登记参数：字符串 ID 或有 ID 的配置对象。 |
| [`StateAccessor`](#api-stateaccessor) | 接口 | 保留原生来源 receiver 的 get／可选 set 完整值访问器。 |
| [`StateInspection`](#api-stateinspection) | 接口 | 已登记来源的只读能力元数据，不含实时值或函数引用。 |
| [`QueryRecord`](#api-queryrecord) | 类型别名 | Encoded query groups preserve repeated values and explicitly owned keys. |
| [`QueryEncoding`](#api-queryencoding) | 类型别名 |  |
| [`PageTab`](#api-pagetab) | 接口 | 普通 tab 状态的兼容声明。 |
| [`InstanceKeyStrategy`](#api-instancekeystrategy) | 类型别名 | 页面实例身份策略：pathname、page、指定参数或自定义函数。 |
| [`PageGuards`](#api-pageguards) | 接口 | 页面级离开、进入、进入后与保留生命周期守卫。 |
| [`GuardContext`](#api-guardcontext) | 接口 | 守卫收到的页面上下文、页面定义与取消信号。 |
| [`GuardResult`](#api-guardresult) | 类型别名 | 守卫决定：放行、拒绝、重定向或带消息阻止。 |
| [`PageDefinition`](#api-pagedefinition) | 接口 | 调用方声明的页面定义；路由树与组件仍归应用。 |
| [`PageCatalogEntry`](#api-pagecatalogentry) | 接口 | 只含安全元数据的页面投影。 |
| [`QueryPairs`](#api-querypairs) | 类型别名 | 保留重复项与顺序的多值查询对。 |
| [`RouterLocation`](#api-routerlocation) | 接口 | 地址快照，含历史条目身份与框架匹配。 |
| [`PageContext`](#api-pagecontext) | 接口 | 当前页面上下文，包含页面、参数、查询、Tab 与实例。 |
| [`PageInstance`](#api-pageinstance) | 接口 | 页面实例身份；页面 id、实例 key、状态 key 与历史条目彼此独立。 |
| [`PageMatch`](#api-pagematch) | 接口 | 一个地址与页面目录匹配的结果。 |
| [`PageCatalog`](#api-pagecatalog) | 接口 | 只读页面目录。 |
| [`PageTarget`](#api-pagetarget) | 类型别名 | 导航目标：路径字符串、路径对象、地址对象或页面对象。 |
| [`LinkTarget`](#api-linktarget) | 类型别名 | 导航目标加显式业务 action。 |
| [`LinkResolution`](#api-linkresolution) | 类型别名 | 链接解析结果：页面、外部地址或 action。 |
| [`NavigationPlan`](#api-navigationplan) | 类型别名 | 不包含业务 action 的导航计划。 |
| [`NavigateOptions`](#api-navigateoptions) | 接口 | 传给底层 Router 的导航选项。 |
| [`ConnectionCapabilities`](#api-connectioncapabilities) | 接口 | 连接声明的原生拦截、遍历与历史观察能力。 |
| [`CommitRequest`](#api-commitrequest) | 接口 | 交给框架连接的真实提交请求。 |
| [`CommitStatus`](#api-commitstatus) | 类型别名 | 一次提交的状态。 |
| [`CommitResult`](#api-commitresult) | 接口 | 真实提交回执，成功时包含实际地址。 |
| [`CommittedChange`](#api-committedchange) | 接口 | 一次已提交的地址变化及其来源。 |
| [`RouterConnection`](#api-routerconnection) | 接口 | 框架导航端口：初始快照、提交、订阅与可选遍历。 |
| [`CommandReason`](#api-commandreason) | 类型别名 | 命令失败原因枚举。 |
| [`CommandSuccess`](#api-commandsuccess) | 接口 | 命令成功结果。 |
| [`CommandFailure`](#api-commandfailure) | 接口 | 命令失败结果，可带阶段与是否已提交。 |
| [`CommandResult`](#api-commandresult) | 类型别名 | 命令结果联合类型。 |
| [`CommandSequenceOptions`](#api-commandsequenceoptions) | 接口 | 编组的整组超时和取消信号。 |
| [`CommandSequenceResult`](#api-commandsequenceresult) | 类型别名 | 编组的逐步回执及失败位置。 |
| [`NavigationStatus`](#api-navigationstatus) | 类型别名 | 导航状态。 |
| [`NavigationResult`](#api-navigationresult) | 接口 | 带上下文、阶段、重定向与错误的导航结果。 |
| [`RouterCommand`](#api-routercommand) | 类型别名 | 可执行命令联合类型；typed 方法与 `execute` 共用处理器。 |
| [`RouterEvent`](#api-routerevent) | 类型别名 | 实例事件：地址、导航、Tab、状态、交互、保留与释放。 |
| [`TargetAnchor`](#api-targetanchor) | 类型别名 | DOM 元素或几何锚点；canvas 区域也可作为目标。 |
| [`TargetRef`](#api-targetref) | 类型别名 | 交互目标引用：id、选择器、元素、矩形或命名解析器输入。 |
| [`HighlightPlacement`](#api-highlightplacement) | 类型别名 | 高亮提示相对目标的位置。 |
| [`HighlightOptions`](#api-highlightoptions) | 接口 | 高亮消息、位置、聚光、超时、持续时间与交互选项。 |
| [`HighlightState`](#api-highlightstate) | 接口 | 当前高亮状态。 |
| [`TourStep`](#api-tourstep) | 接口 | 导览步骤：目标、消息与推进方式。 |
| [`TourState`](#api-tourstate) | 接口 | 当前导览状态。 |
| [`TourOptions`](#api-touroptions) | 接口 | 导览回调、键盘、关闭与步骤前后钩子。 |
| [`FocusOptions`](#api-focusoptions) | 接口 | 聚焦选项。 |
| [`ScrollOptions`](#api-scrolloptions) | 接口 | 滚动行为、对齐、偏移与容器选项。 |
| [`TargetResolver`](#api-targetresolver) | 接口 | 自定义目标解析器。 |
| [`HighlightRenderer`](#api-highlightrenderer) | 接口 | 高亮渲染器；挂载、渲染与销毁由覆盖层驱动。 |
| [`TargetRuntime`](#api-targetruntime) | 接口 | DOM 目标运行时：解析、聚焦与滚动。 |
| [`ScrollStrategy`](#api-scrollstrategy) | 接口 | 自定义滚动策略，可处理非原生滚动容器。 |
| [`LinkProtocol`](#api-linkprotocol) | 接口 | 链接协议解析器；同步解析且不执行副作用。 |
| [`NavigationActionHandler`](#api-navigationactionhandler) | 接口 | 业务 action 处理器。 |
| [`NavigationActionRegistration`](#api-navigationactionregistration) | 接口 | action 注册项。 |
| [`PageStateBridge`](#api-pagestatebridge) | 接口 | delegated 状态桥；读写仍由调用方的状态库拥有。 |
| [`RouterPlusPluginApi`](#api-routerpluspluginapi) | 接口 | 插件可用的注册接口。 |
| [`GlobalGuard`](#api-globalguard) | 接口 | 全局离开或进入守卫。 |
| [`RetentionStrategy`](#api-retentionstrategy) | 接口 | 页面保留与淘汰策略。 |
| [`RouterPlusPlugin`](#api-routerplusplugin) | 接口 | 插件声明：id、依赖、安装顺序与 setup。 |
| [`RouteTransformer`](#api-routetransformer) | 接口 | 原生路由记录转换器。 |
| [`RouterSnapshot`](#api-routersnapshot) | 接口 | SSR 与 hydration 使用的快照。 |
| [`InstanceHost`](#api-instancehost) | 接口 | 框架适配层上报的实例宿主生命周期。 |
| [`PageLinkOptions`](#api-pagelinkoptions) | 接口 | 语义页面链接的 scheme 与字段配置。 |
| [`CreateRouterPlusOptions`](#api-createrouterplusoptions) | 接口 | `createRouterPlus` 的构造选项。 |
| [`RouterPlusHotModule`](#api-routerplushotmodule) | 接口 | 实例所属模块提供的热更新清理合同。 |
| [`RouterPlus`](#api-routerplus) | 接口 | 主实例合同。 |
| [`RouterPlusGlobal`](#api-routerplusglobal) | 接口 | 浏览器调试门面合同；不构成权限边界。 |

## ParamValidator {#api-paramvalidator}

单参数校验函数；返回 `true` 或错误消息，返回字符串表示非法。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type ParamValidator = (value: string) => boolean | string;
```

#### 调用

```ts
ParamValidator(value: string): boolean | string
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | 必需 | — |

**返回：** `string \| boolean`

## ParamSchema {#api-paramschema}

按路径参数名登记的可选校验表。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type ParamSchema<P> = Readonly<
  Partial<Record<keyof P & string, ParamValidator>>
>;
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |

## StateField {#api-statefield}

页面导航状态声明。原生 hooks 的登记配置使用 StateBindingOptions。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface StateField<S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `observe` | `((refresh: () => void) => () => void) \| undefined` | 可省略 | Subscribe to external rule dependencies; the registration owns synchronous cleanup. |
| `ready` | `(() => boolean) \| undefined` | 可省略 | Defer address restoration and writes until application dependencies are available. |
| `history` | `"replace" \| "push" \| undefined` | 可省略 | History entries produced by native changes. Default: replace. |
| `omitDefault` | `boolean \| undefined` | 可省略 | Omit values equal to their captured default from the address. Default: false. |
| `default` | `S \| undefined` | 可省略 | 见类型定义。 |
| `values` | `readonly S[] \| undefined` | 可省略 | 见类型定义。 |
| `validate` | `((value: unknown) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `query` | `string \| boolean \| readonly string[] \| undefined` | 可省略 | 见类型定义。 |
| `encode` | `((value: S) => QueryEncoding) \| undefined` | 可省略 | 见类型定义。 |
| `decode` | `((raw: string) => S) \| undefined` | 可省略 | 见类型定义。 |
| `fields` | `Readonly<Record<string, StateField<unknown>>> \| undefined` | 可省略 | 见类型定义。 |

## StateValueOptions {#api-statevalueoptions}

一个完整字段的 QS、枚举与编解码配置；字段内部不递归展开。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface StateValueOptions<S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `omitDefault` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `query` | `string \| boolean \| undefined` | 可省略 | 见类型定义。 |
| `values` | `readonly S[] \| undefined` | 可省略 | 见类型定义。 |
| `validate` | `((value: unknown) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `encode` | `((value: S) => string \| undefined) \| undefined` | 可省略 | 见类型定义。 |
| `decode` | `((raw: string) => S) \| undefined` | 可省略 | 见类型定义。 |

## StateBindingOptions {#api-statebindingoptions}

原生初值之外的 ID、QS、枚举与整组编解码配置。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `StateBindingOptions<S>`

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `observe` | `((refresh: () => void) => () => void) \| undefined` | 可省略 | Notify changes to external readiness, validation or codec dependencies without polling. |
| `ready` | `(() => boolean) \| undefined` | 可省略 | Defer address restoration and writes until application dependencies are available. |
| `history` | `"replace" \| "push" \| undefined` | 可省略 | History entries produced by native changes. Default: replace. |
| `omitDefault` | `boolean \| undefined` | 可省略 | Omit values equal to their captured default from the address. Default: false. |
| `id` | `string` | 必需 | 见类型定义。 |
| `query` | `string \| boolean \| readonly string[] \| undefined` | 可省略 | 见类型定义。 |
| `values` | `readonly S[] \| undefined` | 可省略 | 见类型定义。 |
| `validate` | `((value: unknown) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `encode` | `((value: S) => QueryEncoding) \| undefined` | 可省略 | 见类型定义。 |
| `decode` | `((query: S extends readonly unknown[] ? string : S extends (...args: never[]) => unknown ? string : S extends object ? URLSearchParams : string) => S) \| undefined` | 可省略 | 见类型定义。 |
| `fields` | `Partial<{ readonly [K in keyof S]: StateValueOptions<S[K]>; }> \| undefined` | 可省略 | 见类型定义。 |

## StateIdOrOptions {#api-stateidoroptions}

可选登记参数：字符串 ID 或有 ID 的配置对象。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type StateIdOrOptions<S> = string | StateBindingOptions<S>;
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | `unknown` |

## StateAccessor {#api-stateaccessor}

保留原生来源 receiver 的 get／可选 set 完整值访问器。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface StateAccessor<S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | — |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `get` | `() => S` | 必需 | Pure native-value read; methods are invoked with the original receiver. |
| `set` | `((next: S) => void \| Promise<void>) \| undefined` | 可省略 | Optional complete-value business write, without automatic updater semantics. |

## StateInspection {#api-stateinspection}

已登记来源的只读能力元数据，不含实时值或函数引用。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface StateInspection
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | Exact registration ID; arbitrary object field paths are not expanded. |
| `scope` | `"page" \| "global"` | 必需 | Owning registration namespace. |
| `pageId` | `string \| null` | 必需 | Page identity for a page source; null for global sources. |
| `stateKey` | `string \| null` | 必需 | Concrete page instance identity; null for global sources. |
| `parentId` | `string \| null` | 必需 | Explicit parent registration ID for store actions; otherwise null. |
| `capabilities` | `Readonly<{ read: true; write: boolean; call: boolean; }>` | 必需 | Operations supported by the installed adapter, without executing them. |
| `queryKeys` | `readonly string[]` | 必需 | Declared address parameters; never includes their values. |

## QueryRecord {#api-queryrecord}

Encoded query groups preserve repeated values and explicitly owned keys.

**导入：** `@jangts/router-plus`。

### 定义

```ts
type QueryRecord = Readonly<Record<string, string | readonly string[] | undefined>>;
```

## QueryEncoding {#api-queryencoding}

**导入：** `@jangts/router-plus`。

### 定义

```ts
type QueryEncoding = string | URLSearchParams | QueryRecord | undefined;
```

## PageTab {#api-pagetab}

普通 tab 状态的兼容声明。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageTab
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `label` | `string \| undefined` | 可省略 | 见类型定义。 |

## InstanceKeyStrategy {#api-instancekeystrategy}

页面实例身份策略：pathname、page、指定参数或自定义函数。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type InstanceKeyStrategy = 'pathname' | 'page' | { readonly params: readonly string[] } | ((context: PageContext) => string);
```

## PageGuards {#api-pageguards}

页面级离开、进入、进入后与保留生命周期守卫。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageGuards<P, S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `beforeLeave` | `((context: GuardContext<P, S>) => GuardResult \| Promise<GuardResult>) \| undefined` | 可省略 | 见类型定义。 |
| `beforeEnter` | `((context: GuardContext<P, S>) => GuardResult \| Promise<GuardResult>) \| undefined` | 可省略 | 见类型定义。 |
| `afterEnter` | `((context: GuardContext<P, S>) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `onRetain` | `((context: PageContext) => void) \| undefined` | 可省略 | 见类型定义。 |
| `onRestore` | `((context: PageContext) => void) \| undefined` | 可省略 | 见类型定义。 |

## GuardContext {#api-guardcontext}

守卫收到的页面上下文、页面定义与取消信号。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface GuardContext<P, S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `context` | `PageContext` | 必需 | 见类型定义。 |
| `page` | `PageDefinition<P, S>` | 必需 | 见类型定义。 |
| `signal` | `AbortSignal` | 必需 | 见类型定义。 |

## GuardResult {#api-guardresult}

守卫决定：放行、拒绝、重定向或带消息阻止。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type GuardResult = true | false | { redirect: PageTarget } | { message: string };
```

## PageDefinition {#api-pagedefinition}

调用方声明的页面定义；路由树与组件仍归应用。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageDefinition<P, S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | 可省略 | 省略时使用路径模板。 |
| `path` | `string` | 必需 | 路由模板，例如 `/beta/:id`。 |
| `pathAliases` | `readonly string[] \| undefined` | 可省略 | Additional paths for the same page. |
| `title` | `string` | 必需 | 见类型定义。 |
| `params` | `Readonly<Partial<Record<keyof P & string, ParamValidator>>> \| undefined` | 可省略 | 按参数名提供校验函数。 |
| `tabs` | `readonly PageTab[] \| undefined` | 可省略 | 普通 tab 状态的兼容简写；页面原生状态使用 states 与同名来源 ID。 |
| `defaultTab` | `string \| undefined` | 可省略 | 兼容 tab 简写的默认值；普通页面状态默认值声明在 states 中。 |
| `tabInUrl` | `boolean \| undefined` | 可省略 | 兼容 tab 简写的查询开关；原生来源通过 query 配置参数同步。 |
| `states` | `Readonly<Record<string, StateField<unknown>>> \| undefined` | 可省略 | 见类型定义。 |
| `instanceKey` | `InstanceKeyStrategy \| undefined` | 可省略 | 默认按 pathname 区分实例。 |
| `retain` | `boolean \| { readonly max?: number; } \| undefined` | 可省略 | 保留实例；同时保留组件与 DOM 还需要渲染宿主。 |
| `component` | `string \| undefined` | 可省略 | Component key resolved by framework adapters. |
| `parentId` | `string \| undefined` | 可省略 | 见类型定义。 |
| `layout` | `string \| undefined` | 可省略 | 见类型定义。 |
| `guards` | `PageGuards<P, S> \| undefined` | 可省略 | 见类型定义。 |
| `meta` | `Readonly<Record<string, unknown>> \| undefined` | 可省略 | 应用元数据，不通过 `PageCatalog` 暴露。 |

## PageCatalogEntry {#api-pagecatalogentry}

只含安全元数据的页面投影。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageCatalogEntry
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `path` | `string` | 必需 | 见类型定义。 |
| `pathAliases` | `readonly string[] \| undefined` | 可省略 | 见类型定义。 |
| `title` | `string` | 必需 | 见类型定义。 |
| `tabs` | `readonly PageTab[] \| undefined` | 可省略 | 见类型定义。 |
| `defaultTab` | `string \| undefined` | 可省略 | 见类型定义。 |
| `tabInUrl` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `states` | `Readonly<Record<string, StateField<unknown>>> \| undefined` | 可省略 | 见类型定义。 |
| `retain` | `boolean` | 必需 | 见类型定义。 |
| `instanceKey` | `InstanceKeyStrategy \| "custom"` | 必需 | Strategy description only; functions are projected as `'custom'`. |
| `parentId` | `string \| undefined` | 可省略 | 见类型定义。 |

## QueryPairs {#api-querypairs}

保留重复项与顺序的多值查询对。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type QueryPairs = readonly (readonly [string, string])[];
```

## RouterLocation {#api-routerlocation}

地址快照，含历史条目身份与框架匹配。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterLocation
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `pathname` | `string` | 必需 | 见类型定义。 |
| `search` | `string` | 必需 | 见类型定义。 |
| `hash` | `string` | 必需 | 见类型定义。 |
| `state` | `unknown` | 可省略 | 见类型定义。 |
| `entryKey` | `string \| undefined` | 可省略 | Framework history entry identity when available. |
| `revision` | `string \| undefined` | 可省略 | 见类型定义。 |
| `action` | `"replace" \| "push" \| "pop" \| "initial" \| "native" \| undefined` | 可省略 | 见类型定义。 |
| `navigationId` | `string \| undefined` | 可省略 | 见类型定义。 |
| `matched` | `readonly { readonly pageId: string; readonly params: Readonly<Record<string, string>>; }[] \| undefined` | 可省略 | 框架提供的权威匹配优先于推断结果。 |

## PageContext {#api-pagecontext}

当前页面上下文，包含页面、参数、查询、Tab 与实例。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageContext
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `pageId` | `string \| null` | 必需 | 见类型定义。 |
| `title` | `string \| undefined` | 可省略 | 见类型定义。 |
| `path` | `string` | 必需 | 见类型定义。 |
| `pathname` | `string` | 必需 | 见类型定义。 |
| `search` | `string` | 必需 | 见类型定义。 |
| `hash` | `string` | 必需 | 见类型定义。 |
| `params` | `Readonly<Record<string, string>>` | 必需 | 见类型定义。 |
| `query` | `Readonly<Record<string, string>>` | 必需 | 重复查询键请读取 `queryAll`。 |
| `queryAll` | `QueryPairs` | 必需 | 见类型定义。 |
| `tab` | `string \| null` | 必需 | 见类型定义。 |
| `values` | `Readonly<Record<string, unknown>>` | 必需 | 见类型定义。 |
| `instance` | `PageInstance \| null` | 必需 | 见类型定义。 |
| `page` | `PageCatalogEntry \| null` | 必需 | 见类型定义。 |
| `location` | `RouterLocation` | 必需 | 见类型定义。 |

## PageInstance {#api-pageinstance}

页面实例身份；页面 id、实例 key、状态 key 与历史条目彼此独立。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageInstance
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `pageId` | `string` | 必需 | 见类型定义。 |
| `instanceKey` | `string` | 必需 | 见类型定义。 |
| `tab` | `string \| null` | 必需 | 见类型定义。 |
| `stateKey` | `string` | 必需 | 见类型定义。 |
| `historyKey` | `string` | 必需 | 见类型定义。 |
| `retained` | `boolean` | 必需 | 见类型定义。 |

## PageMatch {#api-pagematch}

一个地址与页面目录匹配的结果。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageMatch
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `values` | `Readonly<Record<string, unknown>> \| undefined` | 可省略 | 见类型定义。 |
| `page` | `PageCatalogEntry` | 必需 | 见类型定义。 |
| `params` | `Readonly<Record<string, string>>` | 必需 | 见类型定义。 |
| `query` | `Readonly<Record<string, string>>` | 必需 | 见类型定义。 |
| `queryAll` | `QueryPairs` | 必需 | 见类型定义。 |
| `tab` | `string \| null` | 必需 | 见类型定义。 |

## PageCatalog {#api-pagecatalog}

只读页面目录。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageCatalog
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `entries` | `readonly PageCatalogEntry[]` | 必需 | 见类型定义。 |
| `ids` | `readonly string[]` | 必需 | 见类型定义。 |
| `get` | `(id: string) => PageCatalogEntry \| undefined` | 必需 | 见类型定义。 |
| `byPath` | `(pathname: string) => PageMatch \| null` | 必需 | 见类型定义。 |

## PageTarget {#api-pagetarget}

导航目标：路径字符串、路径对象、地址对象或页面对象。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `PageTarget`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `replace` | `boolean \| { (searchValue: string \| RegExp, replaceValue: string): string; (searchValue: string \| RegExp, replacer: (substring: string, ...args: any[]) => string): string; (searchValue: { [Symbol.replace](string: string, replaceValue: string): string; }, replaceValue: string): string; (searchValue: { [Symbol.replace](string: string, replacer: (substring: string, ...args: any[]) => string): string; }, replacer: (substring: string, ...args: any[]) => string): string; } \| undefined` | 可省略 | Replaces text in a string, using a regular expression or search string. Passes a string and {@linkcode replaceValue} to the `[Symbol.replace]` method on {@linkcode searchValue}. This method is expected to implement its own replacement algorithm. Replaces text in a string, using an object that supports replacement within a string. |

## LinkTarget {#api-linktarget}

导航目标加显式业务 action。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type LinkTarget = PageTarget | { readonly action: string; readonly payload?: unknown };
```

## LinkResolution {#api-linkresolution}

链接解析结果：页面、外部地址或 action。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `LinkResolution`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `kind` | `"page" \| "external" \| "action"` | 必需 | 见类型定义。 |

## NavigationPlan {#api-navigationplan}

不包含业务 action 的导航计划。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `NavigationPlan`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `kind` | `"page" \| "external"` | 必需 | 见类型定义。 |
| `href` | `string` | 必需 | 见类型定义。 |

## NavigateOptions {#api-navigateoptions}

传给底层 Router 的导航选项。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface NavigateOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `replace` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `state` | `unknown` | 可省略 | 见类型定义。 |
| `relative` | `"path" \| "route" \| "index" \| "to" \| "none" \| undefined` | 可省略 | 见类型定义。 |
| `preventScrollReset` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `viewTransition` | `boolean \| undefined` | 可省略 | 见类型定义。 |

## ConnectionCapabilities {#api-connectioncapabilities}

连接声明的原生拦截、遍历与历史观察能力。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface ConnectionCapabilities
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `interception` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `traversal` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `rawHistoryObservation` | `boolean \| undefined` | 可省略 | 见类型定义。 |

## CommitRequest {#api-commitrequest}

交给框架连接的真实提交请求。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CommitRequest
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `navigationId` | `string` | 必需 | 见类型定义。 |
| `href` | `string` | 必需 | 见类型定义。 |
| `path` | `string` | 必需 | 见类型定义。 |
| `tab` | `string \| undefined` | 可省略 | 见类型定义。 |
| `state` | `Record<string, unknown>` | 必需 | 见类型定义。 |
| `options` | `NavigateOptions` | 必需 | 见类型定义。 |
| `signal` | `AbortSignal` | 必需 | 见类型定义。 |

## CommitStatus {#api-commitstatus}

一次提交的状态。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type CommitStatus = 'committed' | 'blocked' | 'cancelled' | 'failed' | 'noop';
```

## CommitResult {#api-commitresult}

真实提交回执，成功时包含实际地址。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CommitResult
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `status` | `CommitStatus` | 必需 | 见类型定义。 |
| `location` | `RouterLocation \| undefined` | 可省略 | 见类型定义。 |
| `message` | `string \| undefined` | 可省略 | 见类型定义。 |
| `error` | `unknown` | 可省略 | 见类型定义。 |

## CommittedChange {#api-committedchange}

一次已提交的地址变化及其来源。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CommittedChange
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `location` | `RouterLocation` | 必需 | 见类型定义。 |
| `source` | `"initial" \| "native" \| "plus" \| "traversal"` | 必需 | 见类型定义。 |
| `navigationId` | `string \| undefined` | 可省略 | 见类型定义。 |

## RouterConnection {#api-routerconnection}

框架导航端口：初始快照、提交、订阅与可选遍历。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterConnection
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `initial` | `RouterLocation` | 必需 | 见类型定义。 |
| `matcher` | `RouteMatcher \| undefined` | 可省略 | Framework matching/building semantics; bound before the initial snapshot is applied. |
| `intercept` | `((check: (target: RouterLocation) => Promise<GuardResult>) => () => void) \| undefined` | 可省略 | Native transition gate; Plus-originated transitions carry an already checked token. |
| `capabilities` | `ConnectionCapabilities \| undefined` | 可省略 | 见类型定义。 |
| `commit` | `(request: CommitRequest) => Promise<CommitResult> \| CommitResult` | 必需 | 见类型定义。 |
| `subscribe` | `(listener: (change: CommittedChange) => void) => () => void` | 必需 | 见类型定义。 |
| `back` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | 可省略 | 见类型定义。 |
| `forward` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | 可省略 | 见类型定义。 |
| `go` | `((delta: number) => Promise<CommitResult> \| CommitResult) \| undefined` | 可省略 | 见类型定义。 |

## CommandReason {#api-commandreason}

命令失败原因枚举。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type CommandReason = | 'invalid-target'
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
  | 'failed'
  | 'timeout'
  | 'superseded'
  | 'noop';
```

## CommandSuccess {#api-commandsuccess}

命令成功结果。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CommandSuccess
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `ok` | `true` | 必需 | 见类型定义。 |
| `value` | `unknown` | 可省略 | 见类型定义。 |

## CommandFailure {#api-commandfailure}

命令失败结果，可带阶段与是否已提交。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CommandFailure
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `ok` | `false` | 必需 | 见类型定义。 |
| `reason` | `CommandReason` | 必需 | 使用 `CommandReason` 区分守卫拒绝、取消、非法目标与缺少能力。 |
| `message` | `string \| undefined` | 可省略 | 见类型定义。 |
| `navigationId` | `string \| undefined` | 可省略 | 见类型定义。 |
| `stage` | `string \| undefined` | 可省略 | 见类型定义。 |
| `committed` | `boolean \| undefined` | 可省略 | 见类型定义。 |

## CommandResult {#api-commandresult}

命令结果联合类型。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `CommandResult`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `ok` | `boolean` | 必需 | 见类型定义。 |

## CommandSequenceOptions {#api-commandsequenceoptions}

编组的整组超时和取消信号。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CommandSequenceOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `timeoutMs` | `number \| undefined` | 可省略 | Total deadline in milliseconds, including source waits and business calls. Default: 10000. |
| `signal` | `AbortSignal \| undefined` | 可省略 | 见类型定义。 |

## CommandSequenceResult {#api-commandsequenceresult}

编组的逐步回执及失败位置。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `CommandSequenceResult`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `ok` | `boolean` | 必需 | 见类型定义。 |
| `results` | `readonly CommandResult[]` | 必需 | 见类型定义。 |

## NavigationStatus {#api-navigationstatus}

导航状态。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type NavigationStatus = 'committed' | 'blocked' | 'cancelled' | 'failed' | 'noop';
```

## NavigationResult {#api-navigationresult}

带上下文、阶段、重定向与错误的导航结果。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface NavigationResult
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `status` | `NavigationStatus` | 必需 | 见类型定义。 |
| `navigationId` | `string` | 必需 | 见类型定义。 |
| `stage` | `string \| undefined` | 可省略 | 见类型定义。 |
| `location` | `RouterLocation \| undefined` | 可省略 | 见类型定义。 |
| `context` | `PageContext \| undefined` | 可省略 | 见类型定义。 |
| `message` | `string \| undefined` | 可省略 | 见类型定义。 |
| `redirected` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `error` | `unknown` | 可省略 | 见类型定义。 |

## RouterCommand {#api-routercommand}

可执行命令联合类型；typed 方法与 `execute` 共用处理器。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `RouterCommand`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `kind` | `"replace" \| "navigate" \| "query.patch" \| "back" \| "forward" \| "go" \| "state.call" \| "tab.set" \| "tab.read" \| "state.set" \| "state.patch" \| "state.reset" \| "state.read" \| "context.read" \| "highlight.set" \| "highlight.clear" \| "tour.start" \| "tour.next" \| "tour.prev" \| "tour.stop" \| "focus" \| "scroll.to" \| "retain" \| "release"` | 必需 | 见类型定义。 |

## RouterEvent {#api-routerevent}

实例事件：地址、导航、Tab、状态、交互、保留与释放。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `RouterEvent`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `type` | `"action" \| "tab" \| "state" \| "retain" \| "release" \| "state.registered" \| "state.unregistered" \| "state.committed" \| "disposed" \| "renderer" \| "location" \| "navigation" \| "highlight" \| "tour"` | 必需 | 见类型定义。 |

## TargetAnchor {#api-targetanchor}

DOM 元素或几何锚点；canvas 区域也可作为目标。

**导入：** `@jangts/router-plus`。

### 定义

**类型别名:** `TargetAnchor`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `getBoundingClientRect` | `(() => DOMRect) \| (() => DOMRectReadOnly)` | 必需 | The **`Element.getBoundingClientRect()`** method returns a DOMRect object providing information about the size of an element and its position relative to the viewport.  [MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/getBoundingClientRect) |

## TargetRef {#api-targetref}

交互目标引用：id、选择器、元素、矩形或命名解析器输入。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type TargetRef = | string
  | { readonly selector: string }
  | { readonly rect: () => DOMRectReadOnly; readonly contextElement?: Element }
  | { readonly element: Element | (() => Element | null) }
  | { readonly target: string; readonly value: unknown };
```

## HighlightPlacement {#api-highlightplacement}

高亮提示相对目标的位置。

**导入：** `@jangts/router-plus`。

### 定义

```ts
type HighlightPlacement = | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'left-top'
  | 'right-top'
  | 'left-bottom'
  | 'right-bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-auto'
  | 'bottom-auto'
  | 'left-auto'
  | 'right-auto'
  | 'auto'
  | 'none';
```

## HighlightOptions {#api-highlightoptions}

高亮消息、位置、聚光、超时、持续时间与交互选项。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface HighlightOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `message` | `string \| undefined` | 可省略 | 见类型定义。 |
| `placement` | `HighlightPlacement \| undefined` | 可省略 | 见类型定义。 |
| `spotlight` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `padding` | `number \| undefined` | 可省略 | 见类型定义。 |
| `scrollIntoView` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `waitForTarget` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `timeout` | `number \| undefined` | 可省略 | 见类型定义。 |
| `duration` | `number \| undefined` | 可省略 | 见类型定义。 |
| `dismissible` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `interactive` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `className` | `string \| undefined` | 可省略 | 见类型定义。 |

## HighlightState {#api-highlightstate}

当前高亮状态。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface HighlightState
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `target` | `TargetRef` | 必需 | 见类型定义。 |
| `element` | `TargetAnchor` | 必需 | 见类型定义。 |
| `message` | `string \| undefined` | 可省略 | 见类型定义。 |
| `placement` | `HighlightPlacement` | 必需 | 见类型定义。 |
| `spotlight` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `padding` | `number \| undefined` | 可省略 | 见类型定义。 |
| `startedAt` | `number` | 必需 | 见类型定义。 |
| `dismissible` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `interactive` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `className` | `string \| undefined` | 可省略 | 见类型定义。 |

## TourStep {#api-tourstep}

导览步骤：目标、消息与推进方式。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface TourStep
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `target` | `TargetRef` | 必需 | 见类型定义。 |
| `message` | `string` | 必需 | 见类型定义。 |
| `placement` | `HighlightPlacement \| undefined` | 可省略 | 见类型定义。 |
| `awaitUser` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `advanceOn` | `"manual" \| "click" \| undefined` | 可省略 | 见类型定义。 |

## TourState {#api-tourstate}

当前导览状态。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface TourState
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | 可省略 | 见类型定义。 |
| `steps` | `readonly TourStep[]` | 必需 | 见类型定义。 |
| `index` | `number` | 必需 | 见类型定义。 |
| `awaiting` | `boolean` | 必需 | 见类型定义。 |
| `active` | `boolean` | 必需 | 见类型定义。 |
| `keyboard` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `dismissible` | `boolean \| undefined` | 可省略 | 见类型定义。 |

## TourOptions {#api-touroptions}

导览回调、键盘、关闭与步骤前后钩子。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface TourOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | 可省略 | 见类型定义。 |
| `dismissible` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `keyboard` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `beforeStep` | `((index: number, step: TourStep) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `afterStep` | `((index: number, step: TourStep) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `onStep` | `((index: number, step: TourStep) => void) \| undefined` | 可省略 | 见类型定义。 |
| `onFinish` | `(() => void) \| undefined` | 可省略 | 见类型定义。 |
| `onCancel` | `(() => void) \| undefined` | 可省略 | 见类型定义。 |

## FocusOptions {#api-focusoptions}

聚焦选项。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface FocusOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `preventScroll` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `restore` | `boolean \| undefined` | 可省略 | 见类型定义。 |

## ScrollOptions {#api-scrolloptions}

滚动行为、对齐、偏移与容器选项。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface ScrollOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `behavior` | `"auto" \| "smooth" \| undefined` | 可省略 | 见类型定义。 |
| `block` | `"start" \| "center" \| "end" \| "nearest" \| undefined` | 可省略 | 见类型定义。 |
| `inline` | `"start" \| "center" \| "end" \| "nearest" \| undefined` | 可省略 | 见类型定义。 |
| `offset` | `number \| undefined` | 可省略 | 见类型定义。 |
| `container` | `string \| Element \| undefined` | 可省略 | 见类型定义。 |

## TargetResolver {#api-targetresolver}

自定义目标解析器。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface TargetResolver
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `resolve` | `(target: { readonly target: string; readonly value: unknown; }, context: PageContext, signal: AbortSignal) => TargetAnchor \| null \| Promise<TargetAnchor \| null>` | 必需 | 见类型定义。 |

## HighlightRenderer {#api-highlightrenderer}

高亮渲染器；挂载、渲染与销毁由覆盖层驱动。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface HighlightRenderer
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `mount` | `(root: Document \| ShadowRoot \| Element) => void` | 必需 | 见类型定义。 |
| `render` | `(state: HighlightState \| null) => void` | 必需 | 见类型定义。 |
| `destroy` | `() => void` | 必需 | 见类型定义。 |

## TargetRuntime {#api-targetruntime}

DOM 目标运行时：解析、聚焦与滚动。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface TargetRuntime
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `resolve` | `(target: TargetRef, context: PageContext, options: { readonly timeout: number; readonly waitForTarget: boolean; readonly signal: AbortSignal; readonly root?: Element \| ShadowRoot; }) => Promise<TargetAnchor \| null>` | 必需 | 见类型定义。 |
| `focus` | `(element: TargetAnchor, options: FocusOptions) => boolean` | 必需 | 见类型定义。 |
| `restoreFocus` | `(() => void) \| undefined` | 可省略 | 见类型定义。 |
| `scroll` | `(element: TargetAnchor, options: ScrollOptions) => void \| Promise<void>` | 必需 | 见类型定义。 |

## ScrollStrategy {#api-scrollstrategy}

自定义滚动策略，可处理非原生滚动容器。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface ScrollStrategy
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `priority` | `number \| undefined` | 可省略 | 见类型定义。 |
| `matches` | `((element: TargetAnchor, options: ScrollOptions, context: PageContext) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `scroll` | `(element: TargetAnchor, options: ScrollOptions, context: PageContext) => void \| Promise<void>` | 必需 | 见类型定义。 |

## LinkProtocol {#api-linkprotocol}

链接协议解析器；同步解析且不执行副作用。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface LinkProtocol
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `scheme` | `string` | 必需 | 见类型定义。 |
| `resolve` | `(value: string, location: RouterLocation) => LinkTarget \| null` | 必需 | 见类型定义。 |

## NavigationActionHandler {#api-navigationactionhandler}

业务 action 处理器。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface NavigationActionHandler
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `button` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `invoke` | `(payload: unknown, context: PageContext) => void \| Promise<void>` | 必需 | 见类型定义。 |

## NavigationActionRegistration {#api-navigationactionregistration}

action 注册项。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface NavigationActionRegistration
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `handler` | `NavigationActionHandler` | 必需 | 见类型定义。 |

## PageStateBridge {#api-pagestatebridge}

delegated 状态桥；读写仍由调用方的状态库拥有。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageStateBridge<S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | `unknown` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `read` | `() => S` | 必需 | 见类型定义。 |
| `call` | `((...args: unknown[]) => unknown \| Promise<unknown>) \| undefined` | 可省略 | 见类型定义。 |
| `write` | `((next: S) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `patch` | `((value: Record<string, unknown>) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `reset` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `subscribe` | `((listener: () => void) => () => void) \| undefined` | 可省略 | 见类型定义。 |
| `snapshot` | `(() => unknown \| Promise<unknown>) \| undefined` | 可省略 | 见类型定义。 |
| `restore` | `((value: unknown) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `whenSettled` | `((signal?: AbortSignal) => void \| Promise<void>) \| undefined` | 可省略 | Await framework publication after a grouped mutation; custom asynchronous work remains app-owned. |

## RouterPlusPluginApi {#api-routerpluspluginapi}

插件可用的注册接口。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterPlusPluginApi
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `registerLinkProtocol` | `(protocol: LinkProtocol) => void` | 必需 | 见类型定义。 |
| `registerGuard` | `(guard: GlobalGuard, options?: { readonly priority?: number; }) => void` | 必需 | 见类型定义。 |
| `registerRetentionStrategy` | `(strategy: RetentionStrategy) => void` | 必需 | 见类型定义。 |
| `registerInstanceKeyStrategy` | `(name: string, strategy: InstanceKeyStrategy) => void` | 必需 | 见类型定义。 |
| `registerTargetResolver` | `(kind: string, resolver: TargetResolver) => void` | 必需 | 见类型定义。 |
| `registerHighlightRenderer` | `(renderer: HighlightRenderer, root?: Document \| ShadowRoot \| Element) => void` | 必需 | 见类型定义。 |
| `registerRouteTransformer` | `(transformer: RouteTransformer) => void` | 必需 | 见类型定义。 |
| `registerNavigationAction` | `(id: string, handler: NavigationActionHandler) => void` | 必需 | 见类型定义。 |
| `registerScrollStrategy` | `(strategy: ScrollStrategy) => void` | 必需 | 见类型定义。 |
| `registerTargetRuntime` | `(runtime: TargetRuntime) => void` | 必需 | 见类型定义。 |

## GlobalGuard {#api-globalguard}

全局离开或进入守卫。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface GlobalGuard
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `beforeLeave` | `((context: PageContext) => GuardResult \| Promise<GuardResult>) \| undefined` | 可省略 | 见类型定义。 |
| `beforeEnter` | `((context: PageContext) => GuardResult \| Promise<GuardResult>) \| undefined` | 可省略 | 见类型定义。 |

## RetentionStrategy {#api-retentionstrategy}

页面保留与淘汰策略。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RetentionStrategy
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `decide` | `(instances: readonly PageInstance[], entering: PageInstance) => readonly string[]` | 必需 | 见类型定义。 |

## RouterPlusPlugin {#api-routerplusplugin}

插件声明：id、依赖、安装顺序与 setup。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterPlusPlugin
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `requires` | `readonly string[] \| undefined` | 可省略 | 见类型定义。 |
| `before` | `readonly string[] \| undefined` | 可省略 | 见类型定义。 |
| `setup` | `(api: RouterPlusPluginApi) => void \| (() => void \| Promise<void>) \| Promise<void \| (() => void \| Promise<void>)>` | 必需 | 见类型定义。 |

## RouteTransformer {#api-routetransformer}

原生路由记录转换器。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouteTransformer
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | 见类型定义。 |
| `transform` | `<T>(routes: readonly T[], context: { readonly framework: "react" \| "vue"; }) => readonly T[]` | 必需 | 见类型定义。 |

## RouterSnapshot {#api-routersnapshot}

SSR 与 hydration 使用的快照。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterSnapshot
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `version` | `1` | 必需 | 见类型定义。 |
| `location` | `RouterLocation` | 必需 | 见类型定义。 |
| `state` | `unknown` | 必需 | 见类型定义。 |

## InstanceHost {#api-instancehost}

框架适配层上报的实例宿主生命周期。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface InstanceHost
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `mount` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `activate` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `deactivate` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `dispose` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `ready` | `(() => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `root` | `(() => Element \| ShadowRoot \| null) \| undefined` | 可省略 | 见类型定义。 |

## PageLinkOptions {#api-pagelinkoptions}

语义页面链接的 scheme 与字段配置。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface PageLinkOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `scheme` | `string` | 必需 | 见类型定义。 |
| `pathKey` | `string \| undefined` | 可省略 | 见类型定义。 |
| `tabKey` | `string \| undefined` | 可省略 | 见类型定义。 |

## CreateRouterPlusOptions {#api-createrouterplusoptions}

`createRouterPlus` 的构造选项。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface CreateRouterPlusOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | 可省略 | 传入实例所属模块的热更新对象；省略或 false 时关闭。 |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | 必需 | 固定的页面定义数组；id 默认取路径模板。 |
| `matcher` | `RouteMatcher \| undefined` | 可省略 | 省略时使用默认匹配器；框架适配会传入原生匹配器。 |
| `origin` | `string \| undefined` | 可省略 | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initialSnapshot` | `RouterSnapshot \| undefined` | 可省略 | 见类型定义。 |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | 可省略 | 见类型定义。 |
| `globalKey` | `string \| false \| undefined` | 可省略 | 浏览器默认暴露调试门面；设为 `false` 关闭。 |
| `apiVersion` | `number \| undefined` | 可省略 | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | 可省略 | 见类型定义。 |
| `pageLink` | `PageLinkOptions \| undefined` | 可省略 | 见类型定义。 |
| `historyStateKey` | `string \| undefined` | 可省略 | 见类型定义。 |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | 可省略 | 见类型定义。 |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | 可省略 | 默认替换最新目标；`serial` 让请求串行执行。 |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `openExternal` | `((href: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initialLocation` | `RouterLocation \| undefined` | 可省略 | SSR 或 hydration 时在连接前建立初始地址。 |

## RouterPlusHotModule {#api-routerplushotmodule}

实例所属模块提供的热更新清理合同。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterPlusHotModule
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `dispose` | `(callback: () => void) => void` | 必需 | 见类型定义。 |

## RouterPlus {#api-routerplus}

主实例合同。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterPlus
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | 必需 | Run existing commands in order, waiting for installed sources and framework publication. |
| `connect` | `(connection: RouterConnection) => () => void` | 必需 | 见类型定义。 |
| `disconnect` | `() => void` | 必需 | 见类型定义。 |
| `connected` | `boolean` | 必需 | 见类型定义。 |
| `hasCustomRenderer` | `boolean` | 必需 | 见类型定义。 |
| `ready` | `Promise<void>` | 必需 | Resolves after the initially configured plugins finish installing. |
| `dispose` | `() => Promise<void>` | 必需 | 断开连接、取消交互、等待宿主与插件清理并使 scope 失效。 |
| `reportLocation` | `(location: RouterLocation) => void` | 必需 | 见类型定义。 |
| `scope` | `(context?: PageContext) => RouterPlus` | 必需 | 返回绑定到指定实例的稳定门面；隐藏实例仍保留自己的上下文。 |
| `whenReady` | `() => Promise<void>` | 必需 | 等待初始安装、bridge 恢复和已排队的宿主生命周期工作。 |
| `snapshot` | `() => Promise<RouterSnapshot>` | 必需 | 捕获地址与支持的显式快照；原生状态 SSR 由应用的状态库负责。 |
| `restore` | `(snapshot: RouterSnapshot) => Promise<void>` | 必需 | 见类型定义。 |
| `transformRoutes` | `<T>(routes: readonly T[], framework: "react" \| "vue") => readonly T[]` | 必需 | 见类型定义。 |
| `use` | `(plugin: RouterPlusPlugin) => Promise<void>` | 必需 | 见类型定义。 |
| `unuse` | `(id: string, options?: { readonly cascade?: boolean; }) => Promise<void>` | 必需 | 见类型定义。 |
| `registerGuard` | `(guard: GlobalGuard, options?: { readonly priority?: number; }) => () => void` | 必需 | Register a global guard (leave/enter) with an optional priority. |
| `navigate` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | 解析目标、执行守卫、提交一次历史并更新上下文与实例。 |
| `replace` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `patchQuery` | `(patch: QueryRecord, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | Patch named query parameters; undefined/empty arrays delete keys and unrelated parts survive. |
| `back` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `forward` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `go` | `(delta: number) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `resolveLink` | `(target: LinkTarget) => LinkResolution \| null` | 必需 | 见类型定义。 |
| `resolveTarget` | `(target: PageTarget) => NavigationPlan \| null` | 必需 | 见类型定义。 |
| `resolveHref` | `(target: PageTarget) => string \| null` | 必需 | 见类型定义。 |
| `match` | `(pathname: string) => PageMatch \| null` | 必需 | 见类型定义。 |
| `getContext` | `() => PageContext` | 必需 | 见类型定义。 |
| `getInstance` | `() => PageInstance \| null` | 必需 | 见类型定义。 |
| `getState` | `<T = unknown>(key?: string) => T` | 必需 | 见类型定义。 |
| `setState` | `(value: unknown, key?: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `patchState` | `(value: Record<string, unknown>, key?: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `resetState` | `(key?: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `callState` | `(id: string, ...args: unknown[]) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `listStateKeys` | `() => readonly string[]` | 必需 | 见类型定义。 |
| `inspectState` | `{ (): readonly StateInspection[]; (id: string): StateInspection \| null; }` | 必需 | Describe installed sources visible to this facade without reading native values. Describe one exact ID; unknown IDs and unmounted address declarations return null. |
| `getTab` | `() => string \| null` | 必需 | 见类型定义。 |
| `setTab` | `(tab: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `retain` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `release` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `registerHost` | `(host: InstanceHost) => () => void` | 必需 | 见类型定义。 |
| `registerTarget` | `(id: string, resolve: () => TargetAnchor \| null) => () => void` | 必需 | 见类型定义。 |
| `unregisterTarget` | `(id: string) => void` | 必需 | 见类型定义。 |
| `listTargets` | `() => readonly string[]` | 必需 | 见类型定义。 |
| `highlight` | `(target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `clearHighlight` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `getHighlight` | `() => HighlightState \| null` | 必需 | 见类型定义。 |
| `startTour` | `(steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `nextTourStep` | `(step?: number) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `prevTourStep` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `stopTour` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `getTour` | `() => TourState \| null` | 必需 | 见类型定义。 |
| `focus` | `(target: TargetRef, options?: FocusOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `scrollTo` | `(target: TargetRef, options?: ScrollOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `registerNavigationAction` | `(id: string, handler: NavigationActionHandler) => () => void` | 必需 | 见类型定义。 |
| `executeAction` | `(actionId: string, payload?: unknown) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `subscribe` | `(listener: (event: RouterEvent) => void) => () => void` | 必需 | 见类型定义。 |
| `pages` | `PageCatalog` | 必需 | 见类型定义。 |
| `version` | `string` | 必需 | 见类型定义。 |
| `apiVersion` | `number` | 必需 | 见类型定义。 |

## RouterPlusGlobal {#api-routerplusglobal}

浏览器调试门面合同；不构成权限边界。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouterPlusGlobal
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | 必需 | 见类型定义。 |
| `navigate` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `patchQuery` | `(patch: QueryRecord, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `getContext` | `() => PageContext` | 必需 | 见类型定义。 |
| `getState` | `<T = unknown>(key?: string) => T` | 必需 | 见类型定义。 |
| `setState` | `(value: unknown, key?: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `patchState` | `(value: Record<string, unknown>, key?: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `resetState` | `(key?: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `callState` | `(id: string, ...args: unknown[]) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `listStateKeys` | `() => readonly string[]` | 必需 | 见类型定义。 |
| `getTab` | `() => string \| null` | 必需 | 见类型定义。 |
| `setTab` | `(tab: string) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `highlight` | `(target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `clearHighlight` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `getHighlight` | `() => HighlightState \| null` | 必需 | 见类型定义。 |
| `startTour` | `(steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `nextTourStep` | `(step?: number) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `prevTourStep` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `stopTour` | `() => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `getTour` | `() => TourState \| null` | 必需 | 见类型定义。 |
| `focus` | `(target: TargetRef, options?: FocusOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `scrollTo` | `(target: TargetRef, options?: ScrollOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
| `listTargets` | `() => readonly string[]` | 必需 | 见类型定义。 |
| `subscribe` | `(listener: (event: RouterEvent) => void) => () => void` | 必需 | 见类型定义。 |
| `pages` | `PageCatalog` | 必需 | 见类型定义。 |
| `version` | `string` | 必需 | 见类型定义。 |
| `apiVersion` | `number` | 必需 | 见类型定义。 |
