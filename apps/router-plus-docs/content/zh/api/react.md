---
title: "React 入口"
outline: [2, 3]
---

# React 入口

`@jangts/router-plus/react` 提供装配函数、Provider、hooks、链接、保留渲染、路由生成与覆盖层。React 与 React Router 保持可选 peer 依赖，入口不会加载 Vue。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`createReactRouterPlus`](#api-createreactrouterplus) | 函数 | 装配 React Router 与 Plus，返回带稳定 Provider 的实例。 |
| [`CreateReactRouterPlusOptions`](#api-createreactrouterplusoptions) | 类型别名 | React 装配选项；`router` 接受元素、构造函数元组或 Data Router。 |
| [`ReactRouterTuple`](#api-reactroutertuple) | 类型别名 | `[组件, props?]` 构造函数元组；props 从组件推断。 |
| [`ReactRouterPlus`](#api-reactrouterplus) | 接口 | React 实例，额外提供 `Provider`。 |
| [`createReactProvider`](#api-createreactprovider) | 函数 | 用应用已有的原生 hooks 创建底层 Provider 组件。 |
| [`usePlusContext`](#api-usepluscontext) | 函数 | 读取最近 Provider 提供的 Plus 实例。 |
| [`ReactRouterHooks`](#api-reactrouterhooks) | 接口 | 适配原生 Router 所需的地址与导航 hooks。 |
| [`ReactRouterLocationLike`](#api-reactrouterlocationlike) | 接口 | 适配层可读取的地址对象。 |
| [`RouterPlusProviderProps`](#api-routerplusproviderprops) | 接口 | Provider 属性。 |
| [`useRouterPlus`](#api-userouterplus) | 函数 | 读取绑定到当前边界的 Plus 门面。 |
| [`usePageContext`](#api-usepagecontext) | 函数 | 订阅当前页面上下文。 |
| [`usePageMatch`](#api-usepagematch) | 函数 | 读取当前页面匹配。 |
| [`useRpState`](#api-userpstate) | 函数 | 创建原生 React state，可选登记 ID／导航规则，返回原生 tuple。 |
| [`useReactState`](#api-usereactstate) | 函数 | 登记已有 tuple、ref、callback 或访问器；返回 void，自动清理。 |
| [`useRpRef`](#api-userpref) | 函数 | 创建原生 ref，可选登记访问入口。 |
| [`useRpContext`](#api-userpcontext) | 函数 | 读取原生 context，可选登记只读来源。 |
| [`useRpCallback`](#api-userpcallback) | 函数 | 创建原生 callback，可选登记 callState 调用入口。 |
| [`usePageQuery`](#api-usepagequery) | 函数 | 读取并更新查询参数。 |
| [`PageQueryInit`](#api-pagequeryinit) | 类型别名 | 查询参数初始值。 |
| [`SetPageQuery`](#api-setpagequery) | 接口 | 顺序合并同轮函数式修改，返回真实导航回执的查询参数写入口。 |
| [`usePageLeaveGuard`](#api-usepageleaveguard) | 函数 | 在组件生命周期内注册离开守卫。 |
| [`useHighlight`](#api-usehighlight) | 函数 | 读取高亮状态并触发或清除高亮。 |
| [`useTour`](#api-usetour) | 函数 | 读取导览状态并控制导览。 |
| [`RouterPlusLink`](#api-routerpluslink) | 函数 | 通过 Plus 解析目标的链接组件。 |
| [`RouterPlusLinkProps`](#api-routerpluslinkprops) | 接口 | 链接组件属性。 |
| [`RouterPlusRedirect`](#api-routerplusredirect) | 函数 | 声明式重定向组件。 |
| [`RouterPlusRedirectProps`](#api-routerplusredirectprops) | 接口 | 重定向属性。 |
| [`RouterPlusScope`](#api-routerplusscope) | 函数 | 只绑定 Plus 上下文，不增加 DOM 或生命周期行为。 |
| [`RouterPlusBoundary`](#api-routerplusboundary) | 函数 | 把子树绑定到显式上下文或当前实例，并登记 DOM 宿主。 |
| [`RouterPlusBoundaryProps`](#api-routerplusboundaryprops) | 接口 | 边界属性。 |
| [`RouterPlusOutlet`](#api-routerplusoutlet) | 函数 | 按保留策略缓存、冻结上下文并渲染页面实例。 |
| [`RouterPlusRetained`](#api-routerplusretained) | 函数 | 隐藏时继续挂载子树，使用最后的活动上下文。 |
| [`RouterPlusRetainedProps`](#api-routerplusretainedprops) | 接口 | 保留容器属性。 |
| [`RetainedHost`](#api-retainedhost) | 类型别名 | 仅负责显示／隐藏的 React 宿主组件，实例与缓存生命周期由库持有。 |
| [`createReactRoutes`](#api-createreactroutes) | 函数 | 由页面目录生成 React Router 路由记录。 |
| [`CreateReactRoutesOptions`](#api-createreactroutesoptions) | 接口 | 路由生成选项：组件与布局映射、包装与转换。 |
| [`ReactRouteRecord`](#api-reactrouterecord) | 接口 | 生成的 React 路由记录。 |
| [`RouteComponent`](#api-routecomponent) | 类型别名 | 路由组件类型。 |
| [`RouterPlusOverlay`](#api-routerplusoverlay) | 函数 | 安装默认覆盖层与 DOM 目标运行时。 |
| [`RouterPlusOverlayProps`](#api-routerplusoverlayprops) | 接口 | 覆盖层属性。 |
| [`OverlayTheme`](#api-overlaytheme) | 接口 | App 控制的覆盖层层级、遮罩与默认组件外观。 |
| [`OverlayZIndexRange`](#api-overlayzindexrange) | 接口 | 默认层级的包含式 min／max 范围。 |
| [`HighlightComponentProps`](#api-highlightcomponentprops) | 接口 | 默认与自定义高亮共用的 width、height、left、top、context 五参数合同。 |
| [`HighlightComponentContext`](#api-highlightcomponentcontext) | 接口 | 目标矩形、页面／高亮／导览状态、overlayRoot 与 next(step = 1)。 |
| [`HighlightRectangle`](#api-highlightrectangle) | 接口 | 测量后的宽高及视口坐标，单位为像素。 |
| [`DefaultHighlightComponentProps`](#api-defaulthighlightcomponentprops) | 接口 | 内置组件参数，在通用五参数之外接收 styles。 |
| [`DefaultHighlightStyles`](#api-defaulthighlightstyles) | 类型别名 | 仅用于内置高亮和气泡的样式参数，不包含公共层级策略。 |

## createReactRouterPlus {#api-createreactrouterplus}

装配 React Router 与 Plus，返回带稳定 Provider 的实例。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
createReactRouterPlus<C extends ElementType>(options: CreateReactRouterPlusOptions<C>): ReactRouterPlus
```

Assemble one Plus instance and a stable Provider; unmount disconnects, disposal stays explicit.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `CreateReactRouterPlusOptions<C>` | 必需 | — |

**返回：** `ReactRouterPlus`

## CreateReactRouterPlusOptions {#api-createreactrouterplusoptions}

React 装配选项；`router` 接受元素、构造函数元组或 Data Router。

**导入：** `@jangts/router-plus/react`。

### 定义

**类型别名:** `CreateReactRouterPlusOptions<C>`

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `C` | `ElementType` | `ElementType` |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus \| undefined` | 可省略 | 传入已有 Core 实例时不再提供页面目录等构造选项。 |
| `disposeOnUnmount` | `boolean \| undefined` | 可省略 | Dispose an owned instance after the last Provider unmount; StrictMode probes are ignored. |
| `router` | `NativeRouter.DataRouter \| ReactElement<{ children?: ReactNode; }, string \| JSXElementConstructor<any>> \| readonly [component: C, ...props: {} extends ComponentProps<C> ? [props?: NoInfer<ComponentProps<C>> \| undefined] : [props: NoInfer<ComponentProps<C>>]]` | 必需 | JSX 元素、`[组件, props?]` 元组或 Data Router 实例。 |
| `hooks` | `ReactRouterHooks \| undefined` | 可省略 | 仅用于 JSX 或元组输入，适配应用已有地址 hooks。 |

## ReactRouterTuple {#api-reactroutertuple}

`[组件, props?]` 构造函数元组；props 从组件推断。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
type ReactRouterTuple<C> = readonly [
  component: C,
  ...props: {} extends ComponentProps<C>
    ? [props?: NoInfer<ComponentProps<C>>]
    : [props: NoInfer<ComponentProps<C>>],
];
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `C` | `ElementType` | `ElementType` |

## ReactRouterPlus {#api-reactrouterplus}

React 实例，额外提供 `Provider`。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface ReactRouterPlus extends RouterPlus
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `Provider` | `ComponentType<{ children?: ReactNode; }>` | 必需 | 见类型定义。 |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | 必需 | Run existing commands in order, waiting for installed sources and framework publication. |
| `connect` | `(connection: RouterConnection) => () => void` | 必需 | 见类型定义。 |
| `disconnect` | `() => void` | 必需 | 见类型定义。 |
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

## createReactProvider {#api-createreactprovider}

用应用已有的原生 hooks 创建底层 Provider 组件。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
createReactProvider(hooks: ReactRouterHooks): ({ plus, children }: RouterPlusProviderProps) => FunctionComponentElement<ProviderProps<RouterPlus | null>>
```

Create a provider using the router's existing hooks.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `hooks` | `ReactRouterHooks` | 必需 | — |

**返回：** `({ plus, children }: RouterPlusProviderProps) => FunctionComponentElement<ProviderProps<RouterPlus \| null>>`

## usePlusContext {#api-usepluscontext}

读取最近 Provider 提供的 Plus 实例。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
usePlusContext(): RouterPlus
```

无调用参数。

**返回：** `RouterPlus`

## ReactRouterHooks {#api-reactrouterhooks}

适配原生 Router 所需的地址与导航 hooks。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface ReactRouterHooks
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `useLocation` | `() => ReactRouterLocationLike` | 必需 | 见类型定义。 |
| `useNavigate` | `() => NavigateFunction` | 必需 | 见类型定义。 |
| `useBlocker` | `((shouldBlock: (transition: { nextLocation: ReactRouterLocationLike; }) => boolean) => Blocker) \| undefined` | 可省略 | 见类型定义。 |

## ReactRouterLocationLike {#api-reactrouterlocationlike}

适配层可读取的地址对象。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface ReactRouterLocationLike
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `pathname` | `string` | 必需 | 见类型定义。 |
| `search` | `string` | 必需 | 见类型定义。 |
| `hash` | `string` | 必需 | 见类型定义。 |
| `state` | `unknown` | 可省略 | 见类型定义。 |
| `key` | `string \| undefined` | 可省略 | 见类型定义。 |

## RouterPlusProviderProps {#api-routerplusproviderprops}

Provider 属性。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface RouterPlusProviderProps
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | 保持实例在渲染之间稳定，通常放在模块作用域。 |
| `children` | `ReactNode` | 可省略 | 见类型定义。 |

## useRouterPlus {#api-userouterplus}

读取绑定到当前边界的 Plus 门面。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
useRouterPlus(): import("../core/types.js").RouterPlus & { resolveLink(target: import("../core/types.js").LinkTarget, options?: NavigateOptions): import("../core/types.js").LinkResolution | null; }
```

Preserve the caller's route-relative semantics before submitting an absolute target.

无调用参数。

**返回：** `RouterPlus & { resolveLink(target: import("../core/types.js").LinkTarget, options?: NavigateOptions): import("../core/types.js").LinkResolution \| null; }`

## usePageContext {#api-usepagecontext}

订阅当前页面上下文。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
usePageContext(): PageContext
```

无调用参数。

**返回：** `PageContext`

## usePageMatch {#api-usepagematch}

读取当前页面匹配。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
usePageMatch(): PageMatch | null
```

无调用参数。

**返回：** `PageMatch \| null`

## useRpState {#api-userpstate}

创建原生 React state，可选登记 ID／导航规则，返回原生 tuple。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 重载 1

```ts
useRpState<S>(initial: S | (() => S), idOrOptions?: StateIdOrOptions<NoInfer<S>>): [S, Dispatch<SetStateAction<S>>]
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `S \| (() => S)` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | 可省略 | — |

**返回：** `[S, Dispatch<SetStateAction<S>>]`

#### 重载 2

```ts
useRpState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
```

无调用参数。

**返回：** `[S \| undefined, Dispatch<SetStateAction<S \| undefined>>]`

## useReactState {#api-usereactstate}

登记已有 tuple、ref、callback 或访问器；返回 void，自动清理。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 重载 1

```ts
useReactState<S>(source: StateTuple<S> | RefObject<S> | StateAccessor<S>, idOrOptions?: StateIdOrOptions<NoInfer<S>>): void
```

Index an existing tuple, ref, callback or receiver-safe accessor in the nearest page scope.
Omitted options skip registration. Only committed sources become visible; effect cleanup
unregisters automatically. Accessor notifications follow component commits, not polling.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `source` | `StateTuple<S> \| RefObject<S> \| StateAccessor<S>` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | 可省略 | — |

**返回：** `void`

#### 重载 2

```ts
useReactState<F extends (...args: never[]) => unknown>(source: F, idOrOptions?: StateIdOrOptions<NoInfer<F>>): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `source` | `F` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<F>> \| undefined` | 可省略 | — |

**返回：** `void`

## useRpRef {#api-userpref}

创建原生 ref，可选登记访问入口。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 重载 1

```ts
useRpRef<T>(initialValue: T): RefObject<T>
```

`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
(`initialValue`). The returned object will persist for the full lifetime of the component.

Note that `useRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
value around similar to how you’d use instance fields in classes.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initialValue` | `T` | 必需 | — |

**返回：** `RefObject<T>`

#### 重载 2

```ts
useRpRef<T>(initialValue: T | null): RefObject<T | null>
```

`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
(`initialValue`). The returned object will persist for the full lifetime of the component.

Note that `useRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
value around similar to how you’d use instance fields in classes.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initialValue` | `T \| null` | 必需 | — |

**返回：** `RefObject<T \| null>`

#### 重载 3

```ts
useRpRef<T>(initialValue: T | undefined): RefObject<T | undefined>
```

`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
(`initialValue`). The returned object will persist for the full lifetime of the component.

Note that `useRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
value around similar to how you’d use instance fields in classes.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initialValue` | `T \| undefined` | 必需 | — |

**返回：** `RefObject<T \| undefined>`

#### 重载 4

```ts
useRpRef<T>(initial: T, idOrOptions: StateIdOrOptions<NoInfer<T>> | undefined): MutableRefObject<T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `T` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | 必需 | — |

**返回：** `MutableRefObject<T>`

#### 重载 5

```ts
useRpRef<T>(initial: T | null, idOrOptions: StateIdOrOptions<NoInfer<T | null>> | undefined): RefObject<T | null>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `T \| null` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T \| null>> \| undefined` | 必需 | — |

**返回：** `RefObject<T \| null>`

#### 重载 6

```ts
useRpRef<T>(initial: T | undefined, idOrOptions: StateIdOrOptions<NoInfer<T | undefined>> | undefined): MutableRefObject<T | undefined>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `T \| undefined` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T \| undefined>> \| undefined` | 必需 | — |

**返回：** `MutableRefObject<T \| undefined>`

## useRpContext {#api-userpcontext}

读取原生 context，可选登记只读来源。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
useRpContext<T>(context: Context<T>, idOrOptions?: StateIdOrOptions<NoInfer<T>>): T
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `context` | `Context<T>` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | 可省略 | — |

**返回：** `T`

## useRpCallback {#api-userpcallback}

创建原生 callback，可选登记 callState 调用入口。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
useRpCallback<T extends (...args: any[]) => any>(callback: T, dependencies: DependencyList, idOrOptions?: StateIdOrOptions<NoInfer<T>>): T
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `callback` | `T` | 必需 | — |
| `dependencies` | `DependencyList` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | 可省略 | — |

**返回：** `T`

## usePageQuery {#api-usepagequery}

读取并更新查询参数。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
usePageQuery(defaultInit?: PageQueryInit): [URLSearchParams, SetPageQuery]
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `defaultInit` | `PageQueryInit \| undefined` | 可省略 | — |

**返回：** `[URLSearchParams, SetPageQuery]`

## PageQueryInit {#api-pagequeryinit}

查询参数初始值。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
type PageQueryInit = | string
  | URLSearchParams
  | Record<string, string | readonly string[]>
  | readonly (readonly [string, string])[];
```

## SetPageQuery {#api-setpagequery}

顺序合并同轮函数式修改，返回真实导航回执的查询参数写入口。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface SetPageQuery
```

#### 调用

```ts
SetPageQuery(next: PageQueryInit | ((previous: URLSearchParams) => PageQueryInit), options?: NavigateOptions): Promise<CommandResult>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `next` | `PageQueryInit \| ((previous: URLSearchParams) => PageQueryInit)` | 必需 | — |
| `options` | `NavigateOptions \| undefined` | 可省略 | — |

**返回：** `Promise<CommandResult>`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `patch` | `(patch: QueryRecord, options?: NavigateOptions) => Promise<CommandResult>` | 必需 | Update selected query keys; undefined removes a key and arrays preserve repeated values. |

## usePageLeaveGuard {#api-usepageleaveguard}

在组件生命周期内注册离开守卫。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
usePageLeaveGuard(guard: GlobalGuard): void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `guard` | `GlobalGuard` | 必需 | — |

**返回：** `void`

## useHighlight {#api-usehighlight}

读取高亮状态并触发或清除高亮。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
useHighlight(): { state: HighlightState | null; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }
```

无调用参数。

**返回：** `{ state: HighlightState \| null; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }`

## useTour {#api-usetour}

读取导览状态并控制导览。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
useTour(): { state: TourState | null; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }
```

无调用参数。

**返回：** `{ state: TourState \| null; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }`

## RouterPlusLink {#api-routerpluslink}

通过 Plus 解析目标的链接组件。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusLink({
  to,
  children,
  fallback,
  replace,
  state,
  preventScrollReset,
  viewTransition,
  relative,
  onClick,
  disabled,
  reloadDocument,
  className,
  title,
  target,
  download,
  ...rest
}: RouterPlusLinkProps)
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{   to,   children,   fallback,   replace,   state,   preventScrollReset,   viewTransition,   relative,   onClick,   disabled,   reloadDocument,   className,   title,   target,   download,   ...rest }` | `RouterPlusLinkProps` | 必需 | — |

**返回：** `React.ReactElement \| null`

## RouterPlusLinkProps {#api-routerpluslinkprops}

链接组件属性。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface RouterPlusLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'onClick'
>
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `to` | `LinkTarget` | 必需 | 见类型定义。 |
| `children` | `ReactNode` | 可省略 | 见类型定义。 |
| `fallback` | `ReactNode` | 可省略 | Rendered when the target cannot be resolved. |
| `disabled` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `reloadDocument` | `boolean \| undefined` | 可省略 | Let the browser perform a full document navigation for href targets. |
| `replace` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `state` | `unknown` | 可省略 | 见类型定义。 |
| `preventScrollReset` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `viewTransition` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `relative` | `"path" \| "route" \| "index" \| "to" \| "none" \| undefined` | 可省略 | 见类型定义。 |
| `onClick` | `((event: import("react").MouseEvent<HTMLElement>) => void) \| undefined` | 可省略 | 见类型定义。 |

## RouterPlusRedirect {#api-routerplusredirect}

声明式重定向组件。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusRedirect({ to, replace, state }: RouterPlusRedirectProps): null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{ to, replace = true, state }` | `RouterPlusRedirectProps` | 必需 | — |

**返回：** `null`

## RouterPlusRedirectProps {#api-routerplusredirectprops}

重定向属性。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface RouterPlusRedirectProps
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `to` | `PageTarget` | 必需 | 见类型定义。 |
| `replace` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `state` | `unknown` | 可省略 | 见类型定义。 |

## RouterPlusScope {#api-routerplusscope}

只绑定 Plus 上下文，不增加 DOM 或生命周期行为。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusScope({ context, children, }: { readonly context: PageContext; readonly children?: ReactNode; }): FunctionComponentElement<ProviderProps<RouterPlus | null>>
```

Context-only scope binding for caller-owned hosts; does not add DOM or navigation.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{   context,   children, }` | `{ readonly context: PageContext; readonly children?: ReactNode; }` | 必需 | — |

**返回：** `FunctionComponentElement<ProviderProps<RouterPlus \| null>>`

## RouterPlusBoundary {#api-routerplusboundary}

把子树绑定到显式上下文或当前实例，并登记 DOM 宿主。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusBoundary({ children, context: supplied }: RouterPlusBoundaryProps): ReactElement<{ ref: RefObject<HTMLDivElement | null>; 'data-router-plus-boundary': string; }, string | JSXElementConstructor<any>>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{ children, context: supplied }` | `RouterPlusBoundaryProps` | 必需 | — |

**返回：** `ReactElement<{ ref: RefObject<HTMLDivElement \| null>; 'data-router-plus-boundary': string; }, string \| JSXElementConstructor<any>>`

## RouterPlusBoundaryProps {#api-routerplusboundaryprops}

边界属性。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface RouterPlusBoundaryProps
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | 可省略 | 见类型定义。 |
| `context` | `PageContext \| undefined` | 可省略 | 见类型定义。 |

## RouterPlusOutlet {#api-routerplusoutlet}

按保留策略缓存、冻结上下文并渲染页面实例。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusOutlet({ children, host, }: { readonly children?: ReactNode; readonly host?: RetainedHost; }): FunctionComponentElement<FragmentProps> | FunctionComponentElement<{ readonly host?: RetainedHost; }>
```

Optional automatic instance host; children keep caller-controlled composition available.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{   children,   host, }` | `{ readonly children?: ReactNode; readonly host?: RetainedHost; }` | 必需 | — |

**返回：** `FunctionComponentElement<FragmentProps> \| FunctionComponentElement<{ readonly host?: RetainedHost; }>`

## RouterPlusRetained {#api-routerplusretained}

隐藏时继续挂载子树，使用最后的活动上下文。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusRetained({ active, children, context, host }: RouterPlusRetainedProps): ReactElement<{ readonly active: boolean; readonly children?: ReactNode; }, string | JSXElementConstructor<any>> | DetailedReactHTMLElement<{ hidden: boolean; 'data-router-plus-retained': string; }, HTMLElement>
```

Keep a subtree mounted while hidden; state and DOM survive deactivation.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{ active, children, context, host }` | `RouterPlusRetainedProps` | 必需 | — |

**返回：** `React.ReactElement \| null`

## RouterPlusRetainedProps {#api-routerplusretainedprops}

保留容器属性。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface RouterPlusRetainedProps
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `host` | `RetainedHost \| undefined` | 可省略 | 见类型定义。 |
| `active` | `boolean` | 必需 | 默认宿主在 false 时继续挂载；自定义宿主遵守其框架生命周期语义。 |
| `context` | `PageContext \| undefined` | 可省略 | 见类型定义。 |
| `children` | `ReactNode` | 可省略 | 见类型定义。 |

## RetainedHost {#api-retainedhost}

仅负责显示／隐藏的 React 宿主组件，实例与缓存生命周期由库持有。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
type RetainedHost = ComponentType<{
  readonly active: boolean;
  readonly children?: ReactNode;
}>;
```

## createReactRoutes {#api-createreactroutes}

由页面目录生成 React Router 路由记录。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
createReactRoutes(pages: readonly PageDefinition[], options?: CreateReactRoutesOptions): readonly ReactRouteRecord[]
```

Build route records from page definitions, nesting by `parentId`.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | 必需 | — |
| `options` | `CreateReactRoutesOptions` | 可省略 | — |

**返回：** `readonly ReactRouteRecord[]`

## CreateReactRoutesOptions {#api-createreactroutesoptions}

路由生成选项：组件与布局映射、包装与转换。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface CreateReactRoutesOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `components` | `Readonly<Record<string, ReactElement<unknown, string \| JSXElementConstructor<any>> \| RouteComponent>> \| undefined` | 可省略 | 见类型定义。 |
| `layouts` | `Readonly<Record<string, ComponentType<{ readonly children?: ReactNode; }>>> \| undefined` | 可省略 | 见类型定义。 |
| `plus` | `RouterPlus \| undefined` | 可省略 | 见类型定义。 |
| `wrap` | `((element: ReactElement, page: PageDefinition) => ReactElement) \| undefined` | 可省略 | 见类型定义。 |

## ReactRouteRecord {#api-reactrouterecord}

生成的 React 路由记录。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface ReactRouteRecord
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `path` | `string` | 必需 | 见类型定义。 |
| `name` | `string` | 必需 | 见类型定义。 |
| `id` | `string \| undefined` | 可省略 | 见类型定义。 |
| `handle` | `Readonly<Record<string, unknown>> \| undefined` | 可省略 | 见类型定义。 |
| `element` | `ReactElement<unknown, string \| JSXElementConstructor<any>> \| undefined` | 可省略 | 见类型定义。 |
| `children` | `readonly ReactRouteRecord[] \| undefined` | 可省略 | 见类型定义。 |
| `meta` | `Readonly<Record<string, unknown>>` | 必需 | 见类型定义。 |

## RouteComponent {#api-routecomponent}

路由组件类型。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
type RouteComponent = ComponentType<Record<string, never>> | ComponentType<{ readonly children?: ReactNode }>;
```

## RouterPlusOverlay {#api-routerplusoverlay}

安装默认覆盖层与 DOM 目标运行时。

**导入：** `@jangts/router-plus/react`。

### 定义

#### 调用

```ts
RouterPlusOverlay({ root, interactive, installRuntime, injectStyles, className, theme, highlightComponent, }: RouterPlusOverlayProps): ReactPortal | null
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `{   root,   interactive,   installRuntime,   injectStyles,   className,   theme,   highlightComponent, }` | `RouterPlusOverlayProps` | 必需 | — |

**返回：** `ReactPortal \| null`

## RouterPlusOverlayProps {#api-routerplusoverlayprops}

覆盖层属性。

**导入：** `@jangts/router-plus/react`。

### 定义

```ts
interface RouterPlusOverlayProps extends Omit<MountOverlayOptions, 'highlightRenderer'>
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `highlightComponent` | `ComponentType<HighlightComponentProps> \| undefined` | 可省略 | 见类型定义。 |
| `className` | `string \| undefined` | 可省略 | Persistent App class, retained when per-highlight classes change. |
| `root` | `Element \| Document \| ShadowRoot \| undefined` | 可省略 | 见类型定义。 |
| `installRuntime` | `boolean \| undefined` | 可省略 | Install the DOM runtime together with the overlay; defaults to true. |
| `injectStyles` | `boolean \| undefined` | 可省略 | Set false when importing overlay.css or providing the complete stylesheet yourself. |
| `interactive` | `boolean \| undefined` | 可省略 | 见类型定义。 |
| `theme` | `OverlayTheme \| undefined` | 可省略 | 见类型定义。 |

## OverlayTheme {#api-overlaytheme}

App 控制的覆盖层层级、遮罩与默认组件外观。

**导入：** `@jangts/router-plus/react`。

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

**导入：** `@jangts/router-plus/react`。

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

**导入：** `@jangts/router-plus/react`。

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

**导入：** `@jangts/router-plus/react`。

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

**导入：** `@jangts/router-plus/react`。

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

**导入：** `@jangts/router-plus/react`。

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

**导入：** `@jangts/router-plus/react`。

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

```tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createReactRouterPlus, RouterPlusLink, RouterPlusRedirect } from '@jangts/router-plus/react';

const plus = createReactRouterPlus({
  router: <BrowserRouter />,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

function App() {
  return (
    <>
      <RouterPlusLink to="/beta/42">打开 Beta</RouterPlusLink>
      <Routes>
        <Route path="/" element={<RouterPlusRedirect to="/alpha" />} />
        <Route path="/alpha" element={<p>Alpha</p>} />
        <Route path="/beta/:id" element={<p>Beta</p>} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <plus.Provider><App /></plus.Provider>,
);
```

### 页面内读取状态

```tsx
import { useRpState, usePageQuery } from '@jangts/router-plus/react';

function Alpha() {
  const [state, setState] = useRpState({ count: 0 }, 'counter');
  const [section, setSection] = useRpState('summary', { id: 'section', query: true, values: ['summary', 'details'] });
  const [query, setQuery] = usePageQuery();

  return (
    <section>
      <p>{state.count}</p>
      <button onClick={() => setState({ count: state.count + 1 })}>+1</button>
      <button onClick={() => setSection('details')}>{section}</button>
      <button onClick={() => setQuery({ page: '2' })}>{query.get('page') ?? '1'}</button>
    </section>
  );
}
```

### Data Router

React Router DOM >=6.4

```tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
```

Data Router 的页面放在原路由记录里，Provider 不接收 children；loader、重定向与原生路由组织仍由 React Router 负责。原生拦截还要求所传路由具备 blocker API；缺失时仍能检查 Plus 发起的导航。

### 已有来源

```tsx
import { useState } from 'react';
import { useReactState } from '@jangts/router-plus/react';
function Counter() {
  const state = useState(0);
  useReactState(state, { id: 'count', query: true });
  useReactState({ get: () => state[0] * 2 }, 'doubled');
  return <button onClick={() => state[1](n => n + 1)}>{state[0]}</button>;
}
```
