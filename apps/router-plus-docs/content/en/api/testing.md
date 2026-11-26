---
title: "Testing utilities"
outline: [2, 3]
---

# Testing utilities

`@jangts/router-plus/testing` provides DOM-free consumer fixtures; `testing/vue` and `testing/react` reuse Vue Test Utils and React Testing Library. See [consumer testing](../guide/testing) for setup and batch examples.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`createRouterPlusTest`](#api-createrouterplustest) | function | Create an independent DOM-free RP fixture. |
| [`RouterPlusTestOptions`](#api-routerplustestoptions) | type alias | Production configuration with one initial address. |
| [`mountRouterPlus`](#api-mountrouterplus) | function | Mount Vue Test Utils with RP and native memory routing. |
| [`MountRouterPlusOptions`](#api-mountrouterplusoptions) | type alias | Vue routes and native mounting options. |
| [`renderRouterPlus`](#api-renderrouterplus) | function | Render React Testing Library with RP and native memory routing. |
| [`RenderRouterPlusOptions`](#api-renderrouterplusoptions) | type alias | React UI or data routes and native rendering options. |
| [`createMemoryConnection`](#api-creatememoryconnection) | function | Create an in-memory navigation connection. |
| [`MemoryConnection`](#api-memoryconnection) | interface | Memory connection interface: location, history, capabilities and manual changes. |
| [`MemoryConnectionOptions`](#api-memoryconnectionoptions) | interface | Memory connection options. |
| [`createMemoryHost`](#api-creatememoryhost) | function | Create an in-memory instance host. |
| [`MemoryHost`](#api-memoryhost) | interface | Memory host interface. |
| [`createFakeBridge`](#api-createfakebridge) | function | Create an observable fake state bridge. |
| [`FakeBridge`](#api-fakebridge) | interface | Fake state bridge interface. |

## createRouterPlusTest {#api-createrouterplustest}

Create an independent DOM-free RP fixture.

**Import:** `@jangts/router-plus/testing`。

### Definition

#### Call

```ts
createRouterPlusTest(options: RouterPlusTestOptions): Promise<{ plus: RouterPlus; connection: MemoryConnection; dispose: () => Promise<void>; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `RouterPlusTestOptions` | Required | — |

**Returns:** `Promise<{ plus: RouterPlus; connection: MemoryConnection; dispose: () => Promise<void>; }>`

## RouterPlusTestOptions {#api-routerplustestoptions}

Production configuration with one initial address.

**Import:** `@jangts/router-plus/testing`。

### Definition

**Type alias:** `RouterPlusTestOptions`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `origin` | `string \| undefined` | Optional | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | Optional | Dispose this module-owned instance during replacement. Undefined/false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | Required | See the type definition. |
| `matcher` | `RouteMatcher \| undefined` | Optional | See the type definition. |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | Optional | See the type definition. |
| `initialSnapshot` | `RouterSnapshot \| undefined` | Optional | See the type definition. |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | Optional | See the type definition. |
| `globalKey` | `string \| false \| undefined` | Optional | See the type definition. |
| `apiVersion` | `number \| undefined` | Optional | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | Optional | See the type definition. |
| `pageLink` | `PageLinkOptions \| undefined` | Optional | See the type definition. |
| `historyStateKey` | `string \| undefined` | Optional | See the type definition. |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | Optional | See the type definition. |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | Optional | See the type definition. |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | Optional | See the type definition. |
| `openExternal` | `((href: string) => void) \| undefined` | Optional | See the type definition. |
| `initial` | `string \| undefined` | Optional | See the type definition. |

## mountRouterPlus {#api-mountrouterplus}

Mount Vue Test Utils with RP and native memory routing.

**Import:** `@jangts/router-plus/testing/vue`。

### Definition

#### Call

```ts
mountRouterPlus(component: Component, options: MountRouterPlusOptions): Promise<{ wrapper: VueWrapper<any, any>; plus: VueRouterPlus; router: Router; dispose: () => Promise<void>; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `component` | `Component` | Required | — |
| `options` | `MountRouterPlusOptions` | Required | — |

**Returns:** `Promise<{ wrapper: VueWrapper<any, any>; plus: VueRouterPlus; router: Router; dispose: () => Promise<void>; }>`

## MountRouterPlusOptions {#api-mountrouterplusoptions}

Vue routes and native mounting options.

**Import:** `@jangts/router-plus/testing/vue`。

### Definition

**Type alias:** `MountRouterPlusOptions`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `origin` | `string \| undefined` | Optional | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | Optional | Dispose this module-owned instance during replacement. Undefined/false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | Required | See the type definition. |
| `matcher` | `RouteMatcher \| undefined` | Optional | See the type definition. |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | Optional | See the type definition. |
| `initialSnapshot` | `RouterSnapshot \| undefined` | Optional | See the type definition. |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | Optional | See the type definition. |
| `globalKey` | `string \| false \| undefined` | Optional | See the type definition. |
| `apiVersion` | `number \| undefined` | Optional | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | Optional | See the type definition. |
| `pageLink` | `PageLinkOptions \| undefined` | Optional | See the type definition. |
| `historyStateKey` | `string \| undefined` | Optional | See the type definition. |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | Optional | See the type definition. |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | Optional | See the type definition. |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | Optional | See the type definition. |
| `openExternal` | `((href: string) => void) \| undefined` | Optional | See the type definition. |
| `initial` | `string \| undefined` | Optional | See the type definition. |
| `routes` | `RouteRecordRaw[]` | Required | See the type definition. |
| `mountOptions` | `MountingOptions<any, {}> \| undefined` | Optional | See the type definition. |

## renderRouterPlus {#api-renderrouterplus}

Render React Testing Library with RP and native memory routing.

**Import:** `@jangts/router-plus/testing/react`。

### Definition

#### Call

```ts
renderRouterPlus(options: RenderRouterPlusOptions): Promise<{ result: RenderResult<typeof import("@testing-library/dom/types/queries.js"), HTMLElement, HTMLElement>; plus: ReactRouterPlus; router: Router$1 | null; run<T>(operation: () => T | Promise<T>): Promise<T>; dispose: () => Promise<void>; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `RenderRouterPlusOptions` | Required | — |

**Returns:** `Promise<{ result: RenderResult<typeof import("@testing-library/dom/types/queries.js"), HTMLElement, HTMLElement>; plus: ReactRouterPlus; router: Router$1 \| null; run<T>(operation: () => T \| Promise<T>): Promise<T>; dispose: () => Promise<void>; }>`

## RenderRouterPlusOptions {#api-renderrouterplusoptions}

React UI or data routes and native rendering options.

**Import:** `@jangts/router-plus/testing/react`。

### Definition

**Type alias:** `RenderRouterPlusOptions`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `origin` | `string \| undefined` | Optional | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | Optional | Dispose this module-owned instance during replacement. Undefined/false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | Required | See the type definition. |
| `matcher` | `RouteMatcher \| undefined` | Optional | See the type definition. |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | Optional | See the type definition. |
| `initialSnapshot` | `RouterSnapshot \| undefined` | Optional | See the type definition. |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | Optional | See the type definition. |
| `globalKey` | `string \| false \| undefined` | Optional | See the type definition. |
| `apiVersion` | `number \| undefined` | Optional | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | Optional | See the type definition. |
| `pageLink` | `PageLinkOptions \| undefined` | Optional | See the type definition. |
| `historyStateKey` | `string \| undefined` | Optional | See the type definition. |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | Optional | See the type definition. |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | Optional | See the type definition. |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | Optional | See the type definition. |
| `openExternal` | `((href: string) => void) \| undefined` | Optional | See the type definition. |
| `initial` | `string \| undefined` | Optional | See the type definition. |
| `renderOptions` | `Omit<RenderOptions<typeof import("@testing-library/dom/types/queries.js"), HTMLElement, HTMLElement>, "queries"> \| undefined` | Optional | See the type definition. |
| `routes` | `RouteObject[] \| undefined` | Optional | See the type definition. |
| `ui` | `ReactElement<unknown, string \| JSXElementConstructor<any>> \| undefined` | Optional | See the type definition. |

## createMemoryConnection {#api-creatememoryconnection}

Create an in-memory navigation connection.

**Import:** `@jangts/router-plus/testing`。

### Definition

#### Call

```ts
createMemoryConnection(options?: MemoryConnectionOptions): MemoryConnection
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `MemoryConnectionOptions` | Optional | — |

**Returns:** `MemoryConnection`

## MemoryConnection {#api-memoryconnection}

Memory connection interface: location, history, capabilities and manual changes.

**Import:** `@jangts/router-plus/testing`。

### Definition

```ts
interface MemoryConnection extends RouterConnection
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `location` | `RouterLocation` | Required | See the type definition. |
| `history` | `readonly RouterLocation[]` | Required | See the type definition. |
| `capabilities` | `ConnectionCapabilities` | Required | See the type definition. |
| `setLocation` | `(location: Partial<RouterLocation>, source?: CommittedChange["source"]) => void` | Required | Commit a location change manually to simulate native navigation. |
| `blockNext` | `(message?: string) => void` | Required | Make the next commit return blocked. |
| `initial` | `RouterLocation` | Required | See the type definition. |
| `matcher` | `RouteMatcher \| undefined` | Optional | Framework matching/building semantics; bound before the initial snapshot is applied. |
| `intercept` | `((check: (target: RouterLocation) => Promise<GuardResult>) => () => void) \| undefined` | Optional | Native transition gate; Plus-originated transitions carry an already checked token. |
| `commit` | `(request: CommitRequest) => Promise<CommitResult> \| CommitResult` | Required | See the type definition. |
| `subscribe` | `(listener: (change: CommittedChange) => void) => () => void` | Required | See the type definition. |
| `back` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | Optional | See the type definition. |
| `forward` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | Optional | See the type definition. |
| `go` | `((delta: number) => Promise<CommitResult> \| CommitResult) \| undefined` | Optional | See the type definition. |

## MemoryConnectionOptions {#api-memoryconnectionoptions}

Memory connection options.

**Import:** `@jangts/router-plus/testing`。

### Definition

```ts
interface MemoryConnectionOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `initial` | `Partial<RouterLocation> \| undefined` | Optional | See the type definition. |
| `capabilities` | `ConnectionCapabilities \| undefined` | Optional | See the type definition. |

## createMemoryHost {#api-creatememoryhost}

Create an in-memory instance host.

**Import:** `@jangts/router-plus/testing`。

### Definition

#### Call

```ts
createMemoryHost(): MemoryHost
```

No call parameters.

**Returns:** `MemoryHost`

## MemoryHost {#api-memoryhost}

Memory host interface.

**Import:** `@jangts/router-plus/testing`。

### Definition

```ts
interface MemoryHost extends InstanceHost
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `calls` | `readonly string[]` | Required | See the type definition. |
| `mounted` | `boolean` | Required | See the type definition. |
| `active` | `boolean` | Required | See the type definition. |
| `disposed` | `boolean` | Required | See the type definition. |
| `mount` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `activate` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `deactivate` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `dispose` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `ready` | `(() => boolean) \| undefined` | Optional | See the type definition. |
| `root` | `(() => Element \| ShadowRoot \| null) \| undefined` | Optional | See the type definition. |

## createFakeBridge {#api-createfakebridge}

Create an observable fake state bridge.

**Import:** `@jangts/router-plus/testing`。

### Definition

#### Call

```ts
createFakeBridge<S>(initial: S): FakeBridge<S>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `S` | Required | — |

**Returns:** `FakeBridge<S>`

## FakeBridge {#api-fakebridge}

Fake state bridge interface.

**Import:** `@jangts/router-plus/testing`。

### Definition

```ts
interface FakeBridge<S> extends PageStateBridge<S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | — |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `S` | Required | See the type definition. |
| `listeners` | `ReadonlySet<() => void>` | Required | See the type definition. |
| `set` | `(next: S) => void` | Required | See the type definition. |
| `read` | `() => S` | Required | See the type definition. |
| `call` | `((...args: unknown[]) => unknown \| Promise<unknown>) \| undefined` | Optional | See the type definition. |
| `write` | `((next: S) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `patch` | `((value: Record<string, unknown>) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `reset` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `subscribe` | `((listener: () => void) => () => void) \| undefined` | Optional | See the type definition. |
| `snapshot` | `(() => unknown \| Promise<unknown>) \| undefined` | Optional | See the type definition. |
| `restore` | `((value: unknown) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `whenSettled` | `((signal?: AbortSignal) => void \| Promise<void>) \| undefined` | Optional | Await framework publication after a grouped mutation; custom asynchronous work remains app-owned. |

## Examples

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

`createFakeBridge(initial)` returns a writable fake state bridge for verifying delegation, snapshots and notifications without any store library.
