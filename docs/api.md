# API and connections

## Construction and capability selection

`createRouterPlus(options)` creates an isolated instance. `pages` is a fixed array of page definitions. An id defaults to its template path. Duplicate ids, invalid parent references, parent cycles, invalid state defaults or duplicate bound query keys and nonpositive retention limits are configuration errors.

Optional construction inputs include `matcher`, `onDiagnostic`, `plugins`, `actions`, `pageLink`, `historyStateKey`, `navigationStrategy`, `interactionOnNavigation`, `initialLocation`, `initialSnapshot` and `routeTransformers`. The default API version is integer `1`; it is independent of package semver.

`ready` waits for initial installation. `whenReady()` additionally waits for registered bridge restoration and queued instance-host lifecycle work. `dispose()` disconnects navigation, cancels interaction work, awaits host/plugin cleanup, invalidates scopes and detaches the global facade. Repeated disposal shares the same Core completion promise, including while cleanup is pending. Diagnostic callbacks preserve their existing `(error, stage)` contract; a diagnostic callback throwing does not replace the primary result or interrupt cleanup.

`globalKey` defaults to `__ROUTER_PLUS__` in browsers. Set it to false to disable exposure. A key conflict is rejected rather than overwriting another instance. The facade supports commands, current-page state and interactions, but not plugin or host installation. This is a debugging surface, not an authorization boundary.

Attaching to an occupied global property throws, including properties whose value is undefined. Cleanup removes only the exact facade installed by that attachment. A foreign replacement or a later attachment survives an older cleanup function. Automatic mounting checks the key before starting initial plugin setup.

## Targets and commands

Navigation accepts path/href strings, `{ path, values?, state?, replace? }`, `{ pathname, search?, hash?, state?, replace? }` and `{ page, params?, query?, hash?, values?, state?, replace? }`. Path targets may be outside the page directory and then have null pageId/instance. Id targets must be registered. Query pairs and raw search are retained in context; ordinary duplicate query keys are allowed. Registered query-bound state fields require a single valid value.

`resolveTarget` is synchronous and returns a page/external plan or null. `resolveLink` additionally accepts `{ action, payload? }`; action links are buttons and execute the registered handler. `resolveHref` returns a page href only. Invalid input and protocol resolution failures do not execute effects.

A configured `pageLink` provides scheme/pathKey/tabKey encoding through `createPageLink` and `parsePageLink`. Protocol plugins use the same final validation. A protocol parser is synchronous, does not execute effects, and may return another link target; cycles, thenables and excessive recursion are rejected.

`execute(command)` and typed methods use the same command handlers:

| Group | Commands |
| --- | --- |
| Navigation | navigate, replace, back, forward, go, query.patch |
| Context | context.read |
| Compatibility | tab.read, tab.set (ordinary `tab` state) |
| State | state.read, state.set, state.patch, state.reset, state.call |
| Highlight | highlight.set, highlight.clear |
| Tour | tour.start, tour.next, tour.prev, tour.stop |
| Interaction | focus, scroll.to |
| Instance | retain, release |

