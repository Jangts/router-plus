# Navigation and results

All navigation uses one target and command model. Success reflects the native router’s actual commit, including the final redirect location; failures use `reason` to distinguish causes.

## Targets

`PageTarget` accepts four forms:

```ts
await plus.navigate('/orders/42');
await plus.navigate({ path: '/orders/42', values: { section: 'details' }, replace: true });
await plus.navigate({ pathname: '/orders/42', search: '?draft=1', hash: '#items' });
await plus.navigate({ page: 'orders-detail', params: { id: '42' }, values: { section: 'details' }, hash: '#items' });
```

- Path objects may point outside the catalog; `pageId` and the instance are `null` there.
- Page objects must reference a registered id; missing or invalid parameters return `unknown-page` or `invalid-param`.
- Query pairs (`queryAll`) and raw search are retained in context. Ordinary duplicate keys are allowed, but an ordinary bound query field must have one valid value; custom group codecs interpret declared repeated parameters.

Target resolution is read-only:

```ts
plus.resolveTarget({ page: 'orders-detail', params: { id: '42' } });
plus.resolveHref('/orders/42');
plus.resolveLink({ action: 'export-orders', payload: { format: 'csv' } });
```

`resolveTarget` synchronously returns a page/external plan or `null`; `resolveLink` also accepts business actions; `resolveHref` returns a page href only. Invalid input and protocol failures execute no effects.

## Partial query updates

Use `plus.patchQuery({ page: undefined, keyword: 'coffee', tags: ['hot', 'new'] }, { replace: true })` to change selected keys. Undefined and empty arrays remove a key; empty strings remain values. Unnamed parameters, hash, unrelated history payloads and non-query navigation state survive. Explicit `options.state` replaces the history payload. An unchanged patch returns `noop` without adding history. Complete `usePageQuery` setters retain full replacement semantics.

`{ page, params, query, hash }` builds a registered-page deep link without concatenating its path. Hash must be empty or start with `#`; hash-only string navigation keeps the current query.

## Commands

| Group | Commands |
| --- | --- |
| Navigation | `navigate`, `replace`, `back`, `forward`, `go`, `query.patch` |
| Context | `context.read` |
| State | `state.read`, `state.set`, `state.patch`, `state.reset`, `state.call` |
| Highlights | `highlight.set`, `highlight.clear` |
| Tours | `tour.start`, `tour.next`, `tour.prev`, `tour.stop` |
| Interaction | `focus`, `scroll.to` |
| Instances | `retain`, `release` |

Typed methods and `execute(command)` share handlers. Prefer typed methods and use command objects for diagnostics or forwarding.

## Reading the result

```ts
const result = await plus.navigate({ page: 'orders-detail', params: { id: '42' } });

if (result.ok) {
  console.log('committed', result.value);
} else {
  console.error(result.reason, result.message, result.stage, result.committed);
}
```

- `blocked`: a guard or the native router rejected the transition.
- `cancelled` / `superseded`: cancelled or replaced by a newer target.
- `invalid-target` / `unknown-page` / `invalid-param` / `invalid-tab`: the target cannot be resolved.
- `unsupported-command` / `not-connected` / `not-ready`: a capability is missing or the connection is not ready.

A post-commit callback failure keeps `committed: true`. Read `NavigationResult` for richer facts: actual location, context, navigation ID and redirect facts. Failure receipts carry stage and committed flags.

## Execution order

One navigation runs:

1. resolve the target;
2. leave guards;
3. enter guards;
4. one history commit;
5. context and instance updates;
6. post-commit callbacks such as `afterEnter`.

The default strategy replaces the latest target; `navigationStrategy: 'serial'` serializes requests. Redirect loops are bounded, and Plus cancellation does not undo a committed framework change.

## Native transitions and interception

Core does not observe the browser. A connection supplies the initial snapshot, commit, subscription and optional traversal; `intercept(check)` connects native framework transitions to the same guard evaluation.

- Vue adapters support native pre-navigation interception. The assembled React Data Router adapter provides interception when the native router exposes blocker APIs; construction of a Data Router requires React Router DOM >=6.4 and does not by itself imply blocker availability.
- Ordinary declarative React Router observes native commits and checks Plus-initiated navigation.
- Full document unload and refresh cannot await asynchronous page guards.

## Semantic links and business actions

Configure `pageLink` to encode and parse semantic links:

```ts
import { createRouterPlus, createPageLink } from '@jangts/router-plus';

const plus = createRouterPlus({
  pages,
  pageLink: { scheme: 'app', pathKey: 'screen' },
  globalKey: false,
});

const href = createPageLink({ path: '/orders/42?section=details' }, {
  scheme: 'app', pathKey: 'screen',
});
plus.resolveLink(href);
```

Registered actions handle non-navigation behavior:

```ts
const plus = createRouterPlus({
  pages,
  actions: [
    {
      id: 'export-orders',
      handler: {
        button: true,
        invoke: (payload) => exportOrders(payload),
      },
    },
  ],
  globalKey: false,
});
```

Action links render as buttons; resolving never invokes the handler. Protocol parsers must be synchronous and side-effect free; cycles, thenables and excessive recursion are rejected.

Declare section in page states and register the native source with the same ID. See [State access and command sequences](state-access) for command arrays and conditional source waits.
