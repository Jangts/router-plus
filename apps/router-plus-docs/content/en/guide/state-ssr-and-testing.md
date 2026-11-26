# SSR and testing

Core neither accesses DOM at import time nor loads framework dependencies. Create a separate Router Plus instance and native stores for each SSR request. Do not reuse a module-level mutable instance between users.

## Initial address and snapshots

```ts
import { createRouterPlus } from '@jangts/router-plus';

const plus = createRouterPlus({
  pages: [{ path: '/orders/:id', title: 'Order' }],
  initialLocation: { pathname: '/orders/42', search: '', hash: '' },
  globalKey: false,
});
await plus.whenReady();
const snapshot = await plus.snapshot();
await plus.dispose();
```

The client can initialize with the same page catalog and initialSnapshot for addresses and RP-supported snapshot data. Application state still uses its native store's SSR serialization/restoration, with matching component initial values. Registering an ID does not automatically persist native values. Safely escape snapshots embedded into HTML rather than concatenating user input into scripts.

## Memory connection tests

```ts
import assert from 'node:assert/strict';
import { createRouterPlus } from '@jangts/router-plus';
import { createMemoryConnection } from '@jangts/router-plus/testing';

const plus = createRouterPlus({
  pages: [{ path: '/orders/:id', title: 'Order' }],
  globalKey: false,
});
const disconnect = plus.connect(createMemoryConnection({
  initial: { pathname: '/orders/1' },
}));
try {
  const result = await plus.navigate('/orders/42');
  assert.equal(result.ok, true);
  assert.equal(plus.getContext().params.id, '42');
} finally {
  disconnect();
  await plus.dispose();
}
```

Test values, callback results and cleanup through real hooks or native store registration APIs. createMemoryHost and createFakeBridge support isolated host/connection contract tests; they are not everyday application state registration APIs.

Memory tests prove their contracts, not browser history, CSS layout or real bundler HMR execution. Check native commits, conditional mounting and unregistration in the integrating application.

## Lifecycle and diagnostics

Core `dispose()` synchronously releases its global facade and disconnects navigation, then waits for asynchronous cleanup. Repeated and reentrant calls share completion. State mutations and retention operations after disposal return cancellation. Vue connection cleanup is idempotent across HMR, unmount and explicit disposal; an old adapter's unmount cannot disconnect a replacement connection.

`onDiagnostic(error, stage)` receives technical diagnostics. A failing diagnostic callback cannot replace the primary result or interrupt isolated cleanup. Applications decide what to display from receipts. See [Integration and lifecycle](getting-started#hot-module-replacement) for HMR ownership.

For consumer batch tests, use the [RP testing helpers](./testing) with DOM-free, Vue or React fixtures.
