---
title: "React entry"
outline: [2, 3]
---

# React entry

`@jangts/router-plus/react` provides assembly, a Provider, hooks, links, retained rendering, route generation and the overlay. React and React Router remain optional peers; the entry never loads Vue.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`createReactRouterPlus`](#api-createreactrouterplus) | function | Assemble React Router and Plus; returns an instance with a stable Provider. |
| [`CreateReactRouterPlusOptions`](#api-createreactrouterplusoptions) | type alias | React assembly options; `router` accepts an element, constructor tuple or Data Router. |
| [`ReactRouterTuple`](#api-reactroutertuple) | type alias | `[component, props?]` constructor tuple with props inferred from the component. |
| [`ReactRouterPlus`](#api-reactrouterplus) | interface | React instance with an additional `Provider`. |
| [`createReactProvider`](#api-createreactprovider) | function | Create the low-level Provider from the application’s native hooks. |
| [`usePlusContext`](#api-usepluscontext) | function | Read the Plus instance provided by the nearest Provider. |
| [`ReactRouterHooks`](#api-reactrouterhooks) | interface | Native location and navigation hooks used by the adapter. |
| [`ReactRouterLocationLike`](#api-reactrouterlocationlike) | interface | Address object readable by the adapter. |
| [`RouterPlusProviderProps`](#api-routerplusproviderprops) | interface | Provider props. |
| [`useRouterPlus`](#api-userouterplus) | function | Read the Plus facade bound to the nearest boundary. |
| [`usePageContext`](#api-usepagecontext) | function | Subscribe to the current page context. |
| [`usePageMatch`](#api-usepagematch) | function | Read the current page match. |
| [`useRpState`](#api-userpstate) | function | Create native React state with optional source registration; return the native tuple. |
| [`useReactState`](#api-usereactstate) | function | Register an existing tuple, ref, callback or accessor; return void and clean up automatically. |
| [`useRpRef`](#api-userpref) | function | Create a native ref with optional source registration. |
| [`useRpContext`](#api-userpcontext) | function | Read native context with optional readonly registration. |
| [`useRpCallback`](#api-userpcallback) | function | Create a native callback with optional callState registration. |
| [`usePageQuery`](#api-usepagequery) | function | Read and update query parameters. |
| [`PageQueryInit`](#api-pagequeryinit) | type alias | Initial query value. |
| [`SetPageQuery`](#api-setpagequery) | interface | Query writer that merges same-turn functional edits and returns a navigation receipt. |
| [`usePageLeaveGuard`](#api-usepageleaveguard) | function | Register a leave guard for the component lifetime. |
| [`useHighlight`](#api-usehighlight) | function | Read highlight state and trigger or clear a highlight. |
| [`useTour`](#api-usetour) | function | Read tour state and control the tour. |
| [`RouterPlusLink`](#api-routerpluslink) | function | Link component that resolves its target through Plus. |
| [`RouterPlusLinkProps`](#api-routerpluslinkprops) | interface | Link component props. |
| [`RouterPlusRedirect`](#api-routerplusredirect) | function | Declarative redirect component. |
| [`RouterPlusRedirectProps`](#api-routerplusredirectprops) | interface | Redirect props. |
| [`RouterPlusScope`](#api-routerplusscope) | function | Binds Plus context only, without DOM or lifecycle behavior. |
| [`RouterPlusBoundary`](#api-routerplusboundary) | function | Binds a subtree to an explicit context or the current instance and registers its DOM host. |
| [`RouterPlusBoundaryProps`](#api-routerplusboundaryprops) | interface | Boundary props. |
| [`RouterPlusOutlet`](#api-routerplusoutlet) | function | Caches, freezes context and renders page instances according to retention. |
| [`RouterPlusRetained`](#api-routerplusretained) | function | Keeps a subtree mounted while hidden using its last active context. |
| [`RouterPlusRetainedProps`](#api-routerplusretainedprops) | interface | Retained container props. |
| [`RetainedHost`](#api-retainedhost) | type alias | React presentation host; instance identity, cache and release remain library-owned. |
| [`createReactRoutes`](#api-createreactroutes) | function | Generate React Router records from the page catalog. |
| [`CreateReactRoutesOptions`](#api-createreactroutesoptions) | interface | Route generation options: component and layout maps, wrappers and transforms. |
| [`ReactRouteRecord`](#api-reactrouterecord) | interface | Generated React route record. |
| [`RouteComponent`](#api-routecomponent) | type alias | Route component type. |
| [`RouterPlusOverlay`](#api-routerplusoverlay) | function | Install the default overlay and DOM target runtime. |
| [`RouterPlusOverlayProps`](#api-routerplusoverlayprops) | interface | Overlay props. |
| [`OverlayTheme`](#api-overlaytheme) | interface | App-owned overlay stacking, mask and built-in component appearance. |
| [`OverlayZIndexRange`](#api-overlayzindexrange) | interface | Inclusive min/max bounds on the default stacking level. |
| [`HighlightComponentProps`](#api-highlightcomponentprops) | interface | Shared width, height, left, top and context contract for default/custom highlights. |
| [`HighlightComponentContext`](#api-highlightcomponentcontext) | interface | Target bounds, page/highlight/tour state, overlayRoot and next(step = 1). |
| [`HighlightRectangle`](#api-highlightrectangle) | interface | Measured pixel dimensions and viewport position. |
| [`DefaultHighlightComponentProps`](#api-defaulthighlightcomponentprops) | interface | Shared component props plus optional built-in styles. |
| [`DefaultHighlightStyles`](#api-defaulthighlightstyles) | type alias | Built-in highlight/bubble styles, excluding shared stacking policy. |

## createReactRouterPlus {#api-createreactrouterplus}

Assemble React Router and Plus; returns an instance with a stable Provider.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
createReactRouterPlus<C extends ElementType>(options: CreateReactRouterPlusOptions<C>): ReactRouterPlus
```

Assemble one Plus instance and a stable Provider; unmount disconnects, disposal stays explicit.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `CreateReactRouterPlusOptions<C>` | Required | — |

**Returns:** `ReactRouterPlus`

## CreateReactRouterPlusOptions {#api-createreactrouterplusoptions}

React assembly options; `router` accepts an element, constructor tuple or Data Router.

**Import:** `@jangts/router-plus/react`。

### Definition

**Type alias:** `CreateReactRouterPlusOptions<C>`

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `C` | `ElementType` | `ElementType` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus \| undefined` | Optional | When reusing a Core instance, omit page catalog and other construction options. |
| `disposeOnUnmount` | `boolean \| undefined` | Optional | Dispose an owned instance after the last Provider unmount; StrictMode probes are ignored. |
| `router` | `NativeRouter.DataRouter \| ReactElement<{ children?: ReactNode; }, string \| JSXElementConstructor<any>> \| readonly [component: C, ...props: {} extends ComponentProps<C> ? [props?: NoInfer<ComponentProps<C>> \| undefined] : [props: NoInfer<ComponentProps<C>>]]` | Required | A JSX element, `[component, props?]` tuple or Data Router instance. |
| `hooks` | `ReactRouterHooks \| undefined` | Optional | Only for JSX or tuple input; adapts existing application hooks. |

## ReactRouterTuple {#api-reactroutertuple}

`[component, props?]` constructor tuple with props inferred from the component.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
type ReactRouterTuple<C> = readonly [
  component: C,
  ...props: {} extends ComponentProps<C>
    ? [props?: NoInfer<ComponentProps<C>>]
    : [props: NoInfer<ComponentProps<C>>],
];
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `C` | `ElementType` | `ElementType` |

## ReactRouterPlus {#api-reactrouterplus}

React instance with an additional `Provider`.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface ReactRouterPlus extends RouterPlus
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Provider` | `ComponentType<{ children?: ReactNode; }>` | Required | See the type definition. |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | Required | Run existing commands in order, waiting for installed sources and framework publication. |
| `connect` | `(connection: RouterConnection) => () => void` | Required | See the type definition. |
| `disconnect` | `() => void` | Required | See the type definition. |
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

## createReactProvider {#api-createreactprovider}

Create the low-level Provider from the application’s native hooks.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
createReactProvider(hooks: ReactRouterHooks): ({ plus, children }: RouterPlusProviderProps) => FunctionComponentElement<ProviderProps<RouterPlus | null>>
```

Create a provider using the router's existing hooks.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `hooks` | `ReactRouterHooks` | Required | — |

**Returns:** `({ plus, children }: RouterPlusProviderProps) => FunctionComponentElement<ProviderProps<RouterPlus \| null>>`

## usePlusContext {#api-usepluscontext}

Read the Plus instance provided by the nearest Provider.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
usePlusContext(): RouterPlus
```

No call parameters.

**Returns:** `RouterPlus`

## ReactRouterHooks {#api-reactrouterhooks}

Native location and navigation hooks used by the adapter.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface ReactRouterHooks
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `useLocation` | `() => ReactRouterLocationLike` | Required | See the type definition. |
| `useNavigate` | `() => NavigateFunction` | Required | See the type definition. |
| `useBlocker` | `((shouldBlock: (transition: { nextLocation: ReactRouterLocationLike; }) => boolean) => Blocker) \| undefined` | Optional | See the type definition. |

## ReactRouterLocationLike {#api-reactrouterlocationlike}

Address object readable by the adapter.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface ReactRouterLocationLike
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pathname` | `string` | Required | See the type definition. |
| `search` | `string` | Required | See the type definition. |
| `hash` | `string` | Required | See the type definition. |
| `state` | `unknown` | Optional | See the type definition. |
| `key` | `string \| undefined` | Optional | See the type definition. |

## RouterPlusProviderProps {#api-routerplusproviderprops}

Provider props.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface RouterPlusProviderProps
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | Keep the instance stable across renders, usually at module scope. |
| `children` | `ReactNode` | Optional | See the type definition. |

## useRouterPlus {#api-userouterplus}

Read the Plus facade bound to the nearest boundary.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
useRouterPlus(): import("../core/types.js").RouterPlus & { resolveLink(target: import("../core/types.js").LinkTarget, options?: NavigateOptions): import("../core/types.js").LinkResolution | null; }
```

Preserve the caller's route-relative semantics before submitting an absolute target.

No call parameters.

**Returns:** `RouterPlus & { resolveLink(target: import("../core/types.js").LinkTarget, options?: NavigateOptions): import("../core/types.js").LinkResolution \| null; }`

## usePageContext {#api-usepagecontext}

Subscribe to the current page context.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
usePageContext(): PageContext
```

No call parameters.

**Returns:** `PageContext`

## usePageMatch {#api-usepagematch}

Read the current page match.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
usePageMatch(): PageMatch | null
```

No call parameters.

**Returns:** `PageMatch \| null`

## useRpState {#api-userpstate}

Create native React state with optional source registration; return the native tuple.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Overload 1

```ts
useRpState<S>(initial: S | (() => S), idOrOptions?: StateIdOrOptions<NoInfer<S>>): [S, Dispatch<SetStateAction<S>>]
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `S \| (() => S)` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | Optional | — |

**Returns:** `[S, Dispatch<SetStateAction<S>>]`

#### Overload 2

```ts
useRpState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
```

No call parameters.

**Returns:** `[S \| undefined, Dispatch<SetStateAction<S \| undefined>>]`

## useReactState {#api-usereactstate}

Register an existing tuple, ref, callback or accessor; return void and clean up automatically.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Overload 1

```ts
useReactState<S>(source: StateTuple<S> | RefObject<S> | StateAccessor<S>, idOrOptions?: StateIdOrOptions<NoInfer<S>>): void
```

Index an existing tuple, ref, callback or receiver-safe accessor in the nearest page scope.
Omitted options skip registration. Only committed sources become visible; effect cleanup
unregisters automatically. Accessor notifications follow component commits, not polling.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `source` | `StateTuple<S> \| RefObject<S> \| StateAccessor<S>` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<S>> \| undefined` | Optional | — |

**Returns:** `void`

#### Overload 2

```ts
useReactState<F extends (...args: never[]) => unknown>(source: F, idOrOptions?: StateIdOrOptions<NoInfer<F>>): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `source` | `F` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<F>> \| undefined` | Optional | — |

**Returns:** `void`

## useRpRef {#api-userpref}

Create a native ref with optional source registration.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Overload 1

```ts
useRpRef<T>(initialValue: T): RefObject<T>
```

`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
(`initialValue`). The returned object will persist for the full lifetime of the component.

Note that `useRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
value around similar to how you’d use instance fields in classes.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initialValue` | `T` | Required | — |

**Returns:** `RefObject<T>`

#### Overload 2

```ts
useRpRef<T>(initialValue: T | null): RefObject<T | null>
```

`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
(`initialValue`). The returned object will persist for the full lifetime of the component.

Note that `useRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
value around similar to how you’d use instance fields in classes.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initialValue` | `T \| null` | Required | — |

**Returns:** `RefObject<T \| null>`

#### Overload 3

```ts
useRpRef<T>(initialValue: T | undefined): RefObject<T | undefined>
```

`useRef` returns a mutable ref object whose `.current` property is initialized to the passed argument
(`initialValue`). The returned object will persist for the full lifetime of the component.

Note that `useRef()` is useful for more than the `ref` attribute. It’s handy for keeping any mutable
value around similar to how you’d use instance fields in classes.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initialValue` | `T \| undefined` | Required | — |

**Returns:** `RefObject<T \| undefined>`

#### Overload 4

```ts
useRpRef<T>(initial: T, idOrOptions: StateIdOrOptions<NoInfer<T>> | undefined): MutableRefObject<T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `T` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | Required | — |

**Returns:** `MutableRefObject<T>`

#### Overload 5

```ts
useRpRef<T>(initial: T | null, idOrOptions: StateIdOrOptions<NoInfer<T | null>> | undefined): RefObject<T | null>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `T \| null` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T \| null>> \| undefined` | Required | — |

**Returns:** `RefObject<T \| null>`

#### Overload 6

```ts
useRpRef<T>(initial: T | undefined, idOrOptions: StateIdOrOptions<NoInfer<T | undefined>> | undefined): MutableRefObject<T | undefined>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `T \| undefined` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T \| undefined>> \| undefined` | Required | — |

**Returns:** `MutableRefObject<T \| undefined>`

## useRpContext {#api-userpcontext}

Read native context with optional readonly registration.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
useRpContext<T>(context: Context<T>, idOrOptions?: StateIdOrOptions<NoInfer<T>>): T
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `context` | `Context<T>` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | Optional | — |

**Returns:** `T`

## useRpCallback {#api-userpcallback}

Create a native callback with optional callState registration.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
useRpCallback<T extends (...args: any[]) => any>(callback: T, dependencies: DependencyList, idOrOptions?: StateIdOrOptions<NoInfer<T>>): T
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `callback` | `T` | Required | — |
| `dependencies` | `DependencyList` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<T>> \| undefined` | Optional | — |

**Returns:** `T`

## usePageQuery {#api-usepagequery}

Read and update query parameters.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
usePageQuery(defaultInit?: PageQueryInit): [URLSearchParams, SetPageQuery]
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `defaultInit` | `PageQueryInit \| undefined` | Optional | — |

**Returns:** `[URLSearchParams, SetPageQuery]`

## PageQueryInit {#api-pagequeryinit}

Initial query value.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
type PageQueryInit = | string
  | URLSearchParams
  | Record<string, string | readonly string[]>
  | readonly (readonly [string, string])[];
```

## SetPageQuery {#api-setpagequery}

Query writer that merges same-turn functional edits and returns a navigation receipt.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface SetPageQuery
```

#### Call

```ts
SetPageQuery(next: PageQueryInit | ((previous: URLSearchParams) => PageQueryInit), options?: NavigateOptions): Promise<CommandResult>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `next` | `PageQueryInit \| ((previous: URLSearchParams) => PageQueryInit)` | Required | — |
| `options` | `NavigateOptions \| undefined` | Optional | — |

**Returns:** `Promise<CommandResult>`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `patch` | `(patch: QueryRecord, options?: NavigateOptions) => Promise<CommandResult>` | Required | Update selected query keys; undefined removes a key and arrays preserve repeated values. |

## usePageLeaveGuard {#api-usepageleaveguard}

Register a leave guard for the component lifetime.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
usePageLeaveGuard(guard: GlobalGuard): void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `guard` | `GlobalGuard` | Required | — |

**Returns:** `void`

## useHighlight {#api-usehighlight}

Read highlight state and trigger or clear a highlight.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
useHighlight(): { state: HighlightState | null; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }
```

No call parameters.

**Returns:** `{ state: HighlightState \| null; highlight: (target: TargetRef, options?: HighlightOptions) => Promise<CommandResult>; clear: () => void; }`

## useTour {#api-usetour}

Read tour state and control the tour.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
useTour(): { state: TourState | null; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }
```

No call parameters.

**Returns:** `{ state: TourState \| null; start: (steps: readonly TourStep[], options?: TourOptions) => Promise<CommandResult>; next: () => void; prev: () => void; stop: () => void; }`

## RouterPlusLink {#api-routerpluslink}

Link component that resolves its target through Plus.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

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

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{   to,   children,   fallback,   replace,   state,   preventScrollReset,   viewTransition,   relative,   onClick,   disabled,   reloadDocument,   className,   title,   target,   download,   ...rest }` | `RouterPlusLinkProps` | Required | — |

**Returns:** `React.ReactElement \| null`

## RouterPlusLinkProps {#api-routerpluslinkprops}

Link component props.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface RouterPlusLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'onClick'
>
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `to` | `LinkTarget` | Required | See the type definition. |
| `children` | `ReactNode` | Optional | See the type definition. |
| `fallback` | `ReactNode` | Optional | Rendered when the target cannot be resolved. |
| `disabled` | `boolean \| undefined` | Optional | See the type definition. |
| `reloadDocument` | `boolean \| undefined` | Optional | Let the browser perform a full document navigation for href targets. |
| `replace` | `boolean \| undefined` | Optional | See the type definition. |
| `state` | `unknown` | Optional | See the type definition. |
| `preventScrollReset` | `boolean \| undefined` | Optional | See the type definition. |
| `viewTransition` | `boolean \| undefined` | Optional | See the type definition. |
| `relative` | `"path" \| "route" \| "index" \| "to" \| "none" \| undefined` | Optional | See the type definition. |
| `onClick` | `((event: import("react").MouseEvent<HTMLElement>) => void) \| undefined` | Optional | See the type definition. |

## RouterPlusRedirect {#api-routerplusredirect}

Declarative redirect component.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
RouterPlusRedirect({ to, replace, state }: RouterPlusRedirectProps): null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{ to, replace = true, state }` | `RouterPlusRedirectProps` | Required | — |

**Returns:** `null`

## RouterPlusRedirectProps {#api-routerplusredirectprops}

Redirect props.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface RouterPlusRedirectProps
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `to` | `PageTarget` | Required | See the type definition. |
| `replace` | `boolean \| undefined` | Optional | See the type definition. |
| `state` | `unknown` | Optional | See the type definition. |

## RouterPlusScope {#api-routerplusscope}

Binds Plus context only, without DOM or lifecycle behavior.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
RouterPlusScope({ context, children, }: { readonly context: PageContext; readonly children?: ReactNode; }): FunctionComponentElement<ProviderProps<RouterPlus | null>>
```

Context-only scope binding for caller-owned hosts; does not add DOM or navigation.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{   context,   children, }` | `{ readonly context: PageContext; readonly children?: ReactNode; }` | Required | — |

**Returns:** `FunctionComponentElement<ProviderProps<RouterPlus \| null>>`

## RouterPlusBoundary {#api-routerplusboundary}

Binds a subtree to an explicit context or the current instance and registers its DOM host.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
RouterPlusBoundary({ children, context: supplied }: RouterPlusBoundaryProps): ReactElement<{ ref: RefObject<HTMLDivElement | null>; 'data-router-plus-boundary': string; }, string | JSXElementConstructor<any>>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{ children, context: supplied }` | `RouterPlusBoundaryProps` | Required | — |

**Returns:** `ReactElement<{ ref: RefObject<HTMLDivElement \| null>; 'data-router-plus-boundary': string; }, string \| JSXElementConstructor<any>>`

## RouterPlusBoundaryProps {#api-routerplusboundaryprops}

Boundary props.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface RouterPlusBoundaryProps
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | Optional | See the type definition. |
| `context` | `PageContext \| undefined` | Optional | See the type definition. |

## RouterPlusOutlet {#api-routerplusoutlet}

Caches, freezes context and renders page instances according to retention.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
RouterPlusOutlet({ children, host, }: { readonly children?: ReactNode; readonly host?: RetainedHost; }): FunctionComponentElement<FragmentProps> | FunctionComponentElement<{ readonly host?: RetainedHost; }>
```

Optional automatic instance host; children keep caller-controlled composition available.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{   children,   host, }` | `{ readonly children?: ReactNode; readonly host?: RetainedHost; }` | Required | — |

**Returns:** `FunctionComponentElement<FragmentProps> \| FunctionComponentElement<{ readonly host?: RetainedHost; }>`

## RouterPlusRetained {#api-routerplusretained}

Keeps a subtree mounted while hidden using its last active context.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
RouterPlusRetained({ active, children, context, host }: RouterPlusRetainedProps): ReactElement<{ readonly active: boolean; readonly children?: ReactNode; }, string | JSXElementConstructor<any>> | DetailedReactHTMLElement<{ hidden: boolean; 'data-router-plus-retained': string; }, HTMLElement>
```

Keep a subtree mounted while hidden; state and DOM survive deactivation.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{ active, children, context, host }` | `RouterPlusRetainedProps` | Required | — |

**Returns:** `React.ReactElement \| null`

## RouterPlusRetainedProps {#api-routerplusretainedprops}

Retained container props.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface RouterPlusRetainedProps
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `host` | `RetainedHost \| undefined` | Optional | See the type definition. |
| `active` | `boolean` | Required | The default host stays mounted while false; custom hosts retain their framework lifecycle semantics. |
| `context` | `PageContext \| undefined` | Optional | See the type definition. |
| `children` | `ReactNode` | Optional | See the type definition. |

## RetainedHost {#api-retainedhost}

React presentation host; instance identity, cache and release remain library-owned.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
type RetainedHost = ComponentType<{
  readonly active: boolean;
  readonly children?: ReactNode;
}>;
```

## createReactRoutes {#api-createreactroutes}

Generate React Router records from the page catalog.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
createReactRoutes(pages: readonly PageDefinition[], options?: CreateReactRoutesOptions): readonly ReactRouteRecord[]
```

Build route records from page definitions, nesting by `parentId`.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | Required | — |
| `options` | `CreateReactRoutesOptions` | Optional | — |

**Returns:** `readonly ReactRouteRecord[]`

## CreateReactRoutesOptions {#api-createreactroutesoptions}

Route generation options: component and layout maps, wrappers and transforms.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface CreateReactRoutesOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `components` | `Readonly<Record<string, ReactElement<unknown, string \| JSXElementConstructor<any>> \| RouteComponent>> \| undefined` | Optional | See the type definition. |
| `layouts` | `Readonly<Record<string, ComponentType<{ readonly children?: ReactNode; }>>> \| undefined` | Optional | See the type definition. |
| `plus` | `RouterPlus \| undefined` | Optional | See the type definition. |
| `wrap` | `((element: ReactElement, page: PageDefinition) => ReactElement) \| undefined` | Optional | See the type definition. |

## ReactRouteRecord {#api-reactrouterecord}

Generated React route record.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface ReactRouteRecord
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | `string` | Required | See the type definition. |
| `name` | `string` | Required | See the type definition. |
| `id` | `string \| undefined` | Optional | See the type definition. |
| `handle` | `Readonly<Record<string, unknown>> \| undefined` | Optional | See the type definition. |
| `element` | `ReactElement<unknown, string \| JSXElementConstructor<any>> \| undefined` | Optional | See the type definition. |
| `children` | `readonly ReactRouteRecord[] \| undefined` | Optional | See the type definition. |
| `meta` | `Readonly<Record<string, unknown>>` | Required | See the type definition. |

## RouteComponent {#api-routecomponent}

Route component type.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
type RouteComponent = ComponentType<Record<string, never>> | ComponentType<{ readonly children?: ReactNode }>;
```

## RouterPlusOverlay {#api-routerplusoverlay}

Install the default overlay and DOM target runtime.

**Import:** `@jangts/router-plus/react`。

### Definition

#### Call

```ts
RouterPlusOverlay({ root, interactive, installRuntime, injectStyles, className, theme, highlightComponent, }: RouterPlusOverlayProps): ReactPortal | null
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `{   root,   interactive,   installRuntime,   injectStyles,   className,   theme,   highlightComponent, }` | `RouterPlusOverlayProps` | Required | — |

**Returns:** `ReactPortal \| null`

## RouterPlusOverlayProps {#api-routerplusoverlayprops}

Overlay props.

**Import:** `@jangts/router-plus/react`。

### Definition

```ts
interface RouterPlusOverlayProps extends Omit<MountOverlayOptions, 'highlightRenderer'>
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `highlightComponent` | `ComponentType<HighlightComponentProps> \| undefined` | Optional | See the type definition. |
| `className` | `string \| undefined` | Optional | Persistent App class, retained when per-highlight classes change. |
| `root` | `Element \| Document \| ShadowRoot \| undefined` | Optional | See the type definition. |
| `installRuntime` | `boolean \| undefined` | Optional | Install the DOM runtime together with the overlay; defaults to true. |
| `injectStyles` | `boolean \| undefined` | Optional | Set false when importing overlay.css or providing the complete stylesheet yourself. |
| `interactive` | `boolean \| undefined` | Optional | See the type definition. |
| `theme` | `OverlayTheme \| undefined` | Optional | See the type definition. |

## OverlayTheme {#api-overlaytheme}

App-owned overlay stacking, mask and built-in component appearance.

**Import:** `@jangts/router-plus/react`。

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

**Import:** `@jangts/router-plus/react`。

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

**Import:** `@jangts/router-plus/react`。

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

**Import:** `@jangts/router-plus/react`。

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

**Import:** `@jangts/router-plus/react`。

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

**Import:** `@jangts/router-plus/react`。

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

**Import:** `@jangts/router-plus/react`。

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
      <RouterPlusLink to="/beta/42">Open Beta</RouterPlusLink>
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

### Reading state inside a page

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

Data Router content belongs in its route records; Provider children are rejected. Loaders, redirects and native route organization remain owned by React Router. Native interception additionally requires blocker APIs; without them, Plus-initiated navigation still runs Plus guards.

### Existing sources

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
