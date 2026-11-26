---
title: "Core types"
outline: [2, 3]
---

# Core types

Page definitions, targets, command receipts, connections, plugins and interaction contracts. Applications usually implement `PageDefinition` plus a few connection or plugin interfaces; the remaining types annotate receipts and extension points.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`ParamValidator`](#api-paramvalidator) | type alias | Per-parameter validator; return `true` or a message. A returned string means invalid. |
| [`ParamSchema`](#api-paramschema) | type alias | Optional validator table keyed by route template parameter. |
| [`StateField`](#api-statefield) | interface | Defaults, allowed values, validation and optional query binding for registered state. |
| [`StateValueOptions`](#api-statevalueoptions) | interface | A field codec handles its complete value, including non-scalar values. |
| [`StateBindingOptions`](#api-statebindingoptions) | type alias | Native initialization supplies defaults; registration only adds identity and rules. |
| [`StateIdOrOptions`](#api-stateidoroptions) | type alias |  |
| [`StateAccessor`](#api-stateaccessor) | interface | Receiver-safe getter with an optional complete-value setter. |
| [`StateInspection`](#api-stateinspection) | interface | Readonly installed-source metadata without values or executable references. |
| [`QueryRecord`](#api-queryrecord) | type alias | Encoded query groups preserve repeated values and explicitly owned keys. |
| [`QueryEncoding`](#api-queryencoding) | type alias |  |
| [`PageTab`](#api-pagetab) | interface | Compatibility declaration for ordinary tab state. |
| [`InstanceKeyStrategy`](#api-instancekeystrategy) | type alias | Instance identity: pathname, page, selected parameters or a custom function. |
| [`PageGuards`](#api-pageguards) | interface | Page-level leave, enter, after-enter and retention lifecycle guards. |
| [`GuardContext`](#api-guardcontext) | interface | Page context, page definition and cancellation signal passed to a guard. |
| [`GuardResult`](#api-guardresult) | type alias | Guard decision: allow, reject, redirect or block with a message. |
| [`PageDefinition`](#api-pagedefinition) | interface | Page definition supplied by the caller; route trees and components stay in the application. |
| [`PageCatalogEntry`](#api-pagecatalogentry) | interface | Sanitized page projection containing safe metadata only. |
| [`QueryPairs`](#api-querypairs) | type alias | Ordered multi-value query pairs that preserve duplicates. |
| [`RouterLocation`](#api-routerlocation) | interface | Address snapshot with history entry identity and framework matches. |
| [`PageContext`](#api-pagecontext) | interface | Current page context with page, params, query, tab and instance. |
| [`PageInstance`](#api-pageinstance) | interface | Page instance identity; page id, instance key, state key and history entry stay separate. |
| [`PageMatch`](#api-pagematch) | interface | Result of matching one address against the page catalog. |
| [`PageCatalog`](#api-pagecatalog) | interface | Read-only page catalog. |
| [`PageTarget`](#api-pagetarget) | type alias | Navigation target: path string, path object, address object or page object. |
| [`LinkTarget`](#api-linktarget) | type alias | Navigation target plus an explicit business action. |
| [`LinkResolution`](#api-linkresolution) | type alias | Resolved link: page, external href or action. |
| [`NavigationPlan`](#api-navigationplan) | type alias | Navigation plan that never contains a business action. |
| [`NavigateOptions`](#api-navigateoptions) | interface | Navigation options passed through to the native router. |
| [`ConnectionCapabilities`](#api-connectioncapabilities) | interface | Native interception, traversal and history observation declared by a connection. |
| [`CommitRequest`](#api-commitrequest) | interface | Real commit request handed to the framework connection. |
| [`CommitStatus`](#api-commitstatus) | type alias | Status of one commit. |
| [`CommitResult`](#api-commitresult) | interface | Real commit receipt; successful results include the actual location. |
| [`CommittedChange`](#api-committedchange) | interface | One committed address change and its source. |
| [`RouterConnection`](#api-routerconnection) | interface | Framework navigation port: initial snapshot, commit, subscribe and optional traversal. |
| [`CommandReason`](#api-commandreason) | type alias | Reason codes for command failures. |
| [`CommandSuccess`](#api-commandsuccess) | interface | Successful command result. |
| [`CommandFailure`](#api-commandfailure) | interface | Failed command result, optionally with a stage and committed flag. |
| [`CommandResult`](#api-commandresult) | type alias | Command result union. |
| [`CommandSequenceOptions`](#api-commandsequenceoptions) | interface | Total group deadline and cancellation signal. |
| [`CommandSequenceResult`](#api-commandsequenceresult) | type alias | Completed step receipts and the stopped step index. |
| [`NavigationStatus`](#api-navigationstatus) | type alias | Navigation status. |
| [`NavigationResult`](#api-navigationresult) | interface | Navigation result with context, stage, redirect and error. |
| [`RouterCommand`](#api-routercommand) | type alias | Executable command union; typed methods and `execute` share handlers. |
| [`RouterEvent`](#api-routerevent) | type alias | Instance events: location, navigation, tab, state, interaction, retain and release. |
| [`TargetAnchor`](#api-targetanchor) | type alias | DOM element or geometric anchor; a canvas region can be a target. |
| [`TargetRef`](#api-targetref) | type alias | Interaction target reference: id, selector, element, rect or named resolver input. |
| [`HighlightPlacement`](#api-highlightplacement) | type alias | Placement of a highlight message relative to its target. |
| [`HighlightOptions`](#api-highlightoptions) | interface | Highlight message, placement, spotlight, timeout, duration and interaction options. |
| [`HighlightState`](#api-highlightstate) | interface | Current highlight state. |
| [`TourStep`](#api-tourstep) | interface | Tour step with target, message and progression mode. |
| [`TourState`](#api-tourstate) | interface | Current tour state. |
| [`TourOptions`](#api-touroptions) | interface | Tour callbacks, keyboard, dismissal and step hooks. |
| [`FocusOptions`](#api-focusoptions) | interface | Focus options. |
| [`ScrollOptions`](#api-scrolloptions) | interface | Scroll behavior, alignment, offset and container options. |
| [`TargetResolver`](#api-targetresolver) | interface | Custom target resolver. |
| [`HighlightRenderer`](#api-highlightrenderer) | interface | Highlight renderer mounted, rendered and destroyed by the overlay. |
| [`TargetRuntime`](#api-targetruntime) | interface | DOM target runtime: resolve, focus and scroll. |
| [`ScrollStrategy`](#api-scrollstrategy) | interface | Custom scroll strategy for non-native scrolling containers. |
| [`LinkProtocol`](#api-linkprotocol) | interface | Link protocol parser; synchronous and free of side effects. |
| [`NavigationActionHandler`](#api-navigationactionhandler) | interface | Business action handler. |
| [`NavigationActionRegistration`](#api-navigationactionregistration) | interface | Action registration entry. |
| [`PageStateBridge`](#api-pagestatebridge) | interface | Delegated state bridge; the caller-owned store remains the source of truth. |
| [`RouterPlusPluginApi`](#api-routerpluspluginapi) | interface | Registration API available to plugins. |
| [`GlobalGuard`](#api-globalguard) | interface | Global leave or enter guard. |
| [`RetentionStrategy`](#api-retentionstrategy) | interface | Page retention and eviction strategy. |
| [`RouterPlusPlugin`](#api-routerplusplugin) | interface | Plugin declaration: id, dependencies, ordering and setup. |
| [`RouteTransformer`](#api-routetransformer) | interface | Native route record transformer. |
| [`RouterSnapshot`](#api-routersnapshot) | interface | Snapshot used for SSR and hydration. |
| [`InstanceHost`](#api-instancehost) | interface | Instance host lifecycle reported by framework adapters. |
| [`PageLinkOptions`](#api-pagelinkoptions) | interface | Scheme and field configuration for semantic page links. |
| [`CreateRouterPlusOptions`](#api-createrouterplusoptions) | interface | Construction options for `createRouterPlus`. |
| [`RouterPlusHotModule`](#api-routerplushotmodule) | interface | Structural disposal contract supplied by the instance-owning HMR module. |
| [`RouterPlus`](#api-routerplus) | interface | Main instance contract. |
| [`RouterPlusGlobal`](#api-routerplusglobal) | interface | Browser debug facade contract; not an authorization boundary. |

## ParamValidator {#api-paramvalidator}

Per-parameter validator; return `true` or a message. A returned string means invalid.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type ParamValidator = (value: string) => boolean | string;
```

#### Call

```ts
ParamValidator(value: string): boolean | string
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `value` | `string` | Required | — |

**Returns:** `string \| boolean`

## ParamSchema {#api-paramschema}

Optional validator table keyed by route template parameter.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type ParamSchema<P> = Readonly<
  Partial<Record<keyof P & string, ParamValidator>>
>;
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |

## StateField {#api-statefield}

Defaults, allowed values, validation and optional query binding for registered state.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface StateField<S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `observe` | `((refresh: () => void) => () => void) \| undefined` | Optional | Subscribe to external rule dependencies; the registration owns synchronous cleanup. |
| `ready` | `(() => boolean) \| undefined` | Optional | Defer address restoration and writes until application dependencies are available. |
| `history` | `"replace" \| "push" \| undefined` | Optional | History entries produced by native changes. Default: replace. |
| `omitDefault` | `boolean \| undefined` | Optional | Omit values equal to their captured default from the address. Default: false. |
| `default` | `S \| undefined` | Optional | See the type definition. |
| `values` | `readonly S[] \| undefined` | Optional | See the type definition. |
| `validate` | `((value: unknown) => boolean) \| undefined` | Optional | See the type definition. |
| `query` | `string \| boolean \| readonly string[] \| undefined` | Optional | See the type definition. |
| `encode` | `((value: S) => QueryEncoding) \| undefined` | Optional | See the type definition. |
| `decode` | `((raw: string) => S) \| undefined` | Optional | See the type definition. |
| `fields` | `Readonly<Record<string, StateField<unknown>>> \| undefined` | Optional | See the type definition. |

## StateValueOptions {#api-statevalueoptions}

A field codec handles its complete value, including non-scalar values.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface StateValueOptions<S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `omitDefault` | `boolean \| undefined` | Optional | See the type definition. |
| `query` | `string \| boolean \| undefined` | Optional | See the type definition. |
| `values` | `readonly S[] \| undefined` | Optional | See the type definition. |
| `validate` | `((value: unknown) => boolean) \| undefined` | Optional | See the type definition. |
| `encode` | `((value: S) => string \| undefined) \| undefined` | Optional | See the type definition. |
| `decode` | `((raw: string) => S) \| undefined` | Optional | See the type definition. |

## StateBindingOptions {#api-statebindingoptions}

Native initialization supplies defaults; registration only adds identity and rules.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `StateBindingOptions<S>`

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `observe` | `((refresh: () => void) => () => void) \| undefined` | Optional | Notify changes to external readiness, validation or codec dependencies without polling. |
| `ready` | `(() => boolean) \| undefined` | Optional | Defer address restoration and writes until application dependencies are available. |
| `history` | `"replace" \| "push" \| undefined` | Optional | History entries produced by native changes. Default: replace. |
| `omitDefault` | `boolean \| undefined` | Optional | Omit values equal to their captured default from the address. Default: false. |
| `id` | `string` | Required | See the type definition. |
| `query` | `string \| boolean \| readonly string[] \| undefined` | Optional | See the type definition. |
| `values` | `readonly S[] \| undefined` | Optional | See the type definition. |
| `validate` | `((value: unknown) => boolean) \| undefined` | Optional | See the type definition. |
| `encode` | `((value: S) => QueryEncoding) \| undefined` | Optional | See the type definition. |
| `decode` | `((query: S extends readonly unknown[] ? string : S extends (...args: never[]) => unknown ? string : S extends object ? URLSearchParams : string) => S) \| undefined` | Optional | See the type definition. |
| `fields` | `Partial<{ readonly [K in keyof S]: StateValueOptions<S[K]>; }> \| undefined` | Optional | See the type definition. |

## StateIdOrOptions {#api-stateidoroptions}

**Import:** `@jangts/router-plus`。

### Definition

```ts
type StateIdOrOptions<S> = string | StateBindingOptions<S>;
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | `unknown` |

## StateAccessor {#api-stateaccessor}

Receiver-safe getter with an optional complete-value setter.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface StateAccessor<S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | — |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `get` | `() => S` | Required | Pure native-value read; methods are invoked with the original receiver. |
| `set` | `((next: S) => void \| Promise<void>) \| undefined` | Optional | Optional complete-value business write, without automatic updater semantics. |

## StateInspection {#api-stateinspection}

Readonly installed-source metadata without values or executable references.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface StateInspection
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | Exact registration ID; arbitrary object field paths are not expanded. |
| `scope` | `"page" \| "global"` | Required | Owning registration namespace. |
| `pageId` | `string \| null` | Required | Page identity for a page source; null for global sources. |
| `stateKey` | `string \| null` | Required | Concrete page instance identity; null for global sources. |
| `parentId` | `string \| null` | Required | Explicit parent registration ID for store actions; otherwise null. |
| `capabilities` | `Readonly<{ read: true; write: boolean; call: boolean; }>` | Required | Operations supported by the installed adapter, without executing them. |
| `queryKeys` | `readonly string[]` | Required | Declared address parameters; never includes their values. |

## QueryRecord {#api-queryrecord}

Encoded query groups preserve repeated values and explicitly owned keys.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type QueryRecord = Readonly<Record<string, string | readonly string[] | undefined>>;
```

## QueryEncoding {#api-queryencoding}

**Import:** `@jangts/router-plus`。

### Definition

```ts
type QueryEncoding = string | URLSearchParams | QueryRecord | undefined;
```

## PageTab {#api-pagetab}

Compatibility declaration for ordinary tab state.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageTab
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `label` | `string \| undefined` | Optional | See the type definition. |

## InstanceKeyStrategy {#api-instancekeystrategy}

Instance identity: pathname, page, selected parameters or a custom function.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type InstanceKeyStrategy = 'pathname' | 'page' | { readonly params: readonly string[] } | ((context: PageContext) => string);
```

## PageGuards {#api-pageguards}

Page-level leave, enter, after-enter and retention lifecycle guards.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageGuards<P, S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `beforeLeave` | `((context: GuardContext<P, S>) => GuardResult \| Promise<GuardResult>) \| undefined` | Optional | See the type definition. |
| `beforeEnter` | `((context: GuardContext<P, S>) => GuardResult \| Promise<GuardResult>) \| undefined` | Optional | See the type definition. |
| `afterEnter` | `((context: GuardContext<P, S>) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `onRetain` | `((context: PageContext) => void) \| undefined` | Optional | See the type definition. |
| `onRestore` | `((context: PageContext) => void) \| undefined` | Optional | See the type definition. |

## GuardContext {#api-guardcontext}

Page context, page definition and cancellation signal passed to a guard.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface GuardContext<P, S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `context` | `PageContext` | Required | See the type definition. |
| `page` | `PageDefinition<P, S>` | Required | See the type definition. |
| `signal` | `AbortSignal` | Required | See the type definition. |

## GuardResult {#api-guardresult}

Guard decision: allow, reject, redirect or block with a message.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type GuardResult = true | false | { redirect: PageTarget } | { message: string };
```

## PageDefinition {#api-pagedefinition}

Page definition supplied by the caller; route trees and components stay in the application.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageDefinition<P, S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `P` | `Record<string, string>` | `Record<string, string>` |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | Optional | Defaults to the path template. |
| `path` | `string` | Required | Route template, for example `/beta/:id`. |
| `pathAliases` | `readonly string[] \| undefined` | Optional | Additional paths for the same page. |
| `title` | `string` | Required | See the type definition. |
| `params` | `Readonly<Partial<Record<keyof P & string, ParamValidator>>> \| undefined` | Optional | Validators keyed by parameter name. |
| `tabs` | `readonly PageTab[] \| undefined` | Optional | Compatibility shorthand for ordinary tab state; use states and matching native source IDs for application state. |
| `defaultTab` | `string \| undefined` | Optional | Default for the tab shorthand; ordinary address defaults belong in states. |
| `tabInUrl` | `boolean \| undefined` | Optional | Query switch for the tab shorthand; native sources declare query synchronization in their registration options. |
| `states` | `Readonly<Record<string, StateField<unknown>>> \| undefined` | Optional | See the type definition. |
| `instanceKey` | `InstanceKeyStrategy \| undefined` | Optional | Instances are distinguished by pathname by default. |
| `retain` | `boolean \| { readonly max?: number; } \| undefined` | Optional | Retains the instance; keeping component and DOM also needs a rendering host. |
| `component` | `string \| undefined` | Optional | Component key resolved by framework adapters. |
| `parentId` | `string \| undefined` | Optional | See the type definition. |
| `layout` | `string \| undefined` | Optional | See the type definition. |
| `guards` | `PageGuards<P, S> \| undefined` | Optional | See the type definition. |
| `meta` | `Readonly<Record<string, unknown>> \| undefined` | Optional | Application metadata that is never exposed through `PageCatalog`. |

## PageCatalogEntry {#api-pagecatalogentry}

Sanitized page projection containing safe metadata only.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageCatalogEntry
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `path` | `string` | Required | See the type definition. |
| `pathAliases` | `readonly string[] \| undefined` | Optional | See the type definition. |
| `title` | `string` | Required | See the type definition. |
| `tabs` | `readonly PageTab[] \| undefined` | Optional | See the type definition. |
| `defaultTab` | `string \| undefined` | Optional | See the type definition. |
| `tabInUrl` | `boolean \| undefined` | Optional | See the type definition. |
| `states` | `Readonly<Record<string, StateField<unknown>>> \| undefined` | Optional | See the type definition. |
| `retain` | `boolean` | Required | See the type definition. |
| `instanceKey` | `InstanceKeyStrategy \| "custom"` | Required | Strategy description only; functions are projected as `'custom'`. |
| `parentId` | `string \| undefined` | Optional | See the type definition. |

## QueryPairs {#api-querypairs}

Ordered multi-value query pairs that preserve duplicates.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type QueryPairs = readonly (readonly [string, string])[];
```

## RouterLocation {#api-routerlocation}

Address snapshot with history entry identity and framework matches.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterLocation
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pathname` | `string` | Required | See the type definition. |
| `search` | `string` | Required | See the type definition. |
| `hash` | `string` | Required | See the type definition. |
| `state` | `unknown` | Optional | See the type definition. |
| `entryKey` | `string \| undefined` | Optional | Framework history entry identity when available. |
| `revision` | `string \| undefined` | Optional | See the type definition. |
| `action` | `"replace" \| "push" \| "pop" \| "initial" \| "native" \| undefined` | Optional | See the type definition. |
| `navigationId` | `string \| undefined` | Optional | See the type definition. |
| `matched` | `readonly { readonly pageId: string; readonly params: Readonly<Record<string, string>>; }[] \| undefined` | Optional | Authoritative framework matches take precedence over inferred ones. |

## PageContext {#api-pagecontext}

Current page context with page, params, query, tab and instance.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageContext
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pageId` | `string \| null` | Required | See the type definition. |
| `title` | `string \| undefined` | Optional | See the type definition. |
| `path` | `string` | Required | See the type definition. |
| `pathname` | `string` | Required | See the type definition. |
| `search` | `string` | Required | See the type definition. |
| `hash` | `string` | Required | See the type definition. |
| `params` | `Readonly<Record<string, string>>` | Required | See the type definition. |
| `query` | `Readonly<Record<string, string>>` | Required | Read `queryAll` when duplicate query keys matter. |
| `queryAll` | `QueryPairs` | Required | See the type definition. |
| `tab` | `string \| null` | Required | See the type definition. |
| `values` | `Readonly<Record<string, unknown>>` | Required | See the type definition. |
| `instance` | `PageInstance \| null` | Required | See the type definition. |
| `page` | `PageCatalogEntry \| null` | Required | See the type definition. |
| `location` | `RouterLocation` | Required | See the type definition. |

## PageInstance {#api-pageinstance}

Page instance identity; page id, instance key, state key and history entry stay separate.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageInstance
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pageId` | `string` | Required | See the type definition. |
| `instanceKey` | `string` | Required | See the type definition. |
| `tab` | `string \| null` | Required | See the type definition. |
| `stateKey` | `string` | Required | See the type definition. |
| `historyKey` | `string` | Required | See the type definition. |
| `retained` | `boolean` | Required | See the type definition. |

## PageMatch {#api-pagematch}

Result of matching one address against the page catalog.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageMatch
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `values` | `Readonly<Record<string, unknown>> \| undefined` | Optional | See the type definition. |
| `page` | `PageCatalogEntry` | Required | See the type definition. |
| `params` | `Readonly<Record<string, string>>` | Required | See the type definition. |
| `query` | `Readonly<Record<string, string>>` | Required | See the type definition. |
| `queryAll` | `QueryPairs` | Required | See the type definition. |
| `tab` | `string \| null` | Required | See the type definition. |

## PageCatalog {#api-pagecatalog}

Read-only page catalog.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageCatalog
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `entries` | `readonly PageCatalogEntry[]` | Required | See the type definition. |
| `ids` | `readonly string[]` | Required | See the type definition. |
| `get` | `(id: string) => PageCatalogEntry \| undefined` | Required | See the type definition. |
| `byPath` | `(pathname: string) => PageMatch \| null` | Required | See the type definition. |

## PageTarget {#api-pagetarget}

Navigation target: path string, path object, address object or page object.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `PageTarget`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `replace` | `boolean \| { (searchValue: string \| RegExp, replaceValue: string): string; (searchValue: string \| RegExp, replacer: (substring: string, ...args: any[]) => string): string; (searchValue: { [Symbol.replace](string: string, replaceValue: string): string; }, replaceValue: string): string; (searchValue: { [Symbol.replace](string: string, replacer: (substring: string, ...args: any[]) => string): string; }, replacer: (substring: string, ...args: any[]) => string): string; } \| undefined` | Optional | Replaces text in a string, using a regular expression or search string. Passes a string and {@linkcode replaceValue} to the `[Symbol.replace]` method on {@linkcode searchValue}. This method is expected to implement its own replacement algorithm. Replaces text in a string, using an object that supports replacement within a string. |

## LinkTarget {#api-linktarget}

Navigation target plus an explicit business action.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type LinkTarget = PageTarget | { readonly action: string; readonly payload?: unknown };
```

## LinkResolution {#api-linkresolution}

Resolved link: page, external href or action.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `LinkResolution`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"page" \| "external" \| "action"` | Required | See the type definition. |

## NavigationPlan {#api-navigationplan}

Navigation plan that never contains a business action.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `NavigationPlan`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"page" \| "external"` | Required | See the type definition. |
| `href` | `string` | Required | See the type definition. |

## NavigateOptions {#api-navigateoptions}

Navigation options passed through to the native router.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface NavigateOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `replace` | `boolean \| undefined` | Optional | See the type definition. |
| `state` | `unknown` | Optional | See the type definition. |
| `relative` | `"path" \| "route" \| "index" \| "to" \| "none" \| undefined` | Optional | See the type definition. |
| `preventScrollReset` | `boolean \| undefined` | Optional | See the type definition. |
| `viewTransition` | `boolean \| undefined` | Optional | See the type definition. |

## ConnectionCapabilities {#api-connectioncapabilities}

Native interception, traversal and history observation declared by a connection.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface ConnectionCapabilities
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `interception` | `boolean \| undefined` | Optional | See the type definition. |
| `traversal` | `boolean \| undefined` | Optional | See the type definition. |
| `rawHistoryObservation` | `boolean \| undefined` | Optional | See the type definition. |

## CommitRequest {#api-commitrequest}

Real commit request handed to the framework connection.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CommitRequest
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `navigationId` | `string` | Required | See the type definition. |
| `href` | `string` | Required | See the type definition. |
| `path` | `string` | Required | See the type definition. |
| `tab` | `string \| undefined` | Optional | See the type definition. |
| `state` | `Record<string, unknown>` | Required | See the type definition. |
| `options` | `NavigateOptions` | Required | See the type definition. |
| `signal` | `AbortSignal` | Required | See the type definition. |

## CommitStatus {#api-commitstatus}

Status of one commit.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type CommitStatus = 'committed' | 'blocked' | 'cancelled' | 'failed' | 'noop';
```

## CommitResult {#api-commitresult}

Real commit receipt; successful results include the actual location.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CommitResult
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `status` | `CommitStatus` | Required | See the type definition. |
| `location` | `RouterLocation \| undefined` | Optional | See the type definition. |
| `message` | `string \| undefined` | Optional | See the type definition. |
| `error` | `unknown` | Optional | See the type definition. |

## CommittedChange {#api-committedchange}

One committed address change and its source.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CommittedChange
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `location` | `RouterLocation` | Required | See the type definition. |
| `source` | `"initial" \| "native" \| "plus" \| "traversal"` | Required | See the type definition. |
| `navigationId` | `string \| undefined` | Optional | See the type definition. |

## RouterConnection {#api-routerconnection}

Framework navigation port: initial snapshot, commit, subscribe and optional traversal.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterConnection
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `initial` | `RouterLocation` | Required | See the type definition. |
| `matcher` | `RouteMatcher \| undefined` | Optional | Framework matching/building semantics; bound before the initial snapshot is applied. |
| `intercept` | `((check: (target: RouterLocation) => Promise<GuardResult>) => () => void) \| undefined` | Optional | Native transition gate; Plus-originated transitions carry an already checked token. |
| `capabilities` | `ConnectionCapabilities \| undefined` | Optional | See the type definition. |
| `commit` | `(request: CommitRequest) => Promise<CommitResult> \| CommitResult` | Required | See the type definition. |
| `subscribe` | `(listener: (change: CommittedChange) => void) => () => void` | Required | See the type definition. |
| `back` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | Optional | See the type definition. |
| `forward` | `(() => Promise<CommitResult> \| CommitResult) \| undefined` | Optional | See the type definition. |
| `go` | `((delta: number) => Promise<CommitResult> \| CommitResult) \| undefined` | Optional | See the type definition. |

## CommandReason {#api-commandreason}

Reason codes for command failures.

**Import:** `@jangts/router-plus`。

### Definition

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

Successful command result.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CommandSuccess
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ok` | `true` | Required | See the type definition. |
| `value` | `unknown` | Optional | See the type definition. |

## CommandFailure {#api-commandfailure}

Failed command result, optionally with a stage and committed flag.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CommandFailure
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ok` | `false` | Required | See the type definition. |
| `reason` | `CommandReason` | Required | Use `CommandReason` to distinguish guard rejection, cancellation, invalid targets and missing capabilities. |
| `message` | `string \| undefined` | Optional | See the type definition. |
| `navigationId` | `string \| undefined` | Optional | See the type definition. |
| `stage` | `string \| undefined` | Optional | See the type definition. |
| `committed` | `boolean \| undefined` | Optional | See the type definition. |

## CommandResult {#api-commandresult}

Command result union.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `CommandResult`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ok` | `boolean` | Required | See the type definition. |

## CommandSequenceOptions {#api-commandsequenceoptions}

Total group deadline and cancellation signal.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CommandSequenceOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `timeoutMs` | `number \| undefined` | Optional | Total deadline in milliseconds, including source waits and business calls. Default: 10000. |
| `signal` | `AbortSignal \| undefined` | Optional | See the type definition. |

## CommandSequenceResult {#api-commandsequenceresult}

Completed step receipts and the stopped step index.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `CommandSequenceResult`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ok` | `boolean` | Required | See the type definition. |
| `results` | `readonly CommandResult[]` | Required | See the type definition. |

## NavigationStatus {#api-navigationstatus}

Navigation status.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type NavigationStatus = 'committed' | 'blocked' | 'cancelled' | 'failed' | 'noop';
```

## NavigationResult {#api-navigationresult}

Navigation result with context, stage, redirect and error.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface NavigationResult
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `status` | `NavigationStatus` | Required | See the type definition. |
| `navigationId` | `string` | Required | See the type definition. |
| `stage` | `string \| undefined` | Optional | See the type definition. |
| `location` | `RouterLocation \| undefined` | Optional | See the type definition. |
| `context` | `PageContext \| undefined` | Optional | See the type definition. |
| `message` | `string \| undefined` | Optional | See the type definition. |
| `redirected` | `boolean \| undefined` | Optional | See the type definition. |
| `error` | `unknown` | Optional | See the type definition. |

## RouterCommand {#api-routercommand}

Executable command union; typed methods and `execute` share handlers.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `RouterCommand`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `"replace" \| "navigate" \| "query.patch" \| "back" \| "forward" \| "go" \| "state.call" \| "tab.set" \| "tab.read" \| "state.set" \| "state.patch" \| "state.reset" \| "state.read" \| "context.read" \| "highlight.set" \| "highlight.clear" \| "tour.start" \| "tour.next" \| "tour.prev" \| "tour.stop" \| "focus" \| "scroll.to" \| "retain" \| "release"` | Required | See the type definition. |

## RouterEvent {#api-routerevent}

Instance events: location, navigation, tab, state, interaction, retain and release.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `RouterEvent`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `"action" \| "tab" \| "state" \| "retain" \| "release" \| "state.registered" \| "state.unregistered" \| "state.committed" \| "disposed" \| "renderer" \| "location" \| "navigation" \| "highlight" \| "tour"` | Required | See the type definition. |

## TargetAnchor {#api-targetanchor}

DOM element or geometric anchor; a canvas region can be a target.

**Import:** `@jangts/router-plus`。

### Definition

**Type alias:** `TargetAnchor`

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `getBoundingClientRect` | `(() => DOMRect) \| (() => DOMRectReadOnly)` | Required | The **`Element.getBoundingClientRect()`** method returns a DOMRect object providing information about the size of an element and its position relative to the viewport.  [MDN Reference](https://developer.mozilla.org/docs/Web/API/Element/getBoundingClientRect) |

## TargetRef {#api-targetref}

Interaction target reference: id, selector, element, rect or named resolver input.

**Import:** `@jangts/router-plus`。

### Definition

```ts
type TargetRef = | string
  | { readonly selector: string }
  | { readonly rect: () => DOMRectReadOnly; readonly contextElement?: Element }
  | { readonly element: Element | (() => Element | null) }
  | { readonly target: string; readonly value: unknown };
```

## HighlightPlacement {#api-highlightplacement}

Placement of a highlight message relative to its target.

**Import:** `@jangts/router-plus`。

### Definition

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

Highlight message, placement, spotlight, timeout, duration and interaction options.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface HighlightOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `message` | `string \| undefined` | Optional | See the type definition. |
| `placement` | `HighlightPlacement \| undefined` | Optional | See the type definition. |
| `spotlight` | `boolean \| undefined` | Optional | See the type definition. |
| `padding` | `number \| undefined` | Optional | See the type definition. |
| `scrollIntoView` | `boolean \| undefined` | Optional | See the type definition. |
| `waitForTarget` | `boolean \| undefined` | Optional | See the type definition. |
| `timeout` | `number \| undefined` | Optional | See the type definition. |
| `duration` | `number \| undefined` | Optional | See the type definition. |
| `dismissible` | `boolean \| undefined` | Optional | See the type definition. |
| `interactive` | `boolean \| undefined` | Optional | See the type definition. |
| `className` | `string \| undefined` | Optional | See the type definition. |

## HighlightState {#api-highlightstate}

Current highlight state.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface HighlightState
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | `TargetRef` | Required | See the type definition. |
| `element` | `TargetAnchor` | Required | See the type definition. |
| `message` | `string \| undefined` | Optional | See the type definition. |
| `placement` | `HighlightPlacement` | Required | See the type definition. |
| `spotlight` | `boolean \| undefined` | Optional | See the type definition. |
| `padding` | `number \| undefined` | Optional | See the type definition. |
| `startedAt` | `number` | Required | See the type definition. |
| `dismissible` | `boolean \| undefined` | Optional | See the type definition. |
| `interactive` | `boolean \| undefined` | Optional | See the type definition. |
| `className` | `string \| undefined` | Optional | See the type definition. |

## TourStep {#api-tourstep}

Tour step with target, message and progression mode.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface TourStep
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | `TargetRef` | Required | See the type definition. |
| `message` | `string` | Required | See the type definition. |
| `placement` | `HighlightPlacement \| undefined` | Optional | See the type definition. |
| `awaitUser` | `boolean \| undefined` | Optional | See the type definition. |
| `advanceOn` | `"manual" \| "click" \| undefined` | Optional | See the type definition. |

## TourState {#api-tourstate}

Current tour state.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface TourState
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | Optional | See the type definition. |
| `steps` | `readonly TourStep[]` | Required | See the type definition. |
| `index` | `number` | Required | See the type definition. |
| `awaiting` | `boolean` | Required | See the type definition. |
| `active` | `boolean` | Required | See the type definition. |
| `keyboard` | `boolean \| undefined` | Optional | See the type definition. |
| `dismissible` | `boolean \| undefined` | Optional | See the type definition. |

## TourOptions {#api-touroptions}

Tour callbacks, keyboard, dismissal and step hooks.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface TourOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string \| undefined` | Optional | See the type definition. |
| `dismissible` | `boolean \| undefined` | Optional | See the type definition. |
| `keyboard` | `boolean \| undefined` | Optional | See the type definition. |
| `beforeStep` | `((index: number, step: TourStep) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `afterStep` | `((index: number, step: TourStep) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `onStep` | `((index: number, step: TourStep) => void) \| undefined` | Optional | See the type definition. |
| `onFinish` | `(() => void) \| undefined` | Optional | See the type definition. |
| `onCancel` | `(() => void) \| undefined` | Optional | See the type definition. |

## FocusOptions {#api-focusoptions}

Focus options.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface FocusOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `preventScroll` | `boolean \| undefined` | Optional | See the type definition. |
| `restore` | `boolean \| undefined` | Optional | See the type definition. |

## ScrollOptions {#api-scrolloptions}

Scroll behavior, alignment, offset and container options.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface ScrollOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `behavior` | `"auto" \| "smooth" \| undefined` | Optional | See the type definition. |
| `block` | `"start" \| "center" \| "end" \| "nearest" \| undefined` | Optional | See the type definition. |
| `inline` | `"start" \| "center" \| "end" \| "nearest" \| undefined` | Optional | See the type definition. |
| `offset` | `number \| undefined` | Optional | See the type definition. |
| `container` | `string \| Element \| undefined` | Optional | See the type definition. |

## TargetResolver {#api-targetresolver}

Custom target resolver.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface TargetResolver
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `resolve` | `(target: { readonly target: string; readonly value: unknown; }, context: PageContext, signal: AbortSignal) => TargetAnchor \| null \| Promise<TargetAnchor \| null>` | Required | See the type definition. |

## HighlightRenderer {#api-highlightrenderer}

Highlight renderer mounted, rendered and destroyed by the overlay.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface HighlightRenderer
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `mount` | `(root: Document \| ShadowRoot \| Element) => void` | Required | See the type definition. |
| `render` | `(state: HighlightState \| null) => void` | Required | See the type definition. |
| `destroy` | `() => void` | Required | See the type definition. |

## TargetRuntime {#api-targetruntime}

DOM target runtime: resolve, focus and scroll.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface TargetRuntime
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `resolve` | `(target: TargetRef, context: PageContext, options: { readonly timeout: number; readonly waitForTarget: boolean; readonly signal: AbortSignal; readonly root?: Element \| ShadowRoot; }) => Promise<TargetAnchor \| null>` | Required | See the type definition. |
| `focus` | `(element: TargetAnchor, options: FocusOptions) => boolean` | Required | See the type definition. |
| `restoreFocus` | `(() => void) \| undefined` | Optional | See the type definition. |
| `scroll` | `(element: TargetAnchor, options: ScrollOptions) => void \| Promise<void>` | Required | See the type definition. |

## ScrollStrategy {#api-scrollstrategy}

Custom scroll strategy for non-native scrolling containers.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface ScrollStrategy
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `priority` | `number \| undefined` | Optional | See the type definition. |
| `matches` | `((element: TargetAnchor, options: ScrollOptions, context: PageContext) => boolean) \| undefined` | Optional | See the type definition. |
| `scroll` | `(element: TargetAnchor, options: ScrollOptions, context: PageContext) => void \| Promise<void>` | Required | See the type definition. |

## LinkProtocol {#api-linkprotocol}

Link protocol parser; synchronous and free of side effects.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface LinkProtocol
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `scheme` | `string` | Required | See the type definition. |
| `resolve` | `(value: string, location: RouterLocation) => LinkTarget \| null` | Required | See the type definition. |

## NavigationActionHandler {#api-navigationactionhandler}

Business action handler.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface NavigationActionHandler
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `button` | `boolean \| undefined` | Optional | See the type definition. |
| `invoke` | `(payload: unknown, context: PageContext) => void \| Promise<void>` | Required | See the type definition. |

## NavigationActionRegistration {#api-navigationactionregistration}

Action registration entry.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface NavigationActionRegistration
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `handler` | `NavigationActionHandler` | Required | See the type definition. |

## PageStateBridge {#api-pagestatebridge}

Delegated state bridge; the caller-owned store remains the source of truth.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageStateBridge<S>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | `unknown` |

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `read` | `() => S` | Required | See the type definition. |
| `call` | `((...args: unknown[]) => unknown \| Promise<unknown>) \| undefined` | Optional | See the type definition. |
| `write` | `((next: S) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `patch` | `((value: Record<string, unknown>) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `reset` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `subscribe` | `((listener: () => void) => () => void) \| undefined` | Optional | See the type definition. |
| `snapshot` | `(() => unknown \| Promise<unknown>) \| undefined` | Optional | See the type definition. |
| `restore` | `((value: unknown) => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `whenSettled` | `((signal?: AbortSignal) => void \| Promise<void>) \| undefined` | Optional | Await framework publication after a grouped mutation; custom asynchronous work remains app-owned. |

## RouterPlusPluginApi {#api-routerpluspluginapi}

Registration API available to plugins.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterPlusPluginApi
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `registerLinkProtocol` | `(protocol: LinkProtocol) => void` | Required | See the type definition. |
| `registerGuard` | `(guard: GlobalGuard, options?: { readonly priority?: number; }) => void` | Required | See the type definition. |
| `registerRetentionStrategy` | `(strategy: RetentionStrategy) => void` | Required | See the type definition. |
| `registerInstanceKeyStrategy` | `(name: string, strategy: InstanceKeyStrategy) => void` | Required | See the type definition. |
| `registerTargetResolver` | `(kind: string, resolver: TargetResolver) => void` | Required | See the type definition. |
| `registerHighlightRenderer` | `(renderer: HighlightRenderer, root?: Document \| ShadowRoot \| Element) => void` | Required | See the type definition. |
| `registerRouteTransformer` | `(transformer: RouteTransformer) => void` | Required | See the type definition. |
| `registerNavigationAction` | `(id: string, handler: NavigationActionHandler) => void` | Required | See the type definition. |
| `registerScrollStrategy` | `(strategy: ScrollStrategy) => void` | Required | See the type definition. |
| `registerTargetRuntime` | `(runtime: TargetRuntime) => void` | Required | See the type definition. |

## GlobalGuard {#api-globalguard}

Global leave or enter guard.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface GlobalGuard
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `beforeLeave` | `((context: PageContext) => GuardResult \| Promise<GuardResult>) \| undefined` | Optional | See the type definition. |
| `beforeEnter` | `((context: PageContext) => GuardResult \| Promise<GuardResult>) \| undefined` | Optional | See the type definition. |

## RetentionStrategy {#api-retentionstrategy}

Page retention and eviction strategy.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RetentionStrategy
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `decide` | `(instances: readonly PageInstance[], entering: PageInstance) => readonly string[]` | Required | See the type definition. |

## RouterPlusPlugin {#api-routerplusplugin}

Plugin declaration: id, dependencies, ordering and setup.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterPlusPlugin
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `requires` | `readonly string[] \| undefined` | Optional | See the type definition. |
| `before` | `readonly string[] \| undefined` | Optional | See the type definition. |
| `setup` | `(api: RouterPlusPluginApi) => void \| (() => void \| Promise<void>) \| Promise<void \| (() => void \| Promise<void>)>` | Required | See the type definition. |

## RouteTransformer {#api-routetransformer}

Native route record transformer.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouteTransformer
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | Required | See the type definition. |
| `transform` | `<T>(routes: readonly T[], context: { readonly framework: "react" \| "vue"; }) => readonly T[]` | Required | See the type definition. |

## RouterSnapshot {#api-routersnapshot}

Snapshot used for SSR and hydration.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterSnapshot
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `version` | `1` | Required | See the type definition. |
| `location` | `RouterLocation` | Required | See the type definition. |
| `state` | `unknown` | Required | See the type definition. |

## InstanceHost {#api-instancehost}

Instance host lifecycle reported by framework adapters.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface InstanceHost
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `mount` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `activate` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `deactivate` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `dispose` | `(() => void \| Promise<void>) \| undefined` | Optional | See the type definition. |
| `ready` | `(() => boolean) \| undefined` | Optional | See the type definition. |
| `root` | `(() => Element \| ShadowRoot \| null) \| undefined` | Optional | See the type definition. |

## PageLinkOptions {#api-pagelinkoptions}

Scheme and field configuration for semantic page links.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface PageLinkOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `scheme` | `string` | Required | See the type definition. |
| `pathKey` | `string \| undefined` | Optional | See the type definition. |
| `tabKey` | `string \| undefined` | Optional | See the type definition. |

## CreateRouterPlusOptions {#api-createrouterplusoptions}

Construction options for `createRouterPlus`.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface CreateRouterPlusOptions
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `hmr` | `false \| RouterPlusHotModule \| undefined` | Optional | Hot object of the owning module; omitted or false disables integration. |
| `pages` | `readonly PageDefinition<Record<string, string>, unknown>[]` | Required | Fixed array of page definitions; an id defaults to the path template. |
| `matcher` | `RouteMatcher \| undefined` | Optional | Defaults to the built-in matcher; framework adapters pass their native one. |
| `origin` | `string \| undefined` | Optional | Explicit origin for same-origin absolute hrefs; omitted in originless hosts. |
| `onDiagnostic` | `((error: unknown, stage: string) => void) \| undefined` | Optional | See the type definition. |
| `initialSnapshot` | `RouterSnapshot \| undefined` | Optional | See the type definition. |
| `routeTransformers` | `readonly RouteTransformer[] \| undefined` | Optional | See the type definition. |
| `globalKey` | `string \| false \| undefined` | Optional | Exposed in browsers by default; set `false` to disable. |
| `apiVersion` | `number \| undefined` | Optional | Contract version; only `1` is accepted in this release. |
| `plugins` | `readonly RouterPlusPlugin[] \| undefined` | Optional | See the type definition. |
| `pageLink` | `PageLinkOptions \| undefined` | Optional | See the type definition. |
| `historyStateKey` | `string \| undefined` | Optional | See the type definition. |
| `actions` | `readonly NavigationActionRegistration[] \| undefined` | Optional | See the type definition. |
| `navigationStrategy` | `"replace" \| "serial" \| undefined` | Optional | Replaces the latest target by default; `serial` runs requests in order. |
| `interactionOnNavigation` | `"end" \| "keep" \| ((context: PageContext) => boolean) \| undefined` | Optional | See the type definition. |
| `openExternal` | `((href: string) => void) \| undefined` | Optional | See the type definition. |
| `initialLocation` | `RouterLocation \| undefined` | Optional | Establishes an initial address before connection for SSR or hydration. |

## RouterPlusHotModule {#api-routerplushotmodule}

Structural disposal contract supplied by the instance-owning HMR module.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterPlusHotModule
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `dispose` | `(callback: () => void) => void` | Required | See the type definition. |

## RouterPlus {#api-routerplus}

Main instance contract.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterPlus
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | Required | Run existing commands in order, waiting for installed sources and framework publication. |
| `connect` | `(connection: RouterConnection) => () => void` | Required | See the type definition. |
| `disconnect` | `() => void` | Required | See the type definition. |
| `connected` | `boolean` | Required | See the type definition. |
| `hasCustomRenderer` | `boolean` | Required | See the type definition. |
| `ready` | `Promise<void>` | Required | Resolves after the initially configured plugins finish installing. |
| `dispose` | `() => Promise<void>` | Required | Disconnects, cancels interactions, awaits host and plugin cleanup and invalidates scopes. |
| `reportLocation` | `(location: RouterLocation) => void` | Required | See the type definition. |
| `scope` | `(context?: PageContext) => RouterPlus` | Required | Returns a stable facade bound to an instance; hidden instances keep their own context. |
| `whenReady` | `() => Promise<void>` | Required | Waits for initial installation, bridge restoration and queued host lifecycle work. |
| `snapshot` | `() => Promise<RouterSnapshot>` | Required | Captures addresses and supported explicit snapshots; native state SSR remains application-owned. |
| `restore` | `(snapshot: RouterSnapshot) => Promise<void>` | Required | See the type definition. |
| `transformRoutes` | `<T>(routes: readonly T[], framework: "react" \| "vue") => readonly T[]` | Required | See the type definition. |
| `use` | `(plugin: RouterPlusPlugin) => Promise<void>` | Required | See the type definition. |
| `unuse` | `(id: string, options?: { readonly cascade?: boolean; }) => Promise<void>` | Required | See the type definition. |
| `registerGuard` | `(guard: GlobalGuard, options?: { readonly priority?: number; }) => () => void` | Required | Register a global guard (leave/enter) with an optional priority. |
| `navigate` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | Required | Resolves the target, runs guards, commits one history entry and updates context and instance. |
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

## RouterPlusGlobal {#api-routerplusglobal}

Browser debug facade contract; not an authorization boundary.

**Import:** `@jangts/router-plus`。

### Definition

```ts
interface RouterPlusGlobal
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `execute` | `{ (command: RouterCommand): Promise<CommandResult>; (commands: readonly RouterCommand[], options?: CommandSequenceOptions): Promise<CommandSequenceResult>; }` | Required | See the type definition. |
| `navigate` | `(target: PageTarget, options?: NavigateOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `patchQuery` | `(patch: QueryRecord, options?: NavigateOptions) => Promise<CommandResult>` | Required | See the type definition. |
| `getContext` | `() => PageContext` | Required | See the type definition. |
| `getState` | `<T = unknown>(key?: string) => T` | Required | See the type definition. |
| `setState` | `(value: unknown, key?: string) => Promise<CommandResult>` | Required | See the type definition. |
| `patchState` | `(value: Record<string, unknown>, key?: string) => Promise<CommandResult>` | Required | See the type definition. |
| `resetState` | `(key?: string) => Promise<CommandResult>` | Required | See the type definition. |
| `callState` | `(id: string, ...args: unknown[]) => Promise<CommandResult>` | Required | See the type definition. |
| `listStateKeys` | `() => readonly string[]` | Required | See the type definition. |
| `getTab` | `() => string \| null` | Required | See the type definition. |
| `setTab` | `(tab: string) => Promise<CommandResult>` | Required | See the type definition. |
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
| `listTargets` | `() => readonly string[]` | Required | See the type definition. |
| `subscribe` | `(listener: (event: RouterEvent) => void) => () => void` | Required | See the type definition. |
| `pages` | `PageCatalog` | Required | See the type definition. |
| `version` | `string` | Required | See the type definition. |
| `apiVersion` | `number` | Required | See the type definition. |
