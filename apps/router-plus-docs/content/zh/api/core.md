---
title: "核心 API"
outline: [2, 3]
---

# 核心 API

`createRouterPlus` 创建与框架无关的实例；页面目录、目标解析、命令、守卫、插件、状态与交互都由这一层拥有。框架适配和 DOM 能力从其他入口按需加载。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`createRouterPlus`](#api-createrouterplus) | 函数 | 创建与框架无关的 Plus 实例；接收页面目录、插件、状态、连接与交互选项。 |
| [`RouterPlusImpl`](#api-routerplusimpl) | 类 | `RouterPlus` 的默认实现类；通常通过 `createRouterPlus` 创建，不直接实例化。 |
| [`ROUTER_PLUS_VERSION`](#api-router_plus_version) | 常量 | 当前包的 semver 版本字符串。 |
| [`ROUTER_PLUS_API_VERSION`](#api-router_plus_api_version) | 常量 | 公开 API 合同版本，整数；当前为 `1`，与包版本无关。 |
| [`createPageLink`](#api-createpagelink) | 函数 | 按 `pageLink` 配置把页面目标编码成语义链接。 |
| [`parsePageLink`](#api-parsepagelink) | 函数 | 解析语义链接并返回导航目标；解析本身不执行副作用。 |
| [`attachGlobal`](#api-attachglobal) | 函数 | 把实例投影出的调试门面挂到指定全局属性；同名属性已存在时拒绝覆盖。 |
| [`detachGlobal`](#api-detachglobal) | 函数 | 移除本实例安装的调试门面，不删除其他代码后来写入的值。 |
| [`DEFAULT_GLOBAL_KEY`](#api-default_global_key) | 常量 | 浏览器默认调试门面名称 `__ROUTER_PLUS__`。 |
| [`toGlobalFacade`](#api-toglobalfacade) | 函数 | 把实例投影为不含安装权限的调试门面。 |
| [`defaultMatcher`](#api-defaultmatcher) | 常量 | 默认路径匹配器，支持普通命名参数与尾部 splat。 |
| [`RouteMatcher`](#api-routematcher) | 接口 | 路径匹配与 href 构造的接口；框架适配提供各自的原生实现。 |
| [`RouteMatch`](#api-routematch) | 接口 | 默认匹配器返回的页面 id 与参数结果。 |

## createRouterPlus {#api-createrouterplus}

创建与框架无关的 Plus 实例；接收页面目录、插件、状态、连接与交互选项。

**导入：** `@jangts/router-plus`。

### 定义

#### 调用

```ts
createRouterPlus(options: CreateRouterPlusOptions): RouterPlus
```

Create a Router Plus instance.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `CreateRouterPlusOptions` | 必需 | — |

**返回：** `RouterPlus`

## RouterPlusImpl {#api-routerplusimpl}

`RouterPlus` 的默认实现类；通常通过 `createRouterPlus` 创建，不直接实例化。

**导入：** `@jangts/router-plus`。

### 定义

```ts
class RouterPlusImpl extends RouterPlus, CommandHost
```

#### 构造函数

```ts
new RouterPlusImpl(options: CreateRouterPlusOptions): RouterPlusImpl
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `CreateRouterPlusOptions` | 必需 | — |

**返回：** `RouterPlusImpl`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `version` | `"0.8.0"` | 必需 | 见类型定义。 |
| `apiVersion` | `1` | 必需 | 见类型定义。 |
| `ready` | `Promise<void>` | 必需 | 见类型定义。 |
| `hasCustomRenderer` | `boolean` | 必需 | 见类型定义。 |
| `connected` | `boolean` | 必需 | 见类型定义。 |
| `pages` | `PageCatalog` | 必需 | 见类型定义。 |

### 成员目录

| 成员 | 用途 |
| --- | --- |
| [`connect`](#member-routerplusimpl-connect) | 见下方完整签名。 |
| [`disconnect`](#member-routerplusimpl-disconnect) | 见下方完整签名。 |
| [`reportLocation`](#member-routerplusimpl-reportlocation) | 见下方完整签名。 |
| [`execute`](#member-routerplusimpl-execute) | 见下方完整签名。 |
| [`use`](#member-routerplusimpl-use) | 见下方完整签名。 |
| [`unuse`](#member-routerplusimpl-unuse) | 见下方完整签名。 |
| [`registerGuard`](#member-routerplusimpl-registerguard) | 见下方完整签名。 |
| [`resolveLink`](#member-routerplusimpl-resolvelink) | 见下方完整签名。 |
| [`resolveTarget`](#member-routerplusimpl-resolvetarget) | 见下方完整签名。 |
| [`resolveHref`](#member-routerplusimpl-resolvehref) | 见下方完整签名。 |
| [`match`](#member-routerplusimpl-match) | 见下方完整签名。 |
| [`navigate`](#member-routerplusimpl-navigate) | 见下方完整签名。 |
| [`replace`](#member-routerplusimpl-replace) | 见下方完整签名。 |
| [`patchQuery`](#member-routerplusimpl-patchquery) | Apply partial URL edits through the same queue used by framework query helpers. |
| [`back`](#member-routerplusimpl-back) | 见下方完整签名。 |
| [`forward`](#member-routerplusimpl-forward) | 见下方完整签名。 |
| [`go`](#member-routerplusimpl-go) | 见下方完整签名。 |
| [`getContext`](#member-routerplusimpl-getcontext) | 见下方完整签名。 |
| [`getInstance`](#member-routerplusimpl-getinstance) | 见下方完整签名。 |
| [`getState`](#member-routerplusimpl-getstate) | 见下方完整签名。 |
| [`setState`](#member-routerplusimpl-setstate) | 见下方完整签名。 |
| [`patchState`](#member-routerplusimpl-patchstate) | 见下方完整签名。 |
| [`resetState`](#member-routerplusimpl-resetstate) | 见下方完整签名。 |
| [`callState`](#member-routerplusimpl-callstate) | 见下方完整签名。 |
| [`inspectState`](#member-routerplusimpl-inspectstate) | Return frozen metadata for installed sources, without touching their live values. |
| [`listStateKeys`](#member-routerplusimpl-liststatekeys) | 见下方完整签名。 |
| [`getTab`](#member-routerplusimpl-gettab) | 见下方完整签名。 |
| [`setTab`](#member-routerplusimpl-settab) | 见下方完整签名。 |
| [`retain`](#member-routerplusimpl-retain) | 见下方完整签名。 |
| [`release`](#member-routerplusimpl-release) | 见下方完整签名。 |
| [`registerHost`](#member-routerplusimpl-registerhost) | 见下方完整签名。 |
| [`scope`](#member-routerplusimpl-scope) | Bind operations to a stable instance without mutating the router's active context. |
| [`whenReady`](#member-routerplusimpl-whenready) | 见下方完整签名。 |
| [`snapshot`](#member-routerplusimpl-snapshot) | 见下方完整签名。 |
| [`restore`](#member-routerplusimpl-restore) | 见下方完整签名。 |
| [`transformRoutes`](#member-routerplusimpl-transformroutes) | 见下方完整签名。 |
| [`registerTarget`](#member-routerplusimpl-registertarget) | 见下方完整签名。 |
| [`unregisterTarget`](#member-routerplusimpl-unregistertarget) | 见下方完整签名。 |
| [`listTargets`](#member-routerplusimpl-listtargets) | 见下方完整签名。 |
| [`highlight`](#member-routerplusimpl-highlight) | 见下方完整签名。 |
| [`clearHighlight`](#member-routerplusimpl-clearhighlight) | 见下方完整签名。 |
| [`getHighlight`](#member-routerplusimpl-gethighlight) | 见下方完整签名。 |
| [`startTour`](#member-routerplusimpl-starttour) | 见下方完整签名。 |
| [`nextTourStep`](#member-routerplusimpl-nexttourstep) | 见下方完整签名。 |
| [`prevTourStep`](#member-routerplusimpl-prevtourstep) | 见下方完整签名。 |
| [`stopTour`](#member-routerplusimpl-stoptour) | 见下方完整签名。 |
| [`getTour`](#member-routerplusimpl-gettour) | 见下方完整签名。 |
| [`focus`](#member-routerplusimpl-focus) | 见下方完整签名。 |
| [`scrollTo`](#member-routerplusimpl-scrollto) | 见下方完整签名。 |
| [`registerNavigationAction`](#member-routerplusimpl-registernavigationaction) | 见下方完整签名。 |
| [`executeAction`](#member-routerplusimpl-executeaction) | 见下方完整签名。 |
| [`subscribe`](#member-routerplusimpl-subscribe) | 见下方完整签名。 |
| [`dispose`](#member-routerplusimpl-dispose) | Reentrant callers share completion, including calls made by disposed subscribers. |

#### connect {#member-routerplusimpl-connect}

实例方法。

```ts
connect(connection: RouterConnection): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `connection` | `RouterConnection` | 必需 | — |

**返回：** `() => void`

#### disconnect {#member-routerplusimpl-disconnect}

实例方法。

```ts
disconnect(): void
```

无调用参数。

**返回：** `void`

#### reportLocation {#member-routerplusimpl-reportlocation}

实例方法。

```ts
reportLocation(location: RouterLocation): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `location` | `RouterLocation` | 必需 | — |

**返回：** `void`

#### execute {#member-routerplusimpl-execute}

实例方法。

```ts
execute(command: RouterCommand): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `command` | `RouterCommand` | 必需 | — |

**返回：** `Promise<CommandResult>`

```ts
execute(commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `commands` | `readonly RouterCommand[]` | 必需 | — |
| `options` | `CommandSequenceOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandSequenceResult>`

#### use {#member-routerplusimpl-use}

实例方法。

```ts
use(plugin: RouterPlusPlugin): Promise<void>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plugin` | `RouterPlusPlugin` | 必需 | — |

**返回：** `Promise<void>`

#### unuse {#member-routerplusimpl-unuse}

实例方法。

```ts
unuse(id: string, options?: { readonly cascade?: boolean; }): Promise<void>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | — |
| `options` | `{ readonly cascade?: boolean; }` | 可省略 | — |

**返回：** `Promise<void>`

#### registerGuard {#member-routerplusimpl-registerguard}

实例方法。

```ts
registerGuard(guard: GlobalGuard, options?: { readonly priority?: number; }): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `guard` | `GlobalGuard` | 必需 | — |
| `options` | `{ readonly priority?: number; }` | 可省略 | — |

**返回：** `() => void`

#### resolveLink {#member-routerplusimpl-resolvelink}

实例方法。

```ts
resolveLink(target: LinkTarget): LinkResolution | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `LinkTarget` | 必需 | — |

**返回：** `LinkResolution \| null`

#### resolveTarget {#member-routerplusimpl-resolvetarget}

实例方法。

```ts
resolveTarget(target: PageTarget): NavigationPlan | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `PageTarget` | 必需 | — |

**返回：** `NavigationPlan \| null`

#### resolveHref {#member-routerplusimpl-resolvehref}

实例方法。

```ts
resolveHref(target: PageTarget): string | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `PageTarget` | 必需 | — |

**返回：** `string \| null`

#### match {#member-routerplusimpl-match}

实例方法。

```ts
match(pathname: string): PageMatch | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `pathname` | `string` | 必需 | — |

**返回：** `PageMatch \| null`

#### navigate {#member-routerplusimpl-navigate}

实例方法。

```ts
navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `PageTarget` | 必需 | — |
| `options` | `NavigateOptions` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### replace {#member-routerplusimpl-replace}

实例方法。

```ts
replace(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `PageTarget` | 必需 | — |
| `options` | `NavigateOptions` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### patchQuery {#member-routerplusimpl-patchquery}

实例方法。

Apply partial URL edits through the same queue used by framework query helpers.

```ts
patchQuery(patch: import("./types.js").QueryRecord, options?: NavigateOptions): Promise<CommandResult>
```

Apply partial URL edits through the same queue used by framework query helpers.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `patch` | `Readonly<Record<string, string \| readonly string[] \| undefined>>` | 必需 | — |
| `options` | `NavigateOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### back {#member-routerplusimpl-back}

实例方法。

```ts
back(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### forward {#member-routerplusimpl-forward}

实例方法。

```ts
forward(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### go {#member-routerplusimpl-go}

实例方法。

```ts
go(delta: number): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `delta` | `number` | 必需 | — |

**返回：** `Promise<CommandResult>`

#### getContext {#member-routerplusimpl-getcontext}

实例方法。

```ts
getContext(): PageContext
```

无调用参数。

**返回：** `PageContext`

#### getInstance {#member-routerplusimpl-getinstance}

实例方法。

```ts
getInstance(): PageInstance | null
```

无调用参数。

**返回：** `PageInstance \| null`

#### getState {#member-routerplusimpl-getstate}

实例方法。

```ts
getState<T = unknown>(key?: string): T
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 可省略 | — |

**返回：** `T`

#### setState {#member-routerplusimpl-setstate}

实例方法。

```ts
setState(value: unknown, key?: string): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | 必需 | — |
| `key` | `string` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### patchState {#member-routerplusimpl-patchstate}

实例方法。

```ts
patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `Record<string, unknown>` | 必需 | — |
| `key` | `string` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### resetState {#member-routerplusimpl-resetstate}

实例方法。

```ts
resetState(key?: string): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### callState {#member-routerplusimpl-callstate}

实例方法。

```ts
callState(id: string, ...args: unknown[]): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | — |
| `args` | `unknown[]` | 剩余参数 | — |

**返回：** `Promise<CommandResult>`

#### inspectState {#member-routerplusimpl-inspectstate}

实例方法。

Return frozen metadata for installed sources, without touching their live values.

```ts
inspectState(): readonly StateInspection[]
```

Return frozen metadata for installed sources, without touching their live values.

无调用参数。

**返回：** `readonly StateInspection[]`

```ts
inspectState(id: string): StateInspection | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | — |

**返回：** `StateInspection \| null`

#### listStateKeys {#member-routerplusimpl-liststatekeys}

实例方法。

```ts
listStateKeys(): readonly string[]
```

无调用参数。

**返回：** `readonly string[]`

#### getTab {#member-routerplusimpl-gettab}

实例方法。

```ts
getTab(): string | null
```

无调用参数。

**返回：** `string \| null`

#### setTab {#member-routerplusimpl-settab}

实例方法。

```ts
setTab(tab: string): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `tab` | `string` | 必需 | — |

**返回：** `Promise<CommandResult>`

#### retain {#member-routerplusimpl-retain}

实例方法。

```ts
retain(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### release {#member-routerplusimpl-release}

实例方法。

```ts
release(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### registerHost {#member-routerplusimpl-registerhost}

实例方法。

```ts
registerHost(host: InstanceHost, context?: PageContext): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `host` | `InstanceHost` | 必需 | — |
| `context` | `PageContext` | 可省略 | — |

**返回：** `() => void`

#### scope {#member-routerplusimpl-scope}

实例方法。

Bind operations to a stable instance without mutating the router's active context.

```ts
scope(context?: PageContext): RouterPlus
```

Bind operations to a stable instance without mutating the router's active context.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `context` | `PageContext` | 可省略 | — |

**返回：** `RouterPlus`

#### whenReady {#member-routerplusimpl-whenready}

实例方法。

```ts
whenReady(): Promise<void>
```

无调用参数。

**返回：** `Promise<void>`

#### snapshot {#member-routerplusimpl-snapshot}

实例方法。

```ts
snapshot(): Promise<import("./types.js").RouterSnapshot>
```

无调用参数。

**返回：** `Promise<RouterSnapshot>`

#### restore {#member-routerplusimpl-restore}

实例方法。

```ts
restore(snapshot: import("./types.js").RouterSnapshot): Promise<void>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `snapshot` | `RouterSnapshot` | 必需 | — |

**返回：** `Promise<void>`

#### transformRoutes {#member-routerplusimpl-transformroutes}

实例方法。

```ts
transformRoutes<T>(routes: readonly T[], framework: "react" | "vue"): readonly T[]
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `routes` | `readonly T[]` | 必需 | — |
| `framework` | `"react" \| "vue"` | 必需 | — |

**返回：** `readonly T[]`

#### registerTarget {#member-routerplusimpl-registertarget}

实例方法。

```ts
registerTarget(id: string, resolve: () => TargetAnchor | null): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | — |
| `resolve` | `() => TargetAnchor \| null` | 必需 | — |

**返回：** `() => void`

#### unregisterTarget {#member-routerplusimpl-unregistertarget}

实例方法。

```ts
unregisterTarget(id: string): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | — |

**返回：** `void`

#### listTargets {#member-routerplusimpl-listtargets}

实例方法。

```ts
listTargets(): readonly string[]
```

无调用参数。

**返回：** `readonly string[]`

#### highlight {#member-routerplusimpl-highlight}

实例方法。

```ts
highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `TargetRef` | 必需 | — |
| `options` | `HighlightOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### clearHighlight {#member-routerplusimpl-clearhighlight}

实例方法。

```ts
clearHighlight(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### getHighlight {#member-routerplusimpl-gethighlight}

实例方法。

```ts
getHighlight(): HighlightState | null
```

无调用参数。

**返回：** `HighlightState \| null`

#### startTour {#member-routerplusimpl-starttour}

实例方法。

```ts
startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `steps` | `readonly TourStep[]` | 必需 | — |
| `options` | `TourOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### nextTourStep {#member-routerplusimpl-nexttourstep}

实例方法。

```ts
nextTourStep(step?: number): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `step` | `number` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### prevTourStep {#member-routerplusimpl-prevtourstep}

实例方法。

```ts
prevTourStep(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### stopTour {#member-routerplusimpl-stoptour}

实例方法。

```ts
stopTour(): Promise<CommandResult>
```

无调用参数。

**返回：** `Promise<CommandResult>`

#### getTour {#member-routerplusimpl-gettour}

实例方法。

```ts
getTour(): TourState | null
```

无调用参数。

**返回：** `TourState \| null`

#### focus {#member-routerplusimpl-focus}

实例方法。

```ts
focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `TargetRef` | 必需 | — |
| `options` | `FocusOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### scrollTo {#member-routerplusimpl-scrollto}

实例方法。

```ts
scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `TargetRef` | 必需 | — |
| `options` | `ScrollOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### registerNavigationAction {#member-routerplusimpl-registernavigationaction}

实例方法。

```ts
registerNavigationAction(id: string, handler: import("./types.js").NavigationActionHandler): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 必需 | — |
| `handler` | `NavigationActionHandler` | 必需 | — |

**返回：** `() => void`

#### executeAction {#member-routerplusimpl-executeaction}

实例方法。

```ts
executeAction(actionId: string, payload?: unknown, context?: PageContext): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `actionId` | `string` | 必需 | — |
| `payload` | `unknown` | 可省略 | — |
| `context` | `PageContext` | 可省略 | — |

**返回：** `Promise<CommandResult>`

#### subscribe {#member-routerplusimpl-subscribe}

实例方法。

```ts
subscribe(listener: (event: RouterEvent) => void): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `listener` | `(event: RouterEvent) => void` | 必需 | — |

**返回：** `() => void`

#### dispose {#member-routerplusimpl-dispose}

实例方法。

Reentrant callers share completion, including calls made by disposed subscribers.

```ts
dispose(): Promise<void>
```

Reentrant callers share completion, including calls made by disposed subscribers.

无调用参数。

**返回：** `Promise<void>`

## ROUTER_PLUS_VERSION {#api-router_plus_version}

当前包的 semver 版本字符串。

**导入：** `@jangts/router-plus`。

### 定义

```ts
const ROUTER_PLUS_VERSION: "0.8.0"
```

## ROUTER_PLUS_API_VERSION {#api-router_plus_api_version}

公开 API 合同版本，整数；当前为 `1`，与包版本无关。

**导入：** `@jangts/router-plus`。

### 定义

```ts
const ROUTER_PLUS_API_VERSION: 1
```

## createPageLink {#api-createpagelink}

按 `pageLink` 配置把页面目标编码成语义链接。

**导入：** `@jangts/router-plus`。

### 定义

#### 调用

```ts
createPageLink(target: { readonly path: string; readonly tab?: string; }, options: PageLinkOptions): string
```

Build a caller-configurable page link; never infers a business scheme.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `target` | `{ readonly path: string; readonly tab?: string; }` | 必需 | — |
| `options` | `PageLinkOptions` | 必需 | — |

**返回：** `string`

## parsePageLink {#api-parsepagelink}

解析语义链接并返回导航目标；解析本身不执行副作用。

**导入：** `@jangts/router-plus`。

### 定义

#### 调用

```ts
parsePageLink(value: string, options: PageLinkOptions): { readonly path: string; readonly tab?: string; } | null
```

Parse a page link produced by `createPageLink`.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | 必需 | — |
| `options` | `PageLinkOptions` | 必需 | — |

**返回：** `{ readonly path: string; readonly tab?: string; } \| null`

## attachGlobal {#api-attachglobal}

把实例投影出的调试门面挂到指定全局属性；同名属性已存在时拒绝覆盖。

**导入：** `@jangts/router-plus`。

### 定义

#### 调用

```ts
attachGlobal(plus: RouterPlus, key?: string): () => void
```

Reject occupied keys, including inherited and explicitly undefined properties.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `key` | `string` | 可省略 | — |

**返回：** `() => void`

## detachGlobal {#api-detachglobal}

移除本实例安装的调试门面，不删除其他代码后来写入的值。

**导入：** `@jangts/router-plus`。

### 定义

#### 调用

```ts
detachGlobal(key?: string): void
```

Remove only the exact facade we installed; foreign replacements survive cleanup.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `key` | `string` | 可省略 | — |

**返回：** `void`

## DEFAULT_GLOBAL_KEY {#api-default_global_key}

浏览器默认调试门面名称 `__ROUTER_PLUS__`。

**导入：** `@jangts/router-plus`。

### 定义

```ts
const DEFAULT_GLOBAL_KEY: "__ROUTER_PLUS__"
```

## toGlobalFacade {#api-toglobalfacade}

把实例投影为不含安装权限的调试门面。

**导入：** `@jangts/router-plus`。

### 定义

#### 调用

```ts
toGlobalFacade(plus: RouterPlus): RouterPlusGlobal
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |

**返回：** `RouterPlusGlobal`

## defaultMatcher {#api-defaultmatcher}

默认路径匹配器，支持普通命名参数与尾部 splat。

**导入：** `@jangts/router-plus`。

### 定义

**undefined:** `defaultMatcher`

### 成员目录

| 成员 | 用途 |
| --- | --- |
| [`match`](#member-defaultmatcher-match) | 见下方完整签名。 |
| [`build`](#member-defaultmatcher-build) | 见下方完整签名。 |

#### match {#member-defaultmatcher-match}

```ts
defaultMatcher.match(template: string, pathname: string): RouteMatch | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `template` | `string` | 必需 | — |
| `pathname` | `string` | 必需 | — |

**返回：** `RouteMatch \| null`

#### build {#member-defaultmatcher-build}

```ts
defaultMatcher.build(template: string, params: Readonly<Record<string, string>>): string | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `template` | `string` | 必需 | — |
| `params` | `Readonly<Record<string, string>>` | 必需 | — |

**返回：** `string \| null`

## RouteMatcher {#api-routematcher}

路径匹配与 href 构造的接口；框架适配提供各自的原生实现。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouteMatcher
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `matchPages` | `((pages: readonly PageDefinition[], pathname: string) => { pageId: string; params: Readonly<Record<string, string>>; } \| null) \| undefined` | 可省略 | Optional native ranking across the entire directory. |
| `match` | `(template: string, pathname: string) => RouteMatch \| null` | 必需 | 见类型定义。 |
| `build` | `(template: string, params: Readonly<Record<string, string>>) => string \| null` | 必需 | 见类型定义。 |

## RouteMatch {#api-routematch}

默认匹配器返回的页面 id 与参数结果。

**导入：** `@jangts/router-plus`。

### 定义

```ts
interface RouteMatch
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `params` | `Readonly<Record<string, string>>` | 必需 | 见类型定义。 |

## 使用示例

```ts
import { createRouterPlus } from '@jangts/router-plus';
import { createMemoryConnection } from '@jangts/router-plus/testing';

const plus = createRouterPlus({
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

plus.connect(createMemoryConnection({ initial: { pathname: '/alpha' } }));
const result = await plus.navigate({ path: '/beta/42' });
if (!result.ok) console.error(result.reason, result.message);
```

### 目标与链接

```ts
plus.resolveHref({ page: 'beta', params: { id: '42' }, values: { section: 'details' } });
plus.resolveLink({ action: 'open-settings', payload: { section: 'profile' } });
```

页面对象按 id 解析，路径对象可指向未登记的地址。解析目标是同步的，不执行守卫、跳转或 action；只有命令才产生副作用。

### 调试门面

浏览器中默认挂载 `__ROUTER_PLUS__`，可读取上下文并执行命令。它只用于调试，不作为授权边界；设置 `globalKey: false` 可关闭。

### 查询来源能力

```ts
const source = plus.inspectState('filters');
if (source?.capabilities.call) await plus.callState(source.id);
const installed = plus.inspectState();
```

只返回当前门面可见的已登记来源元数据，不读取实时值，不执行 getter 或 codec；未知 ID、未挂载声明及任意字段展开返回 null。调试全局门面不暴露此入口。

### 顺序编组与来源生命周期

```ts
const result = await plus.execute([
  { kind: 'navigate', target: '/customers/42' },
  { kind: 'state.set', key: 'editPanel', value: true },
  { kind: 'state.patch', key: 'customerForm', value: { name: 'Ivan' } },
  { kind: 'state.call', id: 'submitCustomer' },
], { timeoutMs: 10000 });
const stop = plus.subscribe(event => {
  if (event.type === 'state.registered') console.log(event.source.id);
});
```

编组等待目标来源登记／恢复与框架提交；来源注销／替换、离开实例、失败、超时或取消即停止。失败回执保留 failedIndex 和已完成 results，不回滚或自动重试业务操作。subscribe 同时提供 state.unregistered、state.committed 和 disposed。whenReady 不等待未来挂载组件；异步业务初始化仍由应用明确表达。
