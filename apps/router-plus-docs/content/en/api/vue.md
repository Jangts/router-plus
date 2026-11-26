---
title: "Vue entry"
outline: [2, 3]
---

# Vue entry

`@jangts/router-plus/vue` provides the plugin, composables, links, retained views, route generation and overlay. `app.use(plus)` installs both Vue Router and the Plus connection.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`createVueRouterPlus`](#api-createvuerouterplus) | function | Create the Vue plugin and connect Vue Router; the result also exposes the Core API. |
| [`CreateVueRouterPlusOptions`](#api-createvuerouterplusoptions) | type alias | Vue assembly options; pass `router` or reuse an existing Core. |
| [`VueRouterPlus`](#api-vuerouterplus) | interface | Vue instance with `install`, `connection` and a compatibility `plus` reference. |
| [`createVueConnection`](#api-createvueconnection) | function | Build a Vue Router connection usable without the plugin. |
| [`VueConnectionResult`](#api-vueconnectionresult) | interface | Vue connection, commit notification and cleanup. |
| [`VueRouteLike`](#api-vueroutelike) | interface | Minimal Vue Router route shape. |
| [`VueRouterLike`](#api-vuerouterlike) | interface | Minimal Vue Router shape; missing optional methods disable those capabilities. |
| [`ROUTER_PLUS_KEY`](#api-router_plus_key) | constant | Injection key for Vue `provide`/`inject`. |
| [`useRouterPlus`](#api-userouterplus) | function | Read the Plus instance provided by the application. |
| [`usePageContext`](#api-usepagecontext) | function | Subscribe to a read-only ref of the current page context. |
| [`usePageMatch`](#api-usepagematch) | function | Read the current page match. |
| [`useRpRef`](#api-userpref) | function | Create a native Vue ref with optional registration and query rules. |
| [`useRpReactiveState`](#api-userpreactivestate) | function | Create a native reactive container with optional registration. |
| [`useVueState`](#api-usevuestate) | function | Register existing Vue sources, callbacks or accessors; return void with effect-scope cleanup. |
| [`useRpComputedState`](#api-userpcomputedstate) | function | Create native computed values while preserving read/write types and capabilities. |
| [`usePageQuery`](#api-usepagequery) | function | Read and update query parameters through a read-only ref and `setQuery`. |
| [`PageQueryInit`](#api-pagequeryinit) | type alias | Initial query value. |
| [`usePageLeaveGuard`](#api-usepageleaveguard) | function | Register a leave guard in the component scope; it is removed on unmount. |
| [`useHighlight`](#api-usehighlight) | function | Read highlight state and trigger or clear a highlight. |
| [`useTour`](#api-usetour) | function | Read tour state and control the tour. |
| [`RouterPlusLink`](#api-routerpluslink) | constant | Vue link component. |
| [`RouterPlusRedirect`](#api-routerplusredirect) | constant | Vue declarative redirect component. |
| [`RouterPlusView`](#api-routerplusview) | constant | Wraps RouterView, caches instances by retention and freezes scope providers. |
| [`RouterPlusBoundary`](#api-routerplusboundary) | constant | Binds a subtree to an explicit context or the current instance. |
| [`RouterPlusRetained`](#api-routerplusretained) | constant | Keeps a subtree mounted while hidden. |
| [`createVueRoutes`](#api-createvueroutes) | function | Generate Vue Router records from the page catalog. |
| [`CreateVueRoutesOptions`](#api-createvueroutesoptions) | interface | Route generation options: component and layout maps, wrappers and transforms. |
| [`VueRouteRecord`](#api-vuerouterecord) | interface | Generated Vue route record. |
| [`RouterPlusOverlay`](#api-routerplusoverlay) | constant | Vue overlay component that installs and cleans up the default overlay. |
| [`OverlayTheme`](#api-overlaytheme) | interface | App-owned overlay stacking, mask and built-in component appearance. |
| [`OverlayZIndexRange`](#api-overlayzindexrange) | interface | Inclusive min/max bounds on the default stacking level. |
| [`HighlightComponentProps`](#api-highlightcomponentprops) | interface | Shared width, height, left, top and context contract for default/custom highlights. |
| [`HighlightComponentContext`](#api-highlightcomponentcontext) | interface | Target bounds, page/highlight/tour state, overlayRoot and next(step = 1). |
| [`HighlightRectangle`](#api-highlightrectangle) | interface | Measured pixel dimensions and viewport position. |
| [`DefaultHighlightComponentProps`](#api-defaulthighlightcomponentprops) | interface | Shared component props plus optional built-in styles. |
| [`DefaultHighlightStyles`](#api-defaulthighlightstyles) | type alias | Built-in highlight/bubble styles, excluding shared stacking policy. |

## createVueRouterPlus {#api-createvuerouterplus}

Create the Vue plugin and connect Vue Router; the result also exposes the Core API.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
createVueRouterPlus(options: CreateVueRouterPlusOptions): VueRouterPlus
```

Plugin owns connection cleanup; ordinary native Vue Router calls remain valid.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `CreateVueRouterPlusOptions` | Required | — |

**Returns:** `VueRouterPlus`

## CreateVueRouterPlusOptions {#api-createvuerouterplusoptions}

Vue assembly options; pass `router` or reuse an existing Core.

**Import:** `@jangts/router-plus/vue`。

### Definition

**Type alias:** `CreateVueRouterPlusOptions`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus \| undefined` | Optional | Reuse an application-owned Core; the factory will not dispose it. |
| `router` | `VueRouterLike` | Required | The app’s existing Vue Router instance. |

## VueRouterPlus {#api-vuerouterplus}

Vue instance with `install`, `connection` and a compatibility `plus` reference.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface VueRouterPlus extends RouterPlus
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | See the type definition. |
| `connection` | `RouterConnection` | Required | The connection used by the plugin, useful for diagnostics or tests. |
| `install` | `(app: App) => void` | Required | See the type definition. |
| `disconnect` | `() => void` | Required | See the type definition. |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | Required | Run existing commands in order, waiting for installed sources and framework publication. |
| `connect` | `(connection: RouterConnection) => () => void` | Required | See the type definition. |
| `connected` | `boolean` | Required | See the type definition. |
| `hasCustomRenderer` | `boolean` | Required | See the type definition. |
| `ready` | `Promise<void>` | Required | Resolves after the initially configured plugins finish installing. |
| `dispose` | `() => Promise<void>` | Required | Cancel pending work, uninstall plugins and detach the global facade. |
| `reportLocation` | `(location: RouterLocation) => void` | Required | See the type definition. |
| `scope` | `(context?: PageContext) => RouterPlus` | Required | Stable instance-bound facade; hidden instances retain their own context. |
| `whenReady` | `() => Promise<void>` | Required | See the type definition. |
| `snapshot` | `() => Promise<RouterSnapshot>` | Required | See the type definition. |
| `restore` | `(snapshot: RouterSnapshot) => Promise<void>` | Required | See the type definition. |
| `transformRoutes` | `<T>(routes: readonly T[], framework: "react" \| "vue") => readonly T[]` | Required | See the type definition. |
| `use` | `(plugin: RouterPlusPlugin) => Promise<void>` | Required | See the type definition. |
| `unuse` | `(id: string, options?: { readonly cascade?: boolean; }) => Promise<void>` | Required | See the type definition. |
| `registerGuard` | `(guard: GlobalGuard, options?: { readonly priority?: number; }) => () => void` | Required | Register a global guard (leave/enter) with an optional priority. |
| `navigate` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `replace` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `patchQuery` | `(patch: QueryRecord, options?: NavigateOptions) => Promise<CommandResult>` | Required | Patch named query parameters; undefined/empty arrays delete keys and unrelated parts survive. |
| `back` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `forward` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `go` | `(delta: number) => Promise<CommandResult>` | Required | See the type definition. |
| `resolveLink` | `(target: LinkTarget) => LinkResolution \| null` | Required | See the type definition. |
| `resolveTarget` | `(target: PageTarget) => NavigationPlan \| null` | Required | See the type definition. |
| `resolveHref` | `(target: PageTarget) => string \| null` | Required | See the type definition. |
| `match` | `(pathname: string) => PageMatch \| null` | Required | See the type definition. |
| `getContext` | `() => PageContext` | Required | See the type definition. |
| `getInstance` | `() => PageInstance \| null` | Required | See the type definition. |
| `getState` | `<T = unknown>(key?: string) => T` | Required | See the type definition. |
| `setState` | `(value: unknown, key?: string) => Promise<CommandResult>` | Required | See the type definition. |
| `patchState` | `(value: Record<string, unknown>, key?: string) => Promise<CommandResult>` | Required | See the type definition. |
| `resetState` | `(key?: string) => Promise<CommandResult>` | Required | See the type definition. |
| `callState` | `(id: string, ...args: unknown[]) => Promise<CommandResult>` | Required | See the type definition. |
| `listStateKeys` | `() => readonly string[]` | Required | See the type definition. |
| `inspectState` | `{ (): readonly StateInspection[]; (id: string): StateInspection \| null; }` | Required | Describe installed sources visible to this facade without reading native values. Describe one exact ID; unknown IDs and unmounted address declarations return null. |
| `getTab` | `() => string \| null` | Required | See the type definition. |
| `setTab` | `(tab: string) => Promise<CommandResult>` | Required | See the type definition. |
| `retain` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `release` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `registerHost` | `(host: InstanceHost) => () => void` | Required | See the type definition. |
| `registerTarget` | `(id: string, resolve: () => TargetAnchor \| null) => () => void` | Required | See the type definition. |
| `unregisterTarget` | `(id: string) => void` | Required | See the type definition. |
| `listTargets` | `() => readonly string[]` | Required | See the type definition. |
| `highlight` | `(target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `clearHighlight` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `getHighlight` | `() => HighlightState \| null` | Required | See the type definition. |
| `startTour` | `(steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `nextTourStep` | `(step?: number) => Promise<CommandResult>` | Required | See the type definition. |
| `prevTourStep` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `stopTour` | `() => Promise<CommandResult>` | Required | See the type definition. |
| `getTour` | `() => TourState \| null` | Required | See the type definition. |
| `focus` | `(target: TargetRef, options?: FocusOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `scrollTo` | `(target: TargetRef, options?: ScrollOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `registerNavigationAction` | `(id: string, handler: NavigationActionHandler) => () => void` | Required | See the type definition. |
| `executeAction` | `(actionId: string, payload?: unknown) => Promise<CommandResult>` | Required | See the type definition. |
| `subscribe` | `(listener: (event: RouterEvent) => void) => () => void` | Required | See the type definition. |
| `pages` | `PageCatalog` | Required | See the type definition. |
| `version` | `string` | Required | See the type definition. |
| `apiVersion` | `number` | Required | See the type definition. |

## createVueConnection {#api-createvueconnection}

Build a Vue Router connection usable without the plugin.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
createVueConnection(router: VueRouterLike): VueConnectionResult
```

Build a connection that can also be used without the Vue plugin.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `router` | `VueRouterLike` | Required | — |

**Returns:** `VueConnectionResult`

## VueConnectionResult {#api-vueconnectionresult}

Vue connection, commit notification and cleanup.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface VueConnectionResult
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `connection` | `RouterConnection` | Required | See the type definition. |
| `notify` | `(change: CommittedChange) => void` | Required | See the type definition. |
| `dispose` | `() => void` | Required | See the type definition. |

## VueRouteLike {#api-vueroutelike}

Minimal Vue Router route shape.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface VueRouteLike
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | `string` | Required | See the type definition. |
| `fullPath` | `string` | Required | See the type definition. |
| `hash` | `string` | Required | See the type definition. |
| `state` | `unknown` | Optional | See the type definition. |
| `matched` | `readonly { readonly meta?: Record<string, unknown>; readonly params?: Record<string, string \| string[]>; }[] \| undefined` | Optional | See the type definition. |
| `params` | `Record<string, string \| string[]> \| undefined` | Optional | See the type definition. |

## VueRouterLike {#api-vuerouterlike}

Minimal Vue Router shape; missing optional methods disable those capabilities.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface VueRouterLike
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `currentRoute` | `{ readonly value: VueRouteLike; }` | Required | See the type definition. |
| `options` | `{ readonly history: { readonly state: unknown; }; } \| undefined` | Optional | See the type definition. |
| `afterEach` | `(callback: (to: VueRouteLike, from: VueRouteLike, failure?: unknown) => void) => () => void` | Required | See the type definition. |
| `beforeEach` | `((callback: (to: VueRouteLike, from: VueRouteLike) => unknown) => () => void) \| undefined` | Optional | See the type definition. |
| `push` | `(to: unknown) => Promise<unknown> \| unknown` | Required | See the type definition. |
| `replace` | `((to: unknown) => Promise<unknown> \| unknown) \| undefined` | Optional | See the type definition. |
| `go` | `((delta: number) => void) \| undefined` | Optional | See the type definition. |

## ROUTER_PLUS_KEY {#api-router_plus_key}

Injection key for Vue `provide`/`inject`.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const ROUTER_PLUS_KEY: InjectionKey<RouterPlus>
```

## useRouterPlus {#api-userouterplus}

Read the Plus instance provided by the application.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
useRouterPlus(): RouterPlus
```

No call parameters.

**Returns:** `RouterPlus`

## usePageContext {#api-usepagecontext}

Subscribe to a read-only ref of the current page context.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
usePageContext(): Readonly<Ref<PageContext>>
```

No call parameters.

**Returns:** `Readonly<Ref<PageContext, PageContext>>`

## usePageMatch {#api-usepagematch}

Read the current page match.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
usePageMatch(): ComputedRef<PageMatch | null>
```

No call parameters.

**Returns:** `ComputedRef<PageMatch \| null>`

## useRpRef {#api-userpref}

Create a native Vue ref with optional registration and query rules.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Overload 1

```ts
useRpRef<T extends Ref>(value: T, idOrOptions?: RefRegistration<NoInfer<T>>): T
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `T` | Required | — |
| `idOrOptions` | `RefRegistration<NoInfer<T>> \| undefined` | Optional | — |

**Returns:** `T`

#### Overload 2

```ts
useRpRef<T>(value: T extends Ref ? never : T, idOrOptions?: StateIdOrOptions<NoInfer<UnwrapRef<T>>>): Ref<UnwrapRef<T>, UnwrapRef<T> | T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `T extends Ref<any, any> ? never : T` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<UnwrapRef<T>>> \| undefined` | Optional | — |

**Returns:** `Ref<UnwrapRef<T>, T \| UnwrapRef<T>>`

#### Overload 3

```ts
useRpRef<T = any>(): Ref<T | undefined>
```

No call parameters.

**Returns:** `Ref<T \| undefined, T \| undefined>`

## useRpReactiveState {#api-userpreactivestate}

Create a native reactive container with optional registration.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
useRpReactiveState<T extends object>(value: T, idOrOptions?: StateIdOrOptions<NoInfer<UnwrapNestedRefs<T>>>): Reactive<T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `T` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<UnwrapNestedRefs<T>>> \| undefined` | Optional | — |

**Returns:** `Reactive<T>`

## useVueState {#api-usevuestate}

Register existing Vue sources, callbacks or accessors; return void with effect-scope cleanup.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Overload 1

```ts
useVueState<F extends (...args: never[]) => unknown>(source: F, idOrOptions?: StateIdOrOptions<NoInfer<F>>): void
```

Index a native ref, reactive/readonly container, callback or accessor without copying it.
Omitted options skip registration. Component scopes own page bindings; other effect scopes
own router-wide bindings. The active scope unregisters automatically on disposal.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `source` | `F` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<F>> \| undefined` | Optional | — |

**Returns:** `void`

#### Overload 2

```ts
useVueState<R extends Ref>(source: R, idOrOptions?: RefRegistration<NoInfer<R>>): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `source` | `R` | Required | — |
| `idOrOptions` | `RefRegistration<NoInfer<R>> \| undefined` | Optional | — |

**Returns:** `void`

#### Overload 3

```ts
useVueState<S>(source: StateAccessor<S>, idOrOptions?: StateIdOrOptions<NoInfer<S>>): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `source` | `StateAccessor<S>` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | Optional | — |

**Returns:** `void`

#### Overload 4

```ts
useVueState<S extends object>(source: S extends Ref ? never : S, idOrOptions?: StateIdOrOptions<NoInfer<S>>): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `source` | `S extends Ref<any, any> ? never : S` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | Optional | — |

**Returns:** `void`

## useRpComputedState {#api-userpcomputedstate}

Create native computed values while preserving read/write types and capabilities.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Overload 1

```ts
useRpComputedState<T>(getter: ComputedGetter<T>, idOrOptions?: StateIdOrOptions<NoInfer<T>>): ComputedRef<T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `getter` | `ComputedGetter<T>` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | Optional | — |

**Returns:** `ComputedRef<T>`

#### Overload 2

```ts
useRpComputedState<T>(getter: ComputedGetter<T>, debug: DebuggerOptions | undefined, idOrOptions?: StateIdOrOptions<NoInfer<T>>): ComputedRef<T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `getter` | `ComputedGetter<T>` | Required | — |
| `debug` | `DebuggerOptions \| undefined` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | Optional | — |

**Returns:** `ComputedRef<T>`

#### Overload 3

```ts
useRpComputedState<T, S = T>(options: WritableComputedOptions<T, S>, idOrOptions?: [T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never): WritableComputedRef<T, S>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `WritableComputedOptions<T, S>` | Required | — |
| `idOrOptions` | `([T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never) \| undefined` | Optional | — |

**Returns:** `WritableComputedRef<T, S>`

#### Overload 4

```ts
useRpComputedState<T, S = T>(options: WritableComputedOptions<T, S>, debug: DebuggerOptions | undefined, idOrOptions?: [T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never): WritableComputedRef<T, S>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `WritableComputedOptions<T, S>` | Required | — |
| `debug` | `DebuggerOptions \| undefined` | Required | — |
| `idOrOptions` | `([T] extends [S] ? StateIdOrOptions<NoInfer<T>> : never) \| undefined` | Optional | — |

**Returns:** `WritableComputedRef<T, S>`

## usePageQuery {#api-usepagequery}

Read and update query parameters through a read-only ref and `setQuery`.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
usePageQuery(defaultInit?: PageQueryInit): { query: Readonly<Ref<ReadonlyMap<string, string | null>, ReadonlyMap<string, string | null>>>; patchQuery(patch: QueryRecord, options?: NavigateOptions): Promise<CommandResult>; setQuery(next: PageQueryInit | ((previous: URLSearchParams) => PageQueryInit), options?: NavigateOptions): Promise<CommandResult>; }
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `defaultInit` | `PageQueryInit \| undefined` | Optional | — |

**Returns:** `React.ReactElement \| null`

## PageQueryInit {#api-pagequeryinit}

Initial query value.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
type PageQueryInit = | string
  | URLSearchParams
  | Record<string, string | readonly string[]>
  | readonly (readonly [string, string])[];
```

## usePageLeaveGuard {#api-usepageleaveguard}

Register a leave guard in the component scope; it is removed on unmount.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
usePageLeaveGuard(guard: import("../core/types.js").GlobalGuard): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `guard` | `GlobalGuard` | Required | — |

**Returns:** `void`

## useHighlight {#api-usehighlight}

Read highlight state and trigger or clear a highlight.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
useHighlight(): { state: Readonly<Ref<HighlightState | null>>; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }
```

No call parameters.

**Returns:** `{ state: Readonly<Ref<HighlightState \| null>>; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }`

## useTour {#api-usetour}

Read tour state and control the tour.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
useTour(): { state: Readonly<Ref<TourState | null>>; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }
```

No call parameters.

**Returns:** `{ state: Readonly<Ref<TourState \| null>>; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }`

## RouterPlusLink {#api-routerpluslink}

Vue link component.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const RouterPlusLink: DefineComponent<ExtractPropTypes<{ to: { type: PropType<LinkTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; disabled: { type: BooleanConstructor; default: boolean; }; reloadDocument: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; preventScrollReset: { type: BooleanConstructor; default: boolean; }; viewTransition: { type: BooleanConstructor; default: boolean; }; relative: { type: PropType<NavigateOptions["relative"]>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ to: { type: PropType<LinkTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; disabled: { type: BooleanConstructor; default: boolean; }; reloadDocument: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; preventScrollReset: { type: BooleanConstructor; default: boolean; }; viewTransition: { type: BooleanConstructor; default: boolean; }; relative: { type: PropType<NavigateOptions["relative"]>; default: undefined; }; }>, {}>, { replace: boolean; state: any; preventScrollReset: boolean; viewTransition: boolean; relative: "path" | "route" | "index" | "to" | "none" | undefined; disabled: boolean; reloadDocument: boolean; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### Constructor

```ts
RouterPlusLink(...args: any[])
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `React.ReactElement \| null`

## RouterPlusRedirect {#api-routerplusredirect}

Vue declarative redirect component.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const RouterPlusRedirect: DefineComponent<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>, () => null, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>, {}>, { replace: boolean; state: any; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### Constructor

```ts
new RouterPlusRedirect(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>, {}>, () => null, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { replace: boolean; state: any; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ to: { type: PropType<PageTarget>; required: true; }; replace: { type: BooleanConstructor; default: boolean; }; state: { type: null; default: undefined; }; }>> & Readonly<{}>, () => null, {}, {}, {}, { replace: boolean; state: any; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `React.ReactElement \| null`

## RouterPlusView {#api-routerplusview}

Wraps RouterView, caches instances by retention and freezes scope providers.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const RouterPlusView: DefineComponent<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>, {}>, { view: Component; host: Component; cache: boolean; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### Constructor

```ts
new RouterPlusView(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>, {}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { view: Component; host: Component; cache: boolean; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ view: { type: PropType<Component>; default: undefined; }; cache: { type: BooleanConstructor; default: boolean; }; host: { type: PropType<Component>; default: undefined; }; }>> & Readonly<{}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, { view: Component; host: Component; cache: boolean; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `React.ReactElement \| null`

## RouterPlusBoundary {#api-routerplusboundary}

Binds a subtree to an explicit context or the current instance.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const RouterPlusBoundary: DefineComponent<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, { context: PageContext; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### Constructor

```ts
new RouterPlusBoundary(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { context: PageContext; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>> & Readonly<{}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, { context: PageContext; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `React.ReactElement \| null`

## RouterPlusRetained {#api-routerplusretained}

Keeps a subtree mounted while hidden.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const RouterPlusRetained: DefineComponent<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, { context: PageContext; host: Component; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### Constructor

```ts
new RouterPlusRetained(...args: any[]): CreateComponentPublicInstanceWithMixins<ToResolvedProps<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>, {}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, PublicProps, { context: PageContext; host: Component; }, true, {}, {}, GlobalComponents, GlobalDirectives, string, {}, any, ComponentProvideOptions, OptionTypesType<{}, {}, {}, {}, {}, {}>, Readonly<ExtractPropTypes<{ active: { type: BooleanConstructor; required: true; }; host: { type: PropType<Component>; default: undefined; }; context: { type: PropType<import("../core/types.js").PageContext>; default: undefined; }; }>> & Readonly<{}>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }>, {}, {}, {}, { context: PageContext; host: Component; }>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `React.ReactElement \| null`

## createVueRoutes {#api-createvueroutes}

Generate Vue Router records from the page catalog.

**Import:** `@jangts/router-plus/vue`。

### Definition

#### Call

```ts
createVueRoutes(pages: readonly PageDefinition[], options?: CreateVueRoutesOptions): readonly VueRouteRecord[]
```

Build Vue route records from page definitions, nesting by `parentId`.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | Required | — |
| `options` | `CreateVueRoutesOptions` | Optional | — |

**Returns:** `readonly VueRouteRecord[]`

## CreateVueRoutesOptions {#api-createvueroutesoptions}

Route generation options: component and layout maps, wrappers and transforms.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface CreateVueRoutesOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `components` | `Readonly<Record<string, Component>> \| undefined` | Optional | See the type definition. |
| `layouts` | `Readonly<Record<string, Component>> \| undefined` | Optional | See the type definition. |
| `plus` | `RouterPlus \| undefined` | Optional | See the type definition. |
| `wrap` | `((component: Component, page: PageDefinition) => Component) \| undefined` | Optional | See the type definition. |

## VueRouteRecord {#api-vuerouterecord}

Generated Vue route record.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface VueRouteRecord
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | `string` | Required | See the type definition. |
| `name` | `string` | Required | See the type definition. |
| `alias` | `readonly string[] \| undefined` | Optional | See the type definition. |
| `component` | `Component \| undefined` | Optional | See the type definition. |
| `children` | `readonly VueRouteRecord[] \| undefined` | Optional | See the type definition. |
| `meta` | `Readonly<Record<string, unknown>>` | Required | See the type definition. |

## RouterPlusOverlay {#api-routerplusoverlay}

Vue overlay component that installs and cleans up the default overlay.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
const RouterPlusOverlay: DefineComponent<ExtractPropTypes<{ root: { type: PropType<Document | ShadowRoot | Element>; default: undefined; }; interactive: { type: BooleanConstructor; default: boolean; }; installRuntime: { type: BooleanConstructor; default: boolean; }; injectStyles: { type: BooleanConstructor; default: boolean; }; className: { type: StringConstructor; default: undefined; }; highlightComponent: { type: PropType<Component>; default: undefined; }; theme: { type: PropType<OverlayTheme>; default: undefined; }; }>, () => VNode<RendererNode, RendererElement, { [key: string]: any; }> | null, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin, {}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{ root: { type: PropType<Document | ShadowRoot | Element>; default: undefined; }; interactive: { type: BooleanConstructor; default: boolean; }; installRuntime: { type: BooleanConstructor; default: boolean; }; injectStyles: { type: BooleanConstructor; default: boolean; }; className: { type: StringConstructor; default: undefined; }; highlightComponent: { type: PropType<Component>; default: undefined; }; theme: { type: PropType<OverlayTheme>; default: undefined; }; }>, {}>, { className: string; highlightComponent: Component; root: Element | Document | ShadowRoot; installRuntime: boolean; injectStyles: boolean; interactive: boolean; theme: OverlayTheme; }, {}, {}, {}, string, ComponentProvideOptions, true, {}, any>
```

#### Constructor

```ts
RouterPlusOverlay(...args: any[])
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `React.ReactElement \| null`

## OverlayTheme {#api-overlaytheme}

App-owned overlay stacking, mask and built-in component appearance.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface OverlayTheme
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `zIndex` | `string \| number \| OverlayZIndexRange \| undefined` | Optional | A fixed CSS value, or inclusive bounds applied to the high renderer default. |
| `maskColor` | `string \| undefined` | Optional | See the type definition. |
| `maskRadius` | `string \| number \| undefined` | Optional | Shared spotlight cutout radius, independent of custom highlight content. |
| `surfaceColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `textColor` | `string \| undefined` | Optional | See the type definition. |
| `radius` | `string \| number \| undefined` | Optional | See the type definition. |
| `shadow` | `string \| undefined` | Optional | See the type definition. |
| `accentColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightRadius` | `string \| number \| undefined` | Optional | See the type definition. |
| `highlightBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `highlightPadding` | `string \| number \| undefined` | Optional | CSS length; a number is interpreted as pixels. Used by highlights and tours. |
| `tipGap` | `string \| number \| undefined` | Optional | See the type definition. |

## OverlayZIndexRange {#api-overlayzindexrange}

Inclusive min/max bounds on the default stacking level.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface OverlayZIndexRange
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `min` | `number \| undefined` | Optional | See the type definition. |
| `max` | `number \| undefined` | Optional | See the type definition. |

## HighlightComponentProps {#api-highlightcomponentprops}

Shared width, height, left, top and context contract for default/custom highlights.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface HighlightComponentProps extends HighlightRectangle
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `context` | `HighlightComponentContext` | Required | See the type definition. |
| `width` | `number` | Required | See the type definition. |
| `height` | `number` | Required | See the type definition. |
| `left` | `number` | Required | See the type definition. |
| `top` | `number` | Required | See the type definition. |

## HighlightComponentContext {#api-highlightcomponentcontext}

Target bounds, page/highlight/tour state, overlayRoot and next(step = 1).

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface HighlightComponentContext
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `overlayRoot` | `HTMLElement` | Required | Shared overlay root for App-owned portals that must retain the same stacking context. |
| `targetRect` | `HighlightRectangle` | Required | See the type definition. |
| `highlight` | `HighlightState` | Required | See the type definition. |
| `page` | `PageContext` | Required | See the type definition. |
| `tour` | `TourState \| null` | Required | See the type definition. |
| `next` | `(step?: number) => Promise<CommandResult>` | Required | Relative tour movement: positive forward, negative backward, zero leaves the step unchanged. |

## HighlightRectangle {#api-highlightrectangle}

Measured pixel dimensions and viewport position.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface HighlightRectangle
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `width` | `number` | Required | See the type definition. |
| `height` | `number` | Required | See the type definition. |
| `left` | `number` | Required | See the type definition. |
| `top` | `number` | Required | See the type definition. |

## DefaultHighlightComponentProps {#api-defaulthighlightcomponentprops}

Shared component props plus optional built-in styles.

**Import:** `@jangts/router-plus/vue`。

### Definition

```ts
interface DefaultHighlightComponentProps extends HighlightComponentProps
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `styles` | `DefaultHighlightStyles \| undefined` | Optional | See the type definition. |
| `context` | `HighlightComponentContext` | Required | See the type definition. |
| `width` | `number` | Required | See the type definition. |
| `height` | `number` | Required | See the type definition. |
| `left` | `number` | Required | See the type definition. |
| `top` | `number` | Required | See the type definition. |

## DefaultHighlightStyles {#api-defaulthighlightstyles}

Built-in highlight/bubble styles, excluding shared stacking policy.

**Import:** `@jangts/router-plus/vue`。

### Definition

**Type alias:** `DefaultHighlightStyles`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `surfaceColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `tipBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `textColor` | `string \| undefined` | Optional | See the type definition. |
| `radius` | `string \| number \| undefined` | Optional | See the type definition. |
| `shadow` | `string \| undefined` | Optional | See the type definition. |
| `accentColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightRadius` | `string \| number \| undefined` | Optional | See the type definition. |
| `highlightBorderColor` | `string \| undefined` | Optional | See the type definition. |
| `highlightBorderWidth` | `string \| number \| undefined` | Optional | See the type definition. |
| `tipGap` | `string \| number \| undefined` | Optional | See the type definition. |

## Examples

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
  render: () => h('main', [h(RouterPlusLink, { to: '/beta/42' }, () => 'Open Beta'), h(RouterPlusView)]),
}).use(plus).mount('#app');
```

### Reading state in a composable

```ts
import { useRpRef, usePageQuery } from '@jangts/router-plus/vue';

const state = useRpRef({ count: 0 }, 'counter');
const section = useRpRef('summary', { id: 'section', query: true, values: ['summary', 'details'] });
const { query, setQuery } = usePageQuery();
```

`app.use(plus)` installs both Vue Router and the Plus connection. App unmount removes adapter subscriptions and disposes a factory-created Core.

### Existing sources

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
