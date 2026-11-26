---
title: "Core API"
outline: [2, 3]
---

# Core API

`createRouterPlus` creates a framework-independent instance. The page catalog, target resolution, commands, guards, plugins, state and interactions live here; framework adapters and DOM capabilities load from separate entries.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`createRouterPlus`](#api-createrouterplus) | function | Create a framework-independent Plus instance from pages, plugins, state, connection and interaction options. |
| [`RouterPlusImpl`](#api-routerplusimpl) | class | Default `RouterPlus` implementation; normally created through `createRouterPlus` rather than directly. |
| [`ROUTER_PLUS_VERSION`](#api-router_plus_version) | constant | Current package semver string. |
| [`ROUTER_PLUS_API_VERSION`](#api-router_plus_api_version) | constant | Public API contract version, an integer. It is `1` and independent of package semver. |
| [`createPageLink`](#api-createpagelink) | function | Encode a page target as a semantic link using the configured `pageLink` scheme. |
| [`parsePageLink`](#api-parsepagelink) | function | Parse a semantic link into a navigation target without executing effects. |
| [`attachGlobal`](#api-attachglobal) | function | Attach the instance debug facade to a global property; an occupied key is rejected. |
| [`detachGlobal`](#api-detachglobal) | function | Remove the facade installed by this instance without deleting values written later. |
| [`DEFAULT_GLOBAL_KEY`](#api-default_global_key) | constant | Default browser facade name: `__ROUTER_PLUS__`. |
| [`toGlobalFacade`](#api-toglobalfacade) | function | Project an instance into a debug facade without installation privileges. |
| [`defaultMatcher`](#api-defaultmatcher) | constant | Default path matcher supporting ordinary named parameters and a trailing splat. |
| [`RouteMatcher`](#api-routematcher) | interface | Path matching and href construction interface; framework adapters supply native implementations. |
| [`RouteMatch`](#api-routematch) | interface | Page id and parameters returned by the default matcher. |

## createRouterPlus {#api-createrouterplus}

Create a framework-independent Plus instance from pages, plugins, state, connection and interaction options.

**Import:** `@jangts/router-plus`。

### Definition

#### Call

```ts
createRouterPlus(options: CreateRouterPlusOptions): RouterPlus
```

Create a Router Plus instance.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `CreateRouterPlusOptions` | Required | — |

**Returns:** `RouterPlus`

## RouterPlusImpl {#api-routerplusimpl}

Default `RouterPlus` implementation; normally created through `createRouterPlus` rather than directly.

**Import:** `@jangts/router-plus`。

### Definition

```ts
class RouterPlusImpl extends RouterPlus, CommandHost
```

#### Constructor

```ts
new RouterPlusImpl(options: CreateRouterPlusOptions): RouterPlusImpl
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `CreateRouterPlusOptions` | Required | — |

**Returns:** `RouterPlusImpl`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `version` | `"0.8.0"` | Required | See the type definition. |
| `apiVersion` | `1` | Required | See the type definition. |
| `ready` | `Promise<void>` | Required | See the type definition. |
| `hasCustomRenderer` | `boolean` | Required | See the type definition. |
| `connected` | `boolean` | Required | See the type definition. |
| `pages` | `PageCatalog` | Required | See the type definition. |

### Member index

| Member | Purpose |
| --- | --- |
| [`connect`](#member-routerplusimpl-connect) | See the full signature below. |
| [`disconnect`](#member-routerplusimpl-disconnect) | See the full signature below. |
| [`reportLocation`](#member-routerplusimpl-reportlocation) | See the full signature below. |
| [`execute`](#member-routerplusimpl-execute) | See the full signature below. |
| [`use`](#member-routerplusimpl-use) | See the full signature below. |
| [`unuse`](#member-routerplusimpl-unuse) | See the full signature below. |
| [`registerGuard`](#member-routerplusimpl-registerguard) | See the full signature below. |
| [`resolveLink`](#member-routerplusimpl-resolvelink) | See the full signature below. |
| [`resolveTarget`](#member-routerplusimpl-resolvetarget) | See the full signature below. |
| [`resolveHref`](#member-routerplusimpl-resolvehref) | See the full signature below. |
| [`match`](#member-routerplusimpl-match) | See the full signature below. |
| [`navigate`](#member-routerplusimpl-navigate) | See the full signature below. |
| [`replace`](#member-routerplusimpl-replace) | See the full signature below. |
| [`patchQuery`](#member-routerplusimpl-patchquery) | Apply partial URL edits through the same queue used by framework query helpers. |
| [`back`](#member-routerplusimpl-back) | See the full signature below. |
| [`forward`](#member-routerplusimpl-forward) | See the full signature below. |
| [`go`](#member-routerplusimpl-go) | See the full signature below. |
| [`getContext`](#member-routerplusimpl-getcontext) | See the full signature below. |
| [`getInstance`](#member-routerplusimpl-getinstance) | See the full signature below. |
| [`getState`](#member-routerplusimpl-getstate) | See the full signature below. |
| [`setState`](#member-routerplusimpl-setstate) | See the full signature below. |
| [`patchState`](#member-routerplusimpl-patchstate) | See the full signature below. |
| [`resetState`](#member-routerplusimpl-resetstate) | See the full signature below. |
| [`callState`](#member-routerplusimpl-callstate) | See the full signature below. |
| [`inspectState`](#member-routerplusimpl-inspectstate) | Return frozen metadata for installed sources, without touching their live values. |
| [`listStateKeys`](#member-routerplusimpl-liststatekeys) | See the full signature below. |
| [`getTab`](#member-routerplusimpl-gettab) | See the full signature below. |
| [`setTab`](#member-routerplusimpl-settab) | See the full signature below. |
| [`retain`](#member-routerplusimpl-retain) | See the full signature below. |
| [`release`](#member-routerplusimpl-release) | See the full signature below. |
| [`registerHost`](#member-routerplusimpl-registerhost) | See the full signature below. |
| [`scope`](#member-routerplusimpl-scope) | Bind operations to a stable instance without mutating the router's active context. |
| [`whenReady`](#member-routerplusimpl-whenready) | See the full signature below. |
| [`snapshot`](#member-routerplusimpl-snapshot) | See the full signature below. |
| [`restore`](#member-routerplusimpl-restore) | See the full signature below. |
| [`transformRoutes`](#member-routerplusimpl-transformroutes) | See the full signature below. |
| [`registerTarget`](#member-routerplusimpl-registertarget) | See the full signature below. |
| [`unregisterTarget`](#member-routerplusimpl-unregistertarget) | See the full signature below. |
| [`listTargets`](#member-routerplusimpl-listtargets) | See the full signature below. |
| [`highlight`](#member-routerplusimpl-highlight) | See the full signature below. |
| [`clearHighlight`](#member-routerplusimpl-clearhighlight) | See the full signature below. |
| [`getHighlight`](#member-routerplusimpl-gethighlight) | See the full signature below. |
| [`startTour`](#member-routerplusimpl-starttour) | See the full signature below. |
| [`nextTourStep`](#member-routerplusimpl-nexttourstep) | See the full signature below. |
| [`prevTourStep`](#member-routerplusimpl-prevtourstep) | See the full signature below. |
| [`stopTour`](#member-routerplusimpl-stoptour) | See the full signature below. |
| [`getTour`](#member-routerplusimpl-gettour) | See the full signature below. |
| [`focus`](#member-routerplusimpl-focus) | See the full signature below. |
| [`scrollTo`](#member-routerplusimpl-scrollto) | See the full signature below. |
| [`registerNavigationAction`](#member-routerplusimpl-registernavigationaction) | See the full signature below. |
| [`executeAction`](#member-routerplusimpl-executeaction) | See the full signature below. |
| [`subscribe`](#member-routerplusimpl-subscribe) | See the full signature below. |
| [`dispose`](#member-routerplusimpl-dispose) | Reentrant callers share completion, including calls made by disposed subscribers. |

#### connect {#member-routerplusimpl-connect}

Instance method.

```ts
connect(connection: RouterConnection): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `connection` | `RouterConnection` | Required | — |

**Returns:** `() => void`

#### disconnect {#member-routerplusimpl-disconnect}

Instance method.

```ts
disconnect(): void
```

No call parameters.

**Returns:** `void`

#### reportLocation {#member-routerplusimpl-reportlocation}

Instance method.

```ts
reportLocation(location: RouterLocation): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `location` | `RouterLocation` | Required | — |

**Returns:** `void`

#### execute {#member-routerplusimpl-execute}

Instance method.

```ts
execute(command: RouterCommand): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `command` | `RouterCommand` | Required | — |

**Returns:** `Promise<CommandResult>`

```ts
execute(commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `commands` | `readonly RouterCommand[]` | Required | — |
| `options` | `CommandSequenceOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandSequenceResult>`

#### use {#member-routerplusimpl-use}

Instance method.

```ts
use(plugin: RouterPlusPlugin): Promise<void>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plugin` | `RouterPlusPlugin` | Required | — |

**Returns:** `Promise<void>`

#### unuse {#member-routerplusimpl-unuse}

Instance method.

```ts
unuse(id: string, options?: { readonly cascade?: boolean; }): Promise<void>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | — |
| `options` | `{ readonly cascade?: boolean; }` | Optional | — |

**Returns:** `Promise<void>`

#### registerGuard {#member-routerplusimpl-registerguard}

Instance method.

```ts
registerGuard(guard: GlobalGuard, options?: { readonly priority?: number; }): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `guard` | `GlobalGuard` | Required | — |
| `options` | `{ readonly priority?: number; }` | Optional | — |

**Returns:** `() => void`

#### resolveLink {#member-routerplusimpl-resolvelink}

Instance method.

```ts
resolveLink(target: LinkTarget): LinkResolution | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `LinkTarget` | Required | — |

**Returns:** `LinkResolution \| null`

#### resolveTarget {#member-routerplusimpl-resolvetarget}

Instance method.

```ts
resolveTarget(target: PageTarget): NavigationPlan | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `PageTarget` | Required | — |

**Returns:** `NavigationPlan \| null`

#### resolveHref {#member-routerplusimpl-resolvehref}

Instance method.

```ts
resolveHref(target: PageTarget): string | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `PageTarget` | Required | — |

**Returns:** `string \| null`

#### match {#member-routerplusimpl-match}

Instance method.

```ts
match(pathname: string): PageMatch | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `pathname` | `string` | Required | — |

**Returns:** `PageMatch \| null`

#### navigate {#member-routerplusimpl-navigate}

Instance method.

```ts
navigate(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `PageTarget` | Required | — |
| `options` | `NavigateOptions` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### replace {#member-routerplusimpl-replace}

Instance method.

```ts
replace(target: PageTarget, options?: NavigateOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `PageTarget` | Required | — |
| `options` | `NavigateOptions` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### patchQuery {#member-routerplusimpl-patchquery}

Instance method.

Apply partial URL edits through the same queue used by framework query helpers.

```ts
patchQuery(patch: import("./types.js").QueryRecord, options?: NavigateOptions): Promise<CommandResult>
```

Apply partial URL edits through the same queue used by framework query helpers.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `patch` | `Readonly<Record<string, string \| readonly string[] \| undefined>>` | Required | — |
| `options` | `NavigateOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### back {#member-routerplusimpl-back}

Instance method.

```ts
back(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### forward {#member-routerplusimpl-forward}

Instance method.

```ts
forward(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### go {#member-routerplusimpl-go}

Instance method.

```ts
go(delta: number): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `delta` | `number` | Required | — |

**Returns:** `Promise<CommandResult>`

#### getContext {#member-routerplusimpl-getcontext}

Instance method.

```ts
getContext(): PageContext
```

No call parameters.

**Returns:** `PageContext`

#### getInstance {#member-routerplusimpl-getinstance}

Instance method.

```ts
getInstance(): PageInstance | null
```

No call parameters.

**Returns:** `PageInstance \| null`

#### getState {#member-routerplusimpl-getstate}

Instance method.

```ts
getState<T = unknown>(key?: string): T
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `key` | `string` | Optional | — |

**Returns:** `T`

#### setState {#member-routerplusimpl-setstate}

Instance method.

```ts
setState(value: unknown, key?: string): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | Required | — |
| `key` | `string` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### patchState {#member-routerplusimpl-patchstate}

Instance method.

```ts
patchState(value: Record<string, unknown>, key?: string): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `Record<string, unknown>` | Required | — |
| `key` | `string` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### resetState {#member-routerplusimpl-resetstate}

Instance method.

```ts
resetState(key?: string): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `key` | `string` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### callState {#member-routerplusimpl-callstate}

Instance method.

```ts
callState(id: string, ...args: unknown[]): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | — |
| `args` | `unknown[]` | Rest parameter | — |

**Returns:** `Promise<CommandResult>`

#### inspectState {#member-routerplusimpl-inspectstate}

Instance method.

Return frozen metadata for installed sources, without touching their live values.

```ts
inspectState(): readonly StateInspection[]
```

Return frozen metadata for installed sources, without touching their live values.

No call parameters.

**Returns:** `readonly StateInspection[]`

```ts
inspectState(id: string): StateInspection | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | — |

**Returns:** `StateInspection \| null`

#### listStateKeys {#member-routerplusimpl-liststatekeys}

Instance method.

```ts
listStateKeys(): readonly string[]
```

No call parameters.

**Returns:** `readonly string[]`

#### getTab {#member-routerplusimpl-gettab}

Instance method.

```ts
getTab(): string | null
```

No call parameters.

**Returns:** `string \| null`

#### setTab {#member-routerplusimpl-settab}

Instance method.

```ts
setTab(tab: string): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `tab` | `string` | Required | — |

**Returns:** `Promise<CommandResult>`

#### retain {#member-routerplusimpl-retain}

Instance method.

```ts
retain(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### release {#member-routerplusimpl-release}

Instance method.

```ts
release(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### registerHost {#member-routerplusimpl-registerhost}

Instance method.

```ts
registerHost(host: InstanceHost, context?: PageContext): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `host` | `InstanceHost` | Required | — |
| `context` | `PageContext` | Optional | — |

**Returns:** `() => void`

#### scope {#member-routerplusimpl-scope}

Instance method.

Bind operations to a stable instance without mutating the router's active context.

```ts
scope(context?: PageContext): RouterPlus
```

Bind operations to a stable instance without mutating the router's active context.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `context` | `PageContext` | Optional | — |

**Returns:** `RouterPlus`

#### whenReady {#member-routerplusimpl-whenready}

Instance method.

```ts
whenReady(): Promise<void>
```

No call parameters.

**Returns:** `Promise<void>`

#### snapshot {#member-routerplusimpl-snapshot}

Instance method.

```ts
snapshot(): Promise<import("./types.js").RouterSnapshot>
```

No call parameters.

**Returns:** `Promise<RouterSnapshot>`

#### restore {#member-routerplusimpl-restore}

Instance method.

```ts
restore(snapshot: import("./types.js").RouterSnapshot): Promise<void>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `snapshot` | `RouterSnapshot` | Required | — |

**Returns:** `Promise<void>`

#### transformRoutes {#member-routerplusimpl-transformroutes}

Instance method.

```ts
transformRoutes<T>(routes: readonly T[], framework: "react" | "vue"): readonly T[]
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `routes` | `readonly T[]` | Required | — |
| `framework` | `"react" \| "vue"` | Required | — |

**Returns:** `readonly T[]`

#### registerTarget {#member-routerplusimpl-registertarget}

Instance method.

```ts
registerTarget(id: string, resolve: () => TargetAnchor | null): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | — |
| `resolve` | `() => TargetAnchor \| null` | Required | — |

**Returns:** `() => void`

#### unregisterTarget {#member-routerplusimpl-unregistertarget}

Instance method.

```ts
unregisterTarget(id: string): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | — |

**Returns:** `void`

#### listTargets {#member-routerplusimpl-listtargets}

Instance method.

```ts
listTargets(): readonly string[]
```

No call parameters.

**Returns:** `readonly string[]`

#### highlight {#member-routerplusimpl-highlight}

Instance method.

```ts
highlight(target: TargetRef, options?: HighlightOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `TargetRef` | Required | — |
| `options` | `HighlightOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### clearHighlight {#member-routerplusimpl-clearhighlight}

Instance method.

```ts
clearHighlight(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### getHighlight {#member-routerplusimpl-gethighlight}

Instance method.

```ts
getHighlight(): HighlightState | null
```

No call parameters.

**Returns:** `HighlightState \| null`

#### startTour {#member-routerplusimpl-starttour}

Instance method.

```ts
startTour(steps: readonly TourStep[], options?: TourOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `steps` | `readonly TourStep[]` | Required | — |
| `options` | `TourOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### nextTourStep {#member-routerplusimpl-nexttourstep}

Instance method.

```ts
nextTourStep(step?: number): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `step` | `number` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### prevTourStep {#member-routerplusimpl-prevtourstep}

Instance method.

```ts
prevTourStep(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### stopTour {#member-routerplusimpl-stoptour}

Instance method.

```ts
stopTour(): Promise<CommandResult>
```

No call parameters.

**Returns:** `Promise<CommandResult>`

#### getTour {#member-routerplusimpl-gettour}

Instance method.

```ts
getTour(): TourState | null
```

No call parameters.

**Returns:** `TourState \| null`

#### focus {#member-routerplusimpl-focus}

Instance method.

```ts
focus(target: TargetRef, options?: FocusOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `TargetRef` | Required | — |
| `options` | `FocusOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### scrollTo {#member-routerplusimpl-scrollto}

Instance method.

```ts
scrollTo(target: TargetRef, options?: ScrollOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `TargetRef` | Required | — |
| `options` | `ScrollOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### registerNavigationAction {#member-routerplusimpl-registernavigationaction}

Instance method.

```ts
registerNavigationAction(id: string, handler: import("./types.js").NavigationActionHandler): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | — |
| `handler` | `NavigationActionHandler` | Required | — |

**Returns:** `() => void`

#### executeAction {#member-routerplusimpl-executeaction}

Instance method.

```ts
executeAction(actionId: string, payload?: unknown, context?: PageContext): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `actionId` | `string` | Required | — |
| `payload` | `unknown` | Optional | — |
| `context` | `PageContext` | Optional | — |

**Returns:** `Promise<CommandResult>`

#### subscribe {#member-routerplusimpl-subscribe}

Instance method.

```ts
subscribe(listener: (event: RouterEvent) => void): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `listener` | `(event: RouterEvent) => void` | Required | — |

**Returns:** `() => void`

#### dispose {#member-routerplusimpl-dispose}

Instance method.

Reentrant callers share completion, including calls made by disposed subscribers.

```ts
dispose(): Promise<void>
```

Reentrant callers share completion, including calls made by disposed subscribers.

No call parameters.

**Returns:** `Promise<void>`

## ROUTER_PLUS_VERSION {#api-router_plus_version}

Current package semver string.

**Import:** `@jangts/router-plus`。

### Definition

```ts
const ROUTER_PLUS_VERSION: "0.8.0"
```

## ROUTER_PLUS_API_VERSION {#api-router_plus_api_version}

Public API contract version, an integer. It is `1` and independent of package semver.

**Import:** `@jangts/router-plus`。

### Definition

```ts
const ROUTER_PLUS_API_VERSION: 1
```

## createPageLink {#api-createpagelink}

Encode a page target as a semantic link using the configured `pageLink` scheme.

**Import:** `@jangts/router-plus`。

### Definition

#### Call

```ts
createPageLink(target: { readonly path: string; readonly tab?: string; }, options: PageLinkOptions): string
```

Build a caller-configurable page link; never infers a business scheme.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `target` | `{ readonly path: string; readonly tab?: string; }` | Required | — |
| `options` | `PageLinkOptions` | Required | — |

**Returns:** `string`

## parsePageLink {#api-parsepagelink}

Parse a semantic link into a navigation target without executing effects.

**Import:** `@jangts/router-plus`。

### Definition

#### Call

```ts
parsePageLink(value: string, options: PageLinkOptions): { readonly path: string; readonly tab?: string; } | null
```

Parse a page link produced by `createPageLink`.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `string` | Required | — |
| `options` | `PageLinkOptions` | Required | — |

**Returns:** `{ readonly path: string; readonly tab?: string; } \| null`

## attachGlobal {#api-attachglobal}

Attach the instance debug facade to a global property; an occupied key is rejected.

**Import:** `@jangts/router-plus`。

### Definition

#### Call

```ts
attachGlobal(plus: RouterPlus, key?: string): () => void
```

Reject occupied keys, including inherited and explicitly undefined properties.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `key` | `string` | Optional | — |

**Returns:** `() => void`

## detachGlobal {#api-detachglobal}

Remove the facade installed by this instance without deleting values written later.

**Import:** `@jangts/router-plus`。

### Definition

#### Call

```ts
detachGlobal(key?: string): void
```

Remove only the exact facade we installed; foreign replacements survive cleanup.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `key` | `string` | Optional | — |

**Returns:** `void`

## DEFAULT_GLOBAL_KEY {#api-default_global_key}

Default browser facade name: `__ROUTER_PLUS__`.

**Import:** `@jangts/router-plus`。

### Definition

```ts
const DEFAULT_GLOBAL_KEY: "__ROUTER_PLUS__"
```

## toGlobalFacade {#api-toglobalfacade}

Project an instance into a debug facade without installation privileges.

**Import:** `@jangts/router-plus`。

### Definition

#### Call

```ts
toGlobalFacade(plus: RouterPlus): RouterPlusGlobal
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |

**Returns:** `RouterPlusGlobal`

## defaultMatcher {#api-defaultmatcher}

Default path matcher supporting ordinary named parameters and a trailing splat.

**Import:** `@jangts/router-plus`。

### Definition

**undefined:** `defaultMatcher`

### Member index

| Member | Purpose |
| --- | --- |
| [`match`](#member-defaultmatcher-match) | See the full signature below. |
| [`build`](#member-defaultmatcher-build) | See the full signature below. |

#### match {#member-defaultmatcher-match}

```ts
defaultMatcher.match(template: string, pathname: string): RouteMatch | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `template` | `string` | Required | — |
| `pathname` | `string` | Required | — |

**Returns:** `RouteMatch \| null`

#### build {#member-defaultmatcher-build}

```ts
defaultMatcher.build(template: string, params: Readonly<Record<string, string>>): string | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `template` | `string` | Required | — |
| `params` | `Readonly<Record<string, string>>` | Required | — |

**Returns:** `string \| null`

## RouteMatcher {#api-routematcher}

Path matching and href construction interface; framework adapters supply native implementations.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouteMatcher
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `matchPages` | `((pages: readonly PageDefinition[], pathname: string) => { pageId: string; params: Readonly<Record<string, string>>; } \| null) \| undefined` | Optional | Optional native ranking across the entire directory. |
| `match` | `(template: string, pathname: string) => RouteMatch \| null` | Required | See the type definition. |
| `build` | `(template: string, params: Readonly<Record<string, string>>) => string \| null` | Required | See the type definition. |

## RouteMatch {#api-routematch}

Page id and parameters returned by the default matcher.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouteMatch
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `params` | `Readonly<Record<string, string>>` | Required | See the type definition. |

## Examples

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

### Targets and links

```ts
plus.resolveHref({ page: 'beta', params: { id: '42' }, values: { section: 'details' } });
plus.resolveLink({ action: 'open-settings', payload: { section: 'profile' } });
```

Page objects resolve by id; path objects may point outside the catalog. Resolution is synchronous and executes no guards, navigation or actions; only commands have side effects.

### Debug facade

Browsers expose `__ROUTER_PLUS__` by default for reading context and running commands. It is a debug surface, not an authorization boundary; set `globalKey: false` to disable it.

### Inspect installed capabilities

```ts
const source = plus.inspectState('filters');
if (source?.capabilities.call) await plus.callState(source.id);
const installed = plus.inspectState();
```

Return metadata for installed sources visible to this facade without reading values or executing getters/codecs. Unknown IDs, unmounted declarations and arbitrary field expansion return null. The console facade does not expose inspection.

### Sequential commands and source lifecycle

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

Groups wait for installed/restored sources and framework publication. Failure, timeout, cancellation, instance departure or active source replacement stops subsequent steps. Failures retain failedIndex and completed results, without rollback or retries. Subscriptions also expose state.unregistered, state.committed and disposed. whenReady does not wait for future components; application initialization remains explicit.
