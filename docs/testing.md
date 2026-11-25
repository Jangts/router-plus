# Consumer testing

Router Plus testing helpers reuse the production runtime, Vue Test Utils and React Testing Library. Each call creates an independent fixture. Use your test runner's parameterization and assertions; application commands, permissions and business fixtures remain application-owned.

## Pure Node contracts

`@jangts/router-plus/testing` has no framework or DOM dependency. `createRouterPlusTest` accepts production Router Plus options plus `initial` (default `/`). It disables global registration by default, connects a memory connection and waits for RP readiness. `initial` is the sole address input; omit production `initialLocation` when sharing configuration.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterPlusTest } from '@jangts/router-plus/testing';

const pages = [{ path: '/items', title: 'Items' }];
for (const initial of ['/items', '/items?category=all']) {
  test(initial, async () => {
    const fixture = await createRouterPlusTest({ pages, initial });
    try {
      const receipt = await fixture.plus.navigate('/items?category=code');
      assert.equal(receipt.ok, true);
      assert.equal(fixture.connection.location.search, '?category=code');
      // Invoke your commands against fixture.plus and assert their real receipts/state here.
    } finally {
      await fixture.dispose();
    }
  });
}
```

Save this as `router.test.mjs` and run `node --test router.test.mjs`. For Vitest use `test.each` with the same create/try/finally pattern. Core helpers require only Router Plus and its supported Node environment.

## Framework components

Install the test tools for your framework as development dependencies:

```sh
npm install -D @vue/test-utils jsdom
# React projects:
npm install -D @testing-library/react @testing-library/dom jsdom
```

The independent `testing/vue` and `testing/react` entry points do not load each other. Configure Vitest with `test: { environment: 'jsdom' }`. For node:test, establish JSDOM globals in a preload/setup module before dynamically importing framework tools and application modules. Set an explicit document URL, such as `http://localhost/`, to provide a useful `document.baseURI`. The runner owns this environment; fixture disposal does not replace global variables or close a shared JSDOM. Do not concurrently swap DOM globals within one worker.

Vue and React Web component mounting needs a DOM implementation, even for shallow rendering. These helpers need no real browser or development server. Layout, scroll, geometry, visual effects and browser navigation are outside simulated DOM guarantees.

### Vue

```js
import { mountRouterPlus } from '@jangts/router-plus/testing/vue';
import { nextTick } from 'vue';
import Page from './Page.vue';
import { pages, routes } from './route-config.js'; // Pure production configuration.

const fixture = await mountRouterPlus(Page, {
  pages, routes, initial: '/items',
  mountOptions: { props: { title: 'Items' } },
});
try {
  const receipt = await fixture.plus.navigate('/items?category=code');
  await nextTick();
  expect(receipt.ok).toBe(true);
  expect(fixture.wrapper.text()).toContain('Items');
} finally {
  await fixture.dispose();
}
```

`mountOptions` forwards Vue Test Utils options, including application plugins and provides. The RP plugin is added automatically. `router` is a fresh Vue Router using memory history. For route-selected content, mount the production root containing RouterPlusView instead of a fixed page component.

### React

```js
import { renderRouterPlus } from '@jangts/router-plus/testing/react';
import { pages, routes } from './route-config.js'; // Fresh route objects from production config.

const fixture = await renderRouterPlus({ pages, routes, initial: '/items' });
try {
  const receipt = await fixture.run(() => fixture.plus.navigate('/items?category=code'));
  expect(receipt.ok).toBe(true);
  expect(fixture.result.getByText('Items')).toBeTruthy();
} finally {
  await fixture.dispose();
}
```

Use `routes` for a native data router with loaders, redirects and blockers; component elements belong in that route tree. Alternatively supply `ui` (a React element) instead of `routes` to mount under a declarative MemoryRouter. In the latter mode `router` is `null`; operate through `plus`. `renderOptions` forwards RTL options, including its application wrapper. Native queries, rerender and unmount remain on `result`. Use `run(operation)` for RP operations that wait for a React commit: it starts the operation inside `act`, lets React flush, then returns the original result. Awaiting a commit-dependent operation inside an ordinary `act` callback can otherwise block the commit it needs.

## Completion and cleanup

Construction waits for initial routing, RP readiness and the framework update. Subsequent operations retain their normal promises and receipts; use Vue `nextTick`/VTU `flushPromises` or React `act` as appropriate. No helper promises global idle or completion of arbitrary business I/O. Test cancellation using controllable promises; a cancelled receipt can still report a committed navigation.

`dispose()` returns a shared promise, unmounts this fixture and disposes its owned RP/router resources. Initialization failures clean up already-created resources. Cleanup continues after errors and reports AggregateError without discarding the initialization error. Helpers use fresh instances rather than accepting shared connected RP/router singletons. Keep production configuration free of import-time browser-history creation for pure Node tests; browser-dependent application modules belong in the DOM-configured group.

Framework test peers are optional: VTU 2.4.x, RTL 16.x and DOM Testing Library 10.x. They do not change existing framework runtime peer contracts. Select versions compatible with your application's Vue/React version; installed dependency combinations and actual verification are recorded separately from these API contracts.
