# Pages and instances

The catalog declares paths, identity, navigable state and retention. Components and layouts are supplied through native routes or route generators.

## Pages and address state

```ts
import type { PageDefinition } from '@jangts/router-plus';

const pages: PageDefinition[] = [
  { id: 'orders', path: '/orders', title: 'Orders' },
  {
    id: 'order',
    path: '/orders/:id',
    title: 'Order',
    params: { id: value => /^\d+$/.test(value) || 'Invalid order ID' },
    states: {
      section: { default: 'summary', values: ['summary', 'details'], query: true },
    },
    retain: { max: 8 },
  },
];
```

An omitted `id` defaults to the path template. `states.section` is an address contract, not component state. Register the live native source under the same ID. Navigation can then specify `values: { section: 'details' }` before the page mounts. Query updates preserve unrelated parameters and the hash.

`pathAliases` adds paths for the same page. Duplicate IDs, invalid defaults, query ownership conflicts, missing/cyclic parents and nonpositive integer retention limits are rejected.

## Instance identity and retention

- A page ID identifies the definition, such as `order`.
- `instanceKey` defaults to pathname: `/orders/1` and `/orders/2` are separate instances. Alternatives are `'page'`, `{ params: ['id'] }` or a function.
- `instance.stateKey` combines the page ID and instance key into a scope identity. Source IDs such as `section` live inside that scope and are separate identifiers.
- The native router owns history entry identity for commits/traversal; query-bound values restore from the address.

`retain: true` has no count limit. `{ max: 8 }` caps the page's total retained instances including the entering active instance, evicting inactive instances by LRU. React `RouterPlusOutlet` or Vue `RouterPlusView` must also retain the rendering host; the declaration alone does not cache DOM.

## Reading and selecting instances

React components use `usePageContext()` / `usePageMatch()`. Vue setup uses the same names returning readonly refs/computed values. Core exposes `getContext()`, `getInstance()` and `match(pathname)`.

Read `context.params`, `context.values`, `context.instance` and `context.query`. `query` keeps the first value for each parameter, while `queryAll` preserves duplicates. Read live native state through native variables or `plus.getState(id)`. `plus.scope(context)` selects a retained instance without changing the active page.

`plus.pages` projects public page IDs, paths, titles, states, retention and parent metadata. It excludes application `meta` and guard implementations and is not an authorization boundary.

## Generate native routes

```tsx
import { createReactRoutes } from '@jangts/router-plus/react';
const routes = createReactRoutes(pages, {
  components: { orders: OrdersList, order: OrderDetail },
});
```

```ts
import { createVueRoutes } from '@jangts/router-plus/vue';
const routes = createVueRoutes(pages, {
  components: { orders: OrdersList, order: OrderDetail },
});
```

`OrdersList` / `OrderDetail` are application components. Generators select them by page ID and return native-compatible route records. The application owns loading, error handling and route tree layouts. Pass `{ plus, components }` to apply registered route transformers; otherwise generation is independent of an instance.

`await plus.retain()` manually retains the current instance without changing its page definition. Keep a retained rendering host mounted to preserve DOM. `await plus.release()` releases the current scope and rebuilds its active subtree; it does not disable the page’s declared retention policy. A Vue View `cache` prop does not replace the Core retention declaration.
