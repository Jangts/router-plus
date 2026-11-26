---
title: "Vue 入口"
outline: [2, 3]
---

# Vue 入口

`@jangts/router-plus/vue` 提供插件、composables、链接、保留视图、路由生成与覆盖层。`app.use(plus)` 同时安装 Vue Router 与 Plus 连接。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`createVueRouterPlus`](#api-createvuerouterplus) | 函数 | 创建 Vue 插件并连接 Vue Router；返回的实例同时暴露 Core API。 |
| [`CreateVueRouterPlusOptions`](#api-createvuerouterplusoptions) | 类型别名 | Vue 装配选项；传入 `router` 或复用已有 Core。 |
| [`VueRouterPlus`](#api-vuerouterplus) | 接口 | Vue 实例，额外提供 `install`、`connection` 与兼容的 `plus` 引用。 |
| [`createVueConnection`](#api-createvueconnection) | 函数 | 单独构造 Vue Router 连接，可不经插件使用。 |
| [`VueConnectionResult`](#api-vueconnectionresult) | 接口 | Vue 连接、提交通知与清理函数。 |
| [`VueRouteLike`](#api-vueroutelike) | 接口 | Vue Router 路由的最小结构。 |
| [`VueRouterLike`](#api-vuerouterlike) | 接口 | Vue Router 的最小结构；缺少可选方法时相应能力关闭。 |
| [`ROUTER_PLUS_KEY`](#api-router_plus_key) | 常量 | Vue `provide`／`inject` 使用的注入键。 |
| [`useRouterPlus`](#api-userouterplus) | 函数 | 读取当前应用提供的 Plus 实例。 |
| [`usePageContext`](#api-usepagecontext) | 函数 | 订阅当前页面上下文的只读 ref。 |
| [`usePageMatch`](#api-usepagematch) | 函数 | 读取当前页面匹配。 |
| [`useRpRef`](#api-userpref) | 函数 | 创建原生 Vue ref，可选登记 ID／导航规则。 |
| [`useRpReactiveState`](#api-userpreactivestate) | 函数 | 创建原生 reactive 容器，可选登记访问入口。 |
| [`useVueState`](#api-usevuestate) | 函数 | 登记已有 Vue 来源、callback 或访问器；返回 void，作用域自动清理。 |
| [`useRpComputedState`](#api-userpcomputedstate) | 函数 | 创建原生 computed，保留原生读写类型及能力。 |
| [`usePageQuery`](#api-usepagequery) | 函数 | 读取并更新查询参数，返回只读 ref 与 `setQuery`。 |
| [`PageQueryInit`](#api-pagequeryinit) | 类型别名 | 查询参数初始值。 |
| [`usePageLeaveGuard`](#api-usepageleaveguard) | 函数 | 在组件作用域内注册离开守卫，卸载时自动移除。 |
| [`useHighlight`](#api-usehighlight) | 函数 | 读取高亮状态并触发或清除高亮。 |
| [`useTour`](#api-usetour) | 函数 | 读取导览状态并控制导览。 |
| [`RouterPlusLink`](#api-routerpluslink) | 常量 | Vue 链接组件。 |
| [`RouterPlusRedirect`](#api-routerplusredirect) | 常量 | Vue 声明式重定向组件。 |
| [`RouterPlusView`](#api-routerplusview) | 常量 | 包装 RouterView，按保留策略缓存实例并冻结作用域。 |
| [`RouterPlusBoundary`](#api-routerplusboundary) | 常量 | 把子树绑定到显式上下文或当前实例。 |
| [`RouterPlusRetained`](#api-routerplusretained) | 常量 | 隐藏时继续挂载子树。 |
| [`createVueRoutes`](#api-createvueroutes) | 函数 | 由页面目录生成 Vue Router 路由记录。 |
| [`CreateVueRoutesOptions`](#api-createvueroutesoptions) | 接口 | 路由生成选项：组件与布局映射、包装与转换。 |
| [`VueRouteRecord`](#api-vuerouterecord) | 接口 | 生成的 Vue 路由记录。 |
| [`RouterPlusOverlay`](#api-routerplusoverlay) | 常量 | Vue 覆盖层组件，负责安装与清理默认覆盖层。 |
| [`OverlayTheme`](#api-overlaytheme) | 接口 | App 控制的覆盖层层级、遮罩与默认组件外观。 |
| [`OverlayZIndexRange`](#api-overlayzindexrange) | 接口 | 默认层级的包含式 min／max 范围。 |
| [`HighlightComponentProps`](#api-highlightcomponentprops) | 接口 | 默认与自定义高亮共用的 width、height、left、top、context 五参数合同。 |
| [`HighlightComponentContext`](#api-highlightcomponentcontext) | 接口 | 目标矩形、页面／高亮／导览状态、overlayRoot 与 next(step = 1)。 |
| [`HighlightRectangle`](#api-highlightrectangle) | 接口 | 测量后的宽高及视口坐标，单位为像素。 |
| [`DefaultHighlightComponentProps`](#api-defaulthighlightcomponentprops) | 接口 | 内置组件参数，在通用五参数之外接收 styles。 |
| [`DefaultHighlightStyles`](#api-defaulthighlightstyles) | 类型别名 | 仅用于内置高亮和气泡的样式参数，不包含公共层级策略。 |

## createVueRouterPlus {#api-createvuerouterplus}

创建 Vue 插件并连接 Vue Router；返回的实例同时暴露 Core API。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
createVueRouterPlus(options: CreateVueRouterPlusOptions): VueRouterPlus
```

Plugin owns connection cleanup; ordinary native Vue Router calls remain valid.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `CreateVueRouterPlusOptions` | 必需 | — |

**返回：** `VueRouterPlus`

## CreateVueRouterPlusOptions {#api-createvuerouterplusoptions}

Vue 装配选项；传入 `router` 或复用已有 Core。

**导入：** `@jangts/router-plus/vue`。

### 定义

**类型别名:** `CreateVueRouterPlusOptions`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus \| undefined` | 可省略 | 复用应用持有的 Core；工厂不再销毁它。 |
| `router` | `VueRouterLike` | 必需 | 应用现有的 Vue Router 实例。 |

## VueRouterPlus {#api-vuerouterplus}

Vue 实例，额外提供 `install`、`connection` 与兼容的 `plus` 引用。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
interface VueRouterPlus extends RouterPlus
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | 见类型定义。 |
| `connection` | `RouterConnection` | 必需 | 插件使用的底层连接，可用于排查或测试。 |
| `install` | `(app: App) => void` | 必需 | 见类型定义。 |
| `disconnect` | `() => void` | 必需 | 见类型定义。 |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | 必需 | Run existing commands in order, waiting for installed sources and framework publication. |
| `connect` | `(connection: RouterConnection) => () => void` | 必需 | 见类型定义。 |
| `connected` | `boolean` | 必需 | 见类型定义。 |
| `hasCustomRenderer` | `boolean` | 必需 | 见类型定义。 |
| `ready` | `Promise<void>` | 必需 | Resolves after the initially configured plugins finish installing. |
| `dispose` | `() => Promise<void>` | 必需 | Cancel pending work, uninstall plugins and detach the global facade. |
| `reportLocation` | `(location: RouterLocation) => void` | 必需 | 见类型定义。 |
| `scope` | `(context?: PageContext) => RouterPlus` | 必需 | Stable instance-bound facade; hidden instances retain their own context. |
| `whenReady` | `() => Promise<void>` | 必需 | 见类型定义。 |
| `snapshot` | `() => Promise<RouterSnapshot>` | 必需 | 见类型定义。 |
| `restore` | `(snapshot: RouterSnapshot) => Promise<void>` | 必需 | 见类型定义。 |
| `transformRoutes` | `<T>(routes: readonly T[], framework: "react" \| "vue") => readonly T[]` | 必需 | 见类型定义。 |
| `use` | `(plugin: RouterPlusPlugin) => Promise<void>` | 必需 | 见类型定义。 |
| `unuse` | `(id: string, options?: { readonly cascade?: boolean; }) => Promise<void>` | 必需 | 见类型定义。 |
| `registerGuard` | `(guard: GlobalGuard, options?: { readonly priority?: number; }) => () => void` | 必需 | Register a global guard (leave/enter) with an optional priority. |
| `navigate` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | 见类型定义。 |
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

## createVueConnection {#api-createvueconnection}

单独构造 Vue Router 连接，可不经插件使用。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
createVueConnection(router: VueRouterLike): VueConnectionResult
```

Build a connection that can also be used without the Vue plugin.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `router` | `VueRouterLike` | 必需 | — |

**返回：** `VueConnectionResult`

## VueConnectionResult {#api-vueconnectionresult}

Vue 连接、提交通知与清理函数。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
interface VueConnectionResult
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `connection` | `RouterConnection` | 必需 | 见类型定义。 |
| `notify` | `(change: CommittedChange) => void` | 必需 | 见类型定义。 |
| `dispose` | `() => void` | 必需 | 见类型定义。 |

## VueRouteLike {#api-vueroutelike}

Vue Router 路由的最小结构。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
interface VueRouteLike
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `path` | `string` | 必需 | 见类型定义。 |
| `fullPath` | `string` | 必需 | 见类型定义。 |
| `hash` | `string` | 必需 | 见类型定义。 |
| `state` | `unknown` | 可省略 | 见类型定义。 |
| `matched` | `readonly { readonly meta?: Record<string, unknown>; readonly params?: Record<string, string \| string[]>; }[] \| undefined` | 可省略 | 见类型定义。 |
| `params` | `Record<string, string \| string[]> \| undefined` | 可省略 | 见类型定义。 |

## VueRouterLike {#api-vuerouterlike}

Vue Router 的最小结构；缺少可选方法时相应能力关闭。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
interface VueRouterLike
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `currentRoute` | `{ readonly value: VueRouteLike; }` | 必需 | 见类型定义。 |
| `options` | `{ readonly history: { readonly state: unknown; }; } \| undefined` | 可省略 | 见类型定义。 |
| `afterEach` | `(callback: (to: VueRouteLike, from: VueRouteLike, failure?: unknown) => void) => () => void` | 必需 | 见类型定义。 |
| `beforeEach` | `((callback: (to: VueRouteLike, from: VueRouteLike) => unknown) => () => void) \| undefined` | 可省略 | 见类型定义。 |
| `push` | `(to: unknown) => Promise<unknown> \| unknown` | 必需 | 见类型定义。 |
| `replace` | `((to: unknown) => Promise<unknown> \| unknown) \| undefined` | 可省略 | 见类型定义。 |
| `go` | `((delta: number) => void) \| undefined` | 可省略 | 见类型定义。 |

## ROUTER_PLUS_KEY {#api-router_plus_key}

Vue `provide`／`inject` 使用的注入键。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const ROUTER_PLUS_KEY: InjectionKey<RouterPlus>
```

## useRouterPlus {#api-userouterplus}

读取当前应用提供的 Plus 实例。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
useRouterPlus(): RouterPlus
```

无调用参数。

**返回：** `RouterPlus`

## usePageContext {#api-usepagecontext}

订阅当前页面上下文的只读 ref。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
usePageContext(): Readonly<Ref<PageContext>>
```

无调用参数。

**返回：** `Readonly<Ref<PageContext, PageContext>>`

## usePageMatch {#api-usepagematch}

读取当前页面匹配。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
usePageMatch(): ComputedRef<PageMatch | null>
```

无调用参数。

**返回：** `ComputedRef<PageMatch \| null>`

## useRpRef {#api-userpref}

创建原生 Vue ref，可选登记 ID／导航规则。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 重载 1

```ts
useRpRef<T extends Ref>(value: T, idOrOptions?: RefRegistration<NoInfer<T>>): T
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `T` | 必需 | — |
| `idOrOptions` | `RefRegistration<NoInfer<T>> \| undefined` | 可省略 | — |

**返回：** `T`

#### 重载 2

```ts
useRpRef<T>(value: T extends Ref ? never : T, idOrOptions?: StateIdOrOptions<NoInfer<UnwrapRef<T>>>): Ref<UnwrapRef<T>, UnwrapRef<T> | T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `T extends Ref<any, any> ? never : T` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<UnwrapRef<T>>> \| undefined` | 可省略 | — |

**返回：** `Ref<UnwrapRef<T>, T \| UnwrapRef<T>>`

#### 重载 3

```ts
useRpRef<T = any>(): Ref<T | undefined>
```

无调用参数。

**返回：** `Ref<T \| undefined, T \| undefined>`

## useRpReactiveState {#api-userpreactivestate}

创建原生 reactive 容器，可选登记访问入口。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
useRpReactiveState<T extends object>(value: T, idOrOptions?: StateIdOrOptions<NoInfer<UnwrapNestedRefs<T>>>): Reactive<T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `T` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<UnwrapNestedRefs<T>>> \| undefined` | 可省略 | — |

**返回：** `Reactive<T>`

## useVueState {#api-usevuestate}

登记已有 Vue 来源、callback 或访问器；返回 void，作用域自动清理。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 重载 1

```ts
useVueState<F extends (...args: never[]) => unknown>(source: F, idOrOptions?: StateIdOrOptions<NoInfer<F>>): void
```

Index a native ref, reactive/readonly container, callback or accessor without copying it.
Omitted options skip registration. Component scopes own page bindings; other effect scopes
own router-wide bindings. The active scope unregisters automatically on disposal.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `source` | `F` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<F>> \| undefined` | 可省略 | — |

**返回：** `void`

#### 重载 2

```ts
useVueState<R extends Ref>(source: R, idOrOptions?: RefRegistration<NoInfer<R>>): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `source` | `R` | 必需 | — |
| `idOrOptions` | `RefRegistration<NoInfer<R>> \| undefined` | 可省略 | — |

**返回：** `void`

#### 重载 3

```ts
useVueState<S>(source: StateAccessor<S>, idOrOptions?: StateIdOrOptions<NoInfer<S>>): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `source` | `StateAccessor<S>` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | 可省略 | — |

**返回：** `void`

#### 重载 4

```ts
useVueState<S extends object>(source: S extends Ref ? never : S, idOrOptions?: StateIdOrOptions<NoInfer<S>>): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `source` | `S extends Ref<any, any> ? never : S` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | 可省略 | — |

**返回：** `void`

## useRpComputedState {#api-userpcomputedstate}

创建原生 computed，保留原生读写类型及能力。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 重载 1

```ts
useRpComputedState<T>(getter: ComputedGetter<T>, idOrOptions?: StateIdOrOptions<NoInfer<T>>): ComputedRef<T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `getter` | `ComputedGetter<T>` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | 可省略 | — |

**返回：** `ComputedRef<T>`

#### 重载 2

```ts
useRpComputedState<T>(getter: ComputedGetter<T>, debug: DebuggerOptions | undefined, idOrOptions?: StateIdOrOptions<NoInfer<T>>): ComputedRef<T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `getter` | `ComputedGetter<T>` | 必需 | — |
| `debug` | `DebuggerOptions \| undefined` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | 可省略 | — |

**返回：** `ComputedRef<T>`

#### 重载 3

```ts
useRpComputedState<T, S = T>(options: WritableComputedOptions<T, S>, idOrOptions?: [T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never): WritableComputedRef<T, S>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `WritableComputedOptions<T, S>` | 必需 | — |
| `idOrOptions` | `([T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never) \| undefined` | 可省略 | — |

**返回：** `WritableComputedRef<T, S>`

#### 重载 4

```ts
useRpComputedState<T, S = T>(options: WritableComputedOptions<T, S>, debug: DebuggerOptions | undefined, idOrOptions?: [T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never): WritableComputedRef<T, S>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `WritableComputedOptions<T, S>` | 必需 | — |
| `debug` | `DebuggerOptions \| undefined` | 必需 | — |
| `idOrOptions` | `([T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never) \| undefined` | 可省略 | — |

**返回：** `WritableComputedRef<T, S>`

## usePageQuery {#api-usepagequery}

读取并更新查询参数，返回只读 ref 与 `setQuery`。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
usePageQuery(defaultInit?: PageQueryInit): { query: Readonly<Ref<ReadonlyMap<string, string | null>, ReadonlyMap<string, string | null>>>; patchQuery(patch: QueryRecord, options?: NavigateOptions): Promise<CommandResult>; setQuery(next: PageQueryInit | ((previous: URLSearchParams) => PageQueryInit), options?: NavigateOptions): Promise<CommandResult>; }
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `defaultInit` | `PageQueryInit \| undefined` | 可省略 | — |

**返回：** `React.ReactElement \| null`

## PageQueryInit {#api-pagequeryinit}

查询参数初始值。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
type PageQueryInit = | string
  | URLSearchParams
  | Record<string, string | readonly string[]>
  | readonly (readonly [string, string])[];
```

## usePageLeaveGuard {#api-usepageleaveguard}

在组件作用域内注册离开守卫，卸载时自动移除。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
usePageLeaveGuard(guard: import("../core/types.js").GlobalGuard): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `guard` | `GlobalGuard` | 必需 | — |

**返回：** `void`

## useHighlight {#api-usehighlight}

读取高亮状态并触发或清除高亮。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
useHighlight(): { state: Readonly<Ref<HighlightState | null>>; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }
```

无调用参数。

**返回：** `{ state: Readonly<Ref<HighlightState \| null>>; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }`

## useTour {#api-usetour}

读取导览状态并控制导览。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
useTour(): { state: Readonly<Ref<TourState | null>>; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }
```

无调用参数。

**返回：** `{ state: Readonly<Ref<TourState \| null>>; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }`

## RouterPlusLink {#api-routerpluslink}

Vue 链接组件。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const RouterPlusLink: DefineComponent<ExtractPropTypes<{ to: { type: PropType<LinkTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; disabled: { type: BooleanConstructor; default: boolean; }; reloadDocument: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; preventScrollReset: { type: BooleanConstructor; default: boolean; }; viewTransition: { type: BooleanConstructor; default: boolean; }; relative: { type: PropType<NavigateOptions["relative"]>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ to: { type: PropType<LinkTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; disabled: { type: BooleanConstructor; default: boolean; }; reloadDocument: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; preventScrollReset: { type: BooleanConstructor; default: boolean; }; viewTransition: { type: BooleanConstructor; default: boolean; }; relative: { type: PropType<NavigateOptions["relative"]>; default: undefined; }; }>, {}>, { replace: boolean; state: any; preventScrollReset: boolean; viewTransition: boolean; relative: "path" | "route" | "index" | "to" | "none" | undefined; disabled: boolean; reloadDocument: boolean; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### 构造函数

```ts
RouterPlusLink(...args: any[])
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `React.ReactElement \| null`

## RouterPlusRedirect {#api-routerplusredirect}

Vue 声明式重定向组件。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const RouterPlusRedirect: DefineComponent<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>, () => null, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>, {}>, { replace: boolean; state: any; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### 构造函数

```ts
new RouterPlusRedirect(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>, {}>, () => null, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { replace: boolean; state: any; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>> & Readonly<{}>, () => null, {}, {}, {}, { replace: boolean; state: any; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `React.ReactElement \| null`

## RouterPlusView {#api-routerplusview}

包装 RouterView，按保留策略缓存实例并冻结作用域。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const RouterPlusView: DefineComponent<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>, {}>, { view: Component; host: Component; cache: boolean; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### 构造函数

```ts
new RouterPlusView(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>, {}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { view: Component; host: Component; cache: boolean; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>> & Readonly<{}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, { view: Component; host: Component; cache: boolean; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `React.ReactElement \| null`

## RouterPlusBoundary {#api-routerplusboundary}

把子树绑定到显式上下文或当前实例。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const RouterPlusBoundary: DefineComponent<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, { context: PageContext; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### 构造函数

```ts
new RouterPlusBoundary(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { context: PageContext; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>> & Readonly<{}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, { context: PageContext; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `React.ReactElement \| null`

## RouterPlusRetained {#api-routerplusretained}

隐藏时继续挂载子树。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const RouterPlusRetained: DefineComponent<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, { context: PageContext; host: Component; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### 构造函数

```ts
new RouterPlusRetained(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { context: PageContext; host: Component; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>> & Readonly<{}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, { context: PageContext; host: Component; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `React.ReactElement \| null`

## createVueRoutes {#api-createvueroutes}

由页面目录生成 Vue Router 路由记录。

**导入：** `@jangts/router-plus/vue`。

### 定义

#### 调用

```ts
createVueRoutes(pages: readonly PageDefinition[], options?: CreateVueRoutesOptions): readonly VueRouteRecord[]
```

Build Vue route records from page definitions, nesting by `parentId`.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | 必需 | — |
| `options` | `CreateVueRoutesOptions` | 可省略 | — |

**返回：** `readonly VueRouteRecord[]`

## CreateVueRoutesOptions {#api-createvueroutesoptions}

路由生成选项：组件与布局映射、包装与转换。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
interface CreateVueRoutesOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `components` | `Readonly<Record<string, Component>> \| undefined` | 可省略 | 见类型定义。 |
| `layouts` | `Readonly<Record<string, Component>> \| undefined` | 可省略 | 见类型定义。 |
| `plus` | `RouterPlus \| undefined` | 可省略 | 见类型定义。 |
| `wrap` | `((component: Component, page: PageDefinition) => Component) \| undefined` | 可省略 | 见类型定义。 |

## VueRouteRecord {#api-vuerouterecord}

生成的 Vue 路由记录。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
interface VueRouteRecord
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `path` | `string` | 必需 | 见类型定义。 |
| `name` | `string` | 必需 | 见类型定义。 |
| `alias` | `readonly string[] \| undefined` | 可省略 | 见类型定义。 |
| `component` | `Component \| undefined` | 可省略 | 见类型定义。 |
| `children` | `readonly VueRouteRecord[] \| undefined` | 可省略 | 见类型定义。 |
| `meta` | `Readonly<Record<string, unknown>>` | 必需 | 见类型定义。 |

## RouterPlusOverlay {#api-routerplusoverlay}

Vue 覆盖层组件，负责安装与清理默认覆盖层。

**导入：** `@jangts/router-plus/vue`。

### 定义

```ts
const RouterPlusOverlay: DefineComponent<ExtractPropTypes<{ root: { type: PropType<Document | ShadowRoot | Element>; default: undefined; }; interactive: { type: BooleanConstructor; default: boolean; }; installRuntime: { type: BooleanConstructor; default: boolean; }; injectStyles: { type: BooleanConstructor; default: boolean; }; className: { type: StringConstructor; default: undefined; }; highlightComponent: { type: PropType<Component>; default: undefined; }; theme: { type: PropType<OverlayTheme>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }> | null, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ root: { type: PropType<Document | ShadowRoot | Element>; default: undefined; }; interactive: { type: BooleanConstructor; default: boolean; }; installRuntime: { type: BooleanConstructor; default: boolean; }; injectStyles: { type: BooleanConstructor; default: boolean; }; className: { type: StringConstructor; default: undefined; }; highlightComponent: { type: PropType<Component>; default: undefined; }; theme: { type: PropType<OverlayTheme>; default: undefined; }; }>, {}>, { className: string; highlightComponent: Component; root: Element | Document | ShadowRoot; installRuntime: boolean; injectStyles: boolean; interactive: boolean; theme: OverlayTheme; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### 构造函数

```ts
RouterPlusOverlay(...args: any[])
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `React.ReactElement \| null`

## OverlayTheme {#api-overlaytheme}

App 控制的覆盖层层级、遮罩与默认组件外观。

**导入：** `@jangts/router-plus/vue`。

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

**导入：** `@jangts/router-plus/vue`。

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

**导入：** `@jangts/router-plus/vue`。

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

**导入：** `@jangts/router-plus/vue`。

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

**导入：** `@jangts/router-plus/vue`。

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

**导入：** `@jangts/router-plus/vue`。

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

**导入：** `@jangts/router-plus/vue`。

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

## 使用示例

```ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory, useRoute } from 'vue-router';
import { createVueRouterPlus, RouterPlusLink, RouterPlusView } from '@jangts/router-plus/vue';

const Page = defineComponent({
  setup() {
    const route = useRoute();
    return () => h('p', route.path);
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/alpha' },
    { path: '/alpha', component: Page },
    { path: '/beta/:id', component: Page },
  ],
});

const plus = createVueRouterPlus({
  router,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

createApp({
  render: () => h('main', [h(RouterPlusLink, { to: '/beta/42' }, () => '打开 Beta'), h(RouterPlusView)]),
}).use(plus).mount('#app');
```

### 组合式读取状态

```ts
import { useRpRef, usePageQuery } from '@jangts/router-plus/vue';

const state = useRpRef({ count: 0 }, 'counter');
const section = useRpRef('summary', { id: 'section', query: true, values: ['summary', 'details'] });
const { query, setQuery } = usePageQuery();
```

`app.use(plus)` 同时安装 Vue Router 与 Plus 连接；应用卸载会清理适配层订阅，并销毁工厂创建的 Core。

### 已有来源

```ts
import { ref, reactive } from 'vue';
import { useVueState } from '@jangts/router-plus/vue';
// setup() / setup store
const count = ref(0);
const filter = reactive({ category: 'all' });
useVueState(count, 'count');
useVueState(filter, { id: 'filter', query: true });
const applyPatch = async (fields: Record<string, unknown>) => ({ applied: Object.keys(fields), conflicts: [] });
useVueState(applyPatch, 'applyPatch');
const receipt = await plus.callState('applyPatch', { name: 'Summer' });
```