`patchQuery(patch, options?)` updates only named parameters through the same operation as `{ kind: 'query.patch', patch, options? }`. String arrays preserve repeated values; undefined and empty arrays remove the named parameter, and empty strings remain values. Unrelated query parameters, hash, history payload and non-query navigation state survive; an explicit `options.state` replaces the caller history payload. An unchanged patch returns `noop` without a new history entry. React query setters expose `.patch(...)`; Vue query helpers expose `patchQuery(...)`. See [direct query editing](state-bindings.md#direct-query-editing).

Results have `{ ok: true, value? }` or `{ ok: false, reason, message?, navigationId?, stage?, committed? }`. A post-commit callback failure retains `committed: true`. Unsupported commands, unregistered pages/actions, missing targets, readonly state, unavailable ports and cancellation have separate reason codes in the public `CommandReason` union.

## Sequential command groups

`execute(commands, options?)` accepts an array of the existing commands on instances, scoped facades and the console facade. Single-command execution is unchanged. Commands run in order and stop at the first failure; they are never retried or rolled back. The command order is copied at entry, but business payloads are not deep-cloned.

```ts
const result = await plus.execute([
  { kind: 'navigate', target: '/customers/42' },
  { kind: 'state.set', key: 'tab', value: 'details' },
  { kind: 'state.set', key: 'editPanel', value: true },
  { kind: 'state.patch', key: 'customerForm', value: { name: 'Ivan' } },
  { kind: 'state.call', id: 'submitCustomer' },
], { timeoutMs: 10000, signal });
```

Each state step waits for its exact installed source (or an indexed global Store parent for a field path), runs registered restoration and awaits the framework publication boundary. The next command can therefore target a source created by a Tab or Panel's conditional rendering. Catalog declarations alone do not satisfy source readiness. A present readonly/non-callable source fails through the normal command handler instead of waiting for an unsupported operation.

After a successful navigation/traversal step, including `query.patch`, the group selects the actual resulting page scope, including redirects. Subsequent operations use that concrete instance. Unrelated navigation to another instance, release, disposal, active source unregistration/replacement or an aborted signal stops the group. Scoped groups may start on a retained instance; after an explicit navigation they follow its actual destination. Waiters subscribe before checking existing registrations and use events, with no polling or sleeps.

`timeoutMs` is a finite total deadline from 0 to 2147483647 ms (default 10000 ms); zero expires immediately. Success returns `{ ok: true, results }`. Failure returns `{ ok: false, reason, failedIndex, results }`, with a zero-based index. `results` preserves actual completed command receipts, including a successful mutation whose subsequent publication failed. If a step is still in flight at cancellation/timeout, its final business outcome may remain unknown. Previously issued calls/navigation may still complete: stopping a group does not revoke native side effects or authorize retrying a submit.

React source adapters wait for a committed render and publication of current accessors/callbacks; Vue adapters use `nextTick`. A custom bridge can implement `whenSettled(signal?)` to expose its publication boundary. This is not an application-wide idle detector: network loading, custom transitions and business initialization must be represented by an awaited application operation or by registering the dependent source only when usable. Custom setters/callbacks must return their real asynchronous completion. `whenReady()` by itself does not wait for a future component registration.

## Source lifecycle events

The existing `subscribe(listener)` channel includes `state.registered`, `state.unregistered` and `state.committed`; each contains `source: StateInspection` without reading values. Registration means the complete registration group is installed, not that arbitrary business initialization finished. Failed registration groups emit no lifecycle registration events. Successful registrations unregister once, including scope release and router disposal. A framework commit may be reported even if the source's value did not change. Ordinary `state` events continue to report value changes.

Scoped subscriptions include global source events and their own page instance's source events. `disposed` reports router shutdown so waits can stop immediately. Publication events describe the adapter boundary, not business validation, permissions or readiness of all descendants.

## Connections and matching

`connect(connection)` subscribes before applying its initial snapshot. The returned function disconnects only that connection. A connection supplies `initial`, `commit(request)` and `subscribe(listener)`, optionally a matcher, native transition interceptor and traversal methods. Connection capabilities describe available implementations; observing an already committed location cannot prevent it.

A commit request includes operation id, href/path, merged state, options and AbortSignal. A receipt distinguishes committed, blocked, cancelled, failed and noop. Successful receipts contain the actual location, including redirects and history entry identity. Subscriptions identify the operation when available so receipts and notifications can be deduplicated.

The matcher owns path syntax and parameter construction. Framework adapters supply their native matcher; other connections can supply a custom object. The core default supports ordinary named parameters and trailing splats. Authoritative framework `matched` mappings, when present, take precedence over inferred directory matches and must reference valid unique page ids.

Navigation runs parsing, leave guards, enter guards, one history commit, context/instance updates and afterEnter. Core cancellation does not undo an already committed framework change. Latest-target replacement is the default; `navigationStrategy: 'serial'` serializes requests. Redirect loops are bounded.

`intercept(check)` connects native framework transitions to the same guard evaluation. A Plus-originated transition is checked once. Native calls remain valid without interception, but then only committed context is observed. Full document unload and refresh do not support asynchronous page guards.

## Plugins and route transforms

Plugins declare id, requires, before and setup. Static installation uses dependency ordering. Dynamic installation rejects impossible reordering. Setup registrations are transactional; failure rolls them back. Unloading a required plugin is rejected unless cascade is explicit. Cleanup functions may return promises and are awaited.

Plugins register link protocols, guards, retention/instance-key strategies, target resolvers/runtime, highlight renderers, scroll strategies, actions and route transformers. A renderer receives highlight events after mounting on its supplied root. `transformRoutes(routes, framework)` applies registered transforms, and generators can receive the same instance through their options.

These mechanisms interpret generic contracts only. Handler names, payloads and metadata are supplied by the caller.

`nextTourStep(step = 1)` and `{ kind: 'tour.next', step }` accept signed relative movement. Negative values move backward, zero is a no-op, movement before the beginning clamps to the first step, and movement beyond the end finishes. Non-safe-integer steps return `invalid-target`. `prevTourStep()` delegates with -1. Both default and App-owned highlight components receive this operation as `context.next(step = 1)` through the same component contract; no active tour yields cancellation.

## HMR ownership

`CreateRouterPlusOptions.hmr?: RouterPlusHotModule | false` accepts a structural `dispose(callback: () => void): void` host. It registers instance disposal without accepting module updates. The option is inherited by React/Vue factories that create Core. See [framework integration](frameworks.md#hot-module-replacement) for bundler-specific values and lifecycle boundaries. `dispose()` synchronously relinquishes the owned global facade before its asynchronous cleanup finishes.

## Consumer testing / 消费端测试

- `@jangts/router-plus/testing`: `createRouterPlusTest` creates a real RP instance connected to memory history without DOM or framework dependencies.
- `@jangts/router-plus/testing/vue`: `mountRouterPlus` combines Vue Test Utils, RP and Vue Router memory history.
- `@jangts/router-plus/testing/react`: `renderRouterPlus` combines React Testing Library, RP and native memory routing; `run` handles commit-dependent operations.

Complete setup, options, results and batch examples: [Consumer testing](testing.md).
