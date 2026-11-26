---
title: "测试工具"
outline: [2, 3]
---

# 测试工具

`@jangts/router-plus/testing` 提供无 DOM 消费端 fixture；`testing/vue` 和 `testing/react` 分别复用 Vue Test Utils 与 React Testing Library。完整接入见[消费端测试](../guide/testing)。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`createRouterPlusTest`](#api-createrouterplustest) | 函数 | 创建独立的无 DOM RP 测试 fixture。 |
| [`RouterPlusTestOptions`](#api-routerplustestoptions) | 类型别名 | 复用生产配置，使用 initial 指定初始地址。 |
| [`mountRouterPlus`](#api-mountrouterplus) | 函数 | 装配 Vue Test Utils、RP 和原生内存路由。 |
| [`MountRouterPlusOptions`](#api-mountrouterplusoptions) | 类型别名 | Vue fixture 的路由与原生挂载选项。 |
| [`renderRouterPlus`](#api-renderrouterplus) | 函数 | 装配 React Testing Library、RP 和原生内存路由。 |
| [`RenderRouterPlusOptions`](#api-renderrouterplusoptions) | 类型别名 | React fixture 的 UI 或 data routes 与原生渲染选项。 |
| [`createMemoryConnection`](#api-creatememoryconnection) | 函数 | 创建内存导航连接。 |
| [`MemoryConnection`](#api-memoryconnection) | 接口 | 内存连接接口：地址、历史、能力与手动变更。 |
| [`MemoryConnectionOptions`](#api-memoryconnectionoptions) | 接口 | 内存连接选项。 |
| [`createMemoryHost`](#api-creatememoryhost) | 函数 | 创建内存实例宿主。 |
| [`MemoryHost`](#api-memoryhost) | 接口 | 内存宿主接口。 |
| [`createFakeBridge`](#api-createfakebridge) | 函数 | 创建可观测的假状态桥。 |
| [`FakeBridge`](#api-fakebridge) | 接口 | 假状态桥接口。 |

## createRouterPlusTest {#api-createrouterplustest}

创建独立的无 DOM RP 测试 fixture。

**导入：** `@jangts/router-plus/testing`。

### 定义

#### 调用

```ts
createRouterPlusTest(options: RouterPlusTestOptions): Promise<{ plus: RouterPlus; connection: MemoryConnection; dispose: () => Promise<void>; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `RouterPlusTestOptions` | 必需 | — |

**返回：** `Promise<{ plus: RouterPlus; connection: MemoryConnection; dispose: () => Promise<void>; }>`

## RouterPlusTestOptions {#api-routerplustestoptions}

复用生产配置，使用 initial 指定初始地址。

**导入：** `@jangts/router-plus/testing`。

### 定义

**类型别名:** `RouterPlusTestOptions`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `origin` | `string \| undefined` | 可省略 | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | 可省略 | Dispose this module-owned instance during replacement. Undefined/false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | 必需 | 见类型定义。 |
| `matcher` | `RouteMatcher \| undefined` | 可省略 | 见类型定义。 |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initialSnapshot` | `RouterSnapshot \| undefined` | 可省略 | 见类型定义。 |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | 可省略 | 见类型定义。 |
| `globalKey` | `string \| false \| undefined` | 可省略 | 见类型定义。 |
| `apiVersion` | `number \| undefined` | 可省略 | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | 可省略 | 见类型定义。 |
| `pageLink` | `PageLinkOptions \| undefined` | 可省略 | 见类型定义。 |
| `historyStateKey` | `string \| undefined` | 可省略 | 见类型定义。 |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | 可省略 | 见类型定义。 |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | 可省略 | 见类型定义。 |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `openExternal` | `((href: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initial` | `string \| undefined` | 可省略 | 见类型定义。 |

## mountRouterPlus {#api-mountrouterplus}

装配 Vue Test Utils、RP 和原生内存路由。

**导入：** `@jangts/router-plus/testing/vue`。

### 定义

#### 调用

```ts
mountRouterPlus(component: Component, options: MountRouterPlusOptions): Promise<{ wrapper: VueWrapper<any, any>; plus: VueRouterPlus; router: Router; dispose: () => Promise<void>; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `component` | `Component` | 必需 | — |
| `options` | `MountRouterPlusOptions` | 必需 | — |

**返回：** `Promise<{ wrapper: VueWrapper<any, any>; plus: VueRouterPlus; router: Router; dispose: () => Promise<void>; }>`

## MountRouterPlusOptions {#api-mountrouterplusoptions}

Vue fixture 的路由与原生挂载选项。

**导入：** `@jangts/router-plus/testing/vue`。

### 定义

**类型别名:** `MountRouterPlusOptions`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `origin` | `string \| undefined` | 可省略 | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | 可省略 | Dispose this module-owned instance during replacement. Undefined/false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | 必需 | 见类型定义。 |
| `matcher` | `RouteMatcher \| undefined` | 可省略 | 见类型定义。 |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initialSnapshot` | `RouterSnapshot \| undefined` | 可省略 | 见类型定义。 |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | 可省略 | 见类型定义。 |
| `globalKey` | `string \| false \| undefined` | 可省略 | 见类型定义。 |
| `apiVersion` | `number \| undefined` | 可省略 | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | 可省略 | 见类型定义。 |
| `pageLink` | `PageLinkOptions \| undefined` | 可省略 | 见类型定义。 |
| `historyStateKey` | `string \| undefined` | 可省略 | 见类型定义。 |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | 可省略 | 见类型定义。 |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | 可省略 | 见类型定义。 |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `openExternal` | `((href: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initial` | `string \| undefined` | 可省略 | 见类型定义。 |
| `routes` | `RouteRecordRaw[]` | 必需 | 见类型定义。 |
| `mountOptions` | `MountingOptions<any, {}> \| undefined` | 可省略 | 见类型定义。 |

## renderRouterPlus {#api-renderrouterplus}

装配 React Testing Library、RP 和原生内存路由。

**导入：** `@jangts/router-plus/testing/react`。

### 定义

#### 调用

```ts
renderRouterPlus(options: RenderRouterPlusOptions): Promise<{ result: RenderResult<typeof import("@testing-library/dom/types/queries.js"), HTMLElement, HTMLElement>; plus: ReactRouterPlus; router: Router$1 | null; run<T>(operation: () => T | Promise<T>): Promise<T>; dispose: () => Promise<void>; }>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `RenderRouterPlusOptions` | 必需 | — |

**返回：** `Promise<{ result: RenderResult<typeof import("@testing-library/dom/types/queries.js"), HTMLElement, HTMLElement>; plus: ReactRouterPlus; router: Router$1 \| null; run<T>(operation: () => T \| Promise<T>): Promise<T>; dispose: () => Promise<void>; }>`

## RenderRouterPlusOptions {#api-renderrouterplusoptions}

React fixture 的 UI 或 data routes 与原生渲染选项。

**导入：** `@jangts/router-plus/testing/react`。

### 定义

**类型别名:** `RenderRouterPlusOptions`

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `origin` | `string \| undefined` | 可省略 | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | 可省略 | Dispose this module-owned instance during replacement. Undefined/false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | 必需 | 见类型定义。 |
| `matcher` | `RouteMatcher \| undefined` | 可省略 | 见类型定义。 |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initialSnapshot` | `RouterSnapshot \| undefined` | 可省略 | 见类型定义。 |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | 可省略 | 见类型定义。 |
| `globalKey` | `string \| false \| undefined` | 可省略 | 见类型定义。 |
| `apiVersion` | `number \| undefined` | 可省略 | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | 可省略 | 见类型定义。 |
| `pageLink` | `PageLinkOptions \| undefined` | 可省略 | 见类型定义。 |
| `historyStateKey` | `string \| undefined` | 可省略 | 见类型定义。 |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | 可省略 | 见类型定义。 |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | 可省略 | 见类型定义。 |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `openExternal` | `((href: string) => void) \| undefined` | 可省略 | 见类型定义。 |
| `initial` | `string \| undefined` | 可省略 | 见类型定义。 |
| `renderOptions` | `Omit<RenderOptions<typeof import("@testing-library/dom/types/queries.js"), HTMLElement, HTMLElement>, "queries"> \| undefined` | 可省略 | 见类型定义。 |
| `routes` | `RouteObject[] \| undefined` | 可省略 | 见类型定义。 |
| `ui` | `ReactElement<unknown, string \| JSXElementConstructor<any>> \| undefined` | 可省略 | 见类型定义。 |

## createMemoryConnection {#api-creatememoryconnection}

创建内存导航连接。

**导入：** `@jangts/router-plus/testing`。

### 定义

#### 调用

```ts
createMemoryConnection(options?: MemoryConnectionOptions): MemoryConnection
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `MemoryConnectionOptions` | 可省略 | — |

**返回：** `MemoryConnection`

## MemoryConnection {#api-memoryconnection}

内存连接接口：地址、历史、能力与手动变更。

**导入：** `@jangts/router-plus/testing`。

### 定义

```ts
interface MemoryConnection extends RouterConnection
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `location` | `RouterLocation` | 必需 | 见类型定义。 |
| `history` | `readonly RouterLocation[]` | 必需 | 见类型定义。 |
| `capabilities` | `ConnectionCapabilities` | 必需 | 见类型定义。 |
| `setLocation` | `(location: Partial<RouterLocation>, source?: CommittedChange["source"]) => void` | 必需 | 手动提交地址变化，用于模拟原生跳转。 |
| `blockNext` | `(message?: string) => void` | 必需 | 让下一次提交返回 blocked。 |
| `initial` | `RouterLocation` | 必需 | 见类型定义。 |
| `matcher` | `RouteMatcher \| undefined` | 可省略 | Framework matching/building semantics; bound before the initial snapshot is applied. |
| `intercept` | `((check: (target: RouterLocation) => Promise<GuardResult>) => () => void) \| undefined` | 可省略 | Native transition gate; Plus-originated transitions carry an already checked token. |
| `commit` | `(request: CommitRequest) => Promise<CommitResult> \| CommitResult` | 必需 | 见类型定义。 |
| `subscribe` | `(listener: (change: CommittedChange) => void) => () => void` | 必需 | 见类型定义。 |
| `back` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | 可省略 | 见类型定义。 |
| `forward` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | 可省略 | 见类型定义。 |
| `go` | `((delta: number) => Promise<CommitResult> \| CommitResult) \| undefined` | 可省略 | 见类型定义。 |

## MemoryConnectionOptions {#api-memoryconnectionoptions}

内存连接选项。

**导入：** `@jangts/router-plus/testing`。

### 定义

```ts
interface MemoryConnectionOptions
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `initial` | `Partial<RouterLocation> \| undefined` | 可省略 | 见类型定义。 |
| `capabilities` | `ConnectionCapabilities \| undefined` | 可省略 | 见类型定义。 |

## createMemoryHost {#api-creatememoryhost}

创建内存实例宿主。

**导入：** `@jangts/router-plus/testing`。

### 定义

#### 调用

```ts
createMemoryHost(): MemoryHost
```

无调用参数。

**返回：** `MemoryHost`

## MemoryHost {#api-memoryhost}

内存宿主接口。

**导入：** `@jangts/router-plus/testing`。

### 定义

```ts
interface MemoryHost extends InstanceHost
```

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `calls` | `readonly string[]` | 必需 | 见类型定义。 |
| `mounted` | `boolean` | 必需 | 见类型定义。 |
| `active` | `boolean` | 必需 | 见类型定义。 |
| `disposed` | `boolean` | 必需 | 见类型定义。 |
| `mount` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `activate` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `deactivate` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `dispose` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `ready` | `(() => boolean) \| undefined` | 可省略 | 见类型定义。 |
| `root` | `(() => Element \| ShadowRoot \| null) \| undefined` | 可省略 | 见类型定义。 |

## createFakeBridge {#api-createfakebridge}

创建可观测的假状态桥。

**导入：** `@jangts/router-plus/testing`。

### 定义

#### 调用

```ts
createFakeBridge<S>(initial: S): FakeBridge<S>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `S` | 必需 | — |

**返回：** `FakeBridge<S>`

## FakeBridge {#api-fakebridge}

假状态桥接口。

**导入：** `@jangts/router-plus/testing`。

### 定义

```ts
interface FakeBridge<S> extends PageStateBridge<S>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | — |

### 字段

| 字段 | 类型 | 必需 | 说明 |
| --- | --- | --- | --- |
| `value` | `S` | 必需 | 见类型定义。 |
| `listeners` | `ReadonlySet<() => void>` | 必需 | 见类型定义。 |
| `set` | `(next: S) => void` | 必需 | 见类型定义。 |
| `read` | `() => S` | 必需 | 见类型定义。 |
| `call` | `((...args: unknown[]) => unknown \| Promise<unknown>) \| undefined` | 可省略 | 见类型定义。 |
| `write` | `((next: S) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `patch` | `((value: Record<string, unknown>) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `reset` | `(() => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `subscribe` | `((listener: () => void) => () => void) \| undefined` | 可省略 | 见类型定义。 |
| `snapshot` | `(() => unknown \| Promise<unknown>) \| undefined` | 可省略 | 见类型定义。 |
| `restore` | `((value: unknown) => void \| Promise<void>) \| undefined` | 可省略 | 见类型定义。 |
| `whenSettled` | `((signal?: AbortSignal) => void \| Promise<void>) \| undefined` | 可省略 | Await framework publication after a grouped mutation; custom asynchronous work remains app-owned. |

## 使用示例

```ts
import { createMemoryConnection, createMemoryHost } from '@jangts/router-plus/testing';
import { createRouterPlus } from '@jangts/router-plus';

const connection = createMemoryConnection({ initial: { pathname: '/alpha' } });
const plus = createRouterPlus({ pages, globalKey: false });
plus.connect(connection);

const host = createMemoryHost();
const stop = plus.registerHost(host);
await plus.whenReady();

connection.setLocation({ pathname: '/beta/42' });
```

`createFakeBridge(initial)` 返回可读写的假状态桥，用于验证 delegation、快照和通知行为，不依赖任何状态库。
