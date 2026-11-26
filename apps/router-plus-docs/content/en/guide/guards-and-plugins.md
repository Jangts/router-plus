# Guards and plugins

Guards decide whether navigation may commit; plugins register protocols, resolvers, renderers and strategies on the instance. Both interpret generic contracts, while the caller supplies business names and data.

Authorization, draft, analytics and subscription helpers in these examples are application-provided.

## Page guards

```ts
const pages = [
  {
    path: '/orders/:id/edit',
    title: 'Edit order',
    guards: {
      beforeLeave: async ({ context, signal }) => {
        if (!hasUnsavedChanges(context)) return true;
        return { message: 'There are unsaved changes. Leave anyway?' };
      },
      beforeEnter: async ({ context }) => {
        if (!canEdit(context)) return { redirect: { path: '/login' } };
        return true;
      },
      afterEnter: ({ context }) => {
        reportVisit(context.pageId);
      },
      onRetain: ({ instance }) => pauseSubscriptions(instance),
      onRestore: ({ instance }) => resumeSubscriptions(instance),
    },
  },
];
```

`GuardResult` supports:

- `true`: allow;
- `false`: reject without a message;
- `{ redirect: PageTarget }`: go to another target, still bounded against loops;
- `{ message: string }`: reject with a displayable message.

A guard receives `context`, its `page` and an abort signal. The signal fires when a newer target replaces the navigation; an already committed framework change is not rolled back.

## Global guards and hooks

```ts
const stop = plus.registerGuard({
  id: 'auth',
  beforeEnter: async (context) => {
    if (context.pageId === 'orders-detail' && !(await isSignedIn())) {
      return { redirect: { path: '/login' } };
    }
    return true;
  },
});
```

React registers a guard for a component lifetime:

```tsx
import { usePageLeaveGuard } from '@jangts/router-plus/react';

usePageLeaveGuard({
  id: 'draft',
  beforeLeave: () => (dirty ? { message: 'Unsaved changes' } : true),
});
```

Vue’s `usePageLeaveGuard` lives in the component scope and is removed on unmount. Hooks inside a boundary register instance-scoped guards; provider-level guards are global.

## Plugins

```ts
import type { RouterPlusPlugin } from '@jangts/router-plus';

const analytics: RouterPlusPlugin = {
  id: 'analytics',
  requires: ['telemetry'],
  setup(api) {
    api.registerNavigationAction('track', {
      invoke: (payload, context) => report(payload, context.pageId),
    });

    return () => {
      // Cleanup may return a Promise; unload waits for it.
    };
  },
};
```

```ts
const plus = createRouterPlus({
  pages,
  plugins: [telemetry, analytics],
  globalKey: false,
});
```

Plugins install in `requires` and `before` order; dynamic installation cannot break an existing order. Registrations in `setup` are transactional and roll back on failure. Unloading a plugin that others still require is rejected unless `cascade` is explicit.

`setup(api)` can register:

| Capability | Method |
| --- | --- |
| Link protocols | `registerLinkProtocol` |
| Global guards | `registerGuard` |
| Retention strategies | `registerRetentionStrategy` |
| Instance key strategies | `registerInstanceKeyStrategy` |
| Target resolvers and runtime | `registerTargetResolver`, `registerTargetRuntime` |
| Highlight renderers | `registerHighlightRenderer` |
| Route transformers | `registerRouteTransformer` |
| Navigation actions | `registerNavigationAction` |
| Scroll strategies | `registerScrollStrategy` |

## Route transforms

```ts
const versioned: RouterPlusPlugin = {
  id: 'versioned-routes',
  setup(api) {
    api.registerRouteTransformer({
      id: 'add-version-meta',
      transform: (routes, { framework }) =>
        routes.map((route) => ({
          ...route,
          meta: { ...route.meta, framework, version: 1 },
        })),
    });
  },
};
```

`plus.transformRoutes(routes, framework)` applies transformers in registration order. Generated React/Vue records pass through the same mechanism before they are returned.

## Ownership boundary

Plus supplies generic guards and registration only. Business path policy, authorization, roles and page visibility belong to the application. The page catalog exposes safe metadata and is not an authorization boundary.

[Highlights and tours](interactions) use the same plugin and interaction contracts.
