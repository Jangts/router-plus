# Integration and lifecycle

Connect the application first: create an instance, register two pages and provide the context through the framework entry. Native routes continue to own page rendering.

## React

```tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  createReactRouterPlus,
  RouterPlusLink,
  RouterPlusRedirect,
} from '@jangts/router-plus/react';

const plus = createReactRouterPlus({
  router: <BrowserRouter />,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { path: '/beta/:id', title: 'Beta' },
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
  <plus.Provider>
    <App />
  </plus.Provider>,
);
```

The instance returned by `createReactRouterPlus` carries a stable `Provider`. Keep the instance at module scope or in a state initializer; never recreate it on every render. An internally created Core is disposed automatically after its last Provider unmount only when `disposeOnUnmount: true` is set; StrictMode probes are ignored. The default is explicit disposal. Externally supplied Core instances remain caller-owned.

Plain JS/TS can pass a constructor tuple; props are inferred from the component. Omit the object when every prop is optional:

```ts
const plus = createReactRouterPlus({
  router: [BrowserRouter, { basename: '/' }],
  pages,
  globalKey: false,
});
```

### Data Router

This native API requires React Router DOM >=6.4. React Router 6.0–6.3 applications use the declarative integration above. Native transition blocking also requires blocker APIs on the supplied router.

```tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
```

Data Router content belongs in its route records and the Provider takes no children. Loaders, redirects and native route organization remain owned by React Router.

## Vue

```ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory, useRoute } from 'vue-router';
import {
  createVueRouterPlus,
  RouterPlusLink,
  RouterPlusView,
} from '@jangts/router-plus/vue';

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
    { path: '/beta/:id', title: 'Beta' },
  ],
  globalKey: false,
});

createApp({
  render: () =>
    h('main', [
      h(RouterPlusLink, { to: '/beta/42' }, () => 'Open Beta'),
      h(RouterPlusView),
    ]),
})
  .use(plus)
  .mount('#app');
```

`app.use(plus)` installs both the supplied Vue Router and the Plus connection. App unmount removes adapter subscriptions and disposes a factory-created Core; a router supplied by the application is never disposed by Plus.

## After connection

Once the Provider or plugin has connected, wait for initial installation and use the unified commands:

```ts
await plus.whenReady();

const result = await plus.navigate({ path: '/beta/42' });
if (!result.ok) console.error(result.reason, result.message);

await plus.back();
```

`ready` waits for initial plugin installation and explicit initial snapshot restoration; `whenReady()` also waits for registered bridge restoration and queued instance-host lifecycle work.

## Reusing an existing Core

Both framework factories accept `{ plus: existingCore, router }`. Omit construction options such as `pages`; the caller keeps ownership and calls `await plus.dispose()` at the end of the lifetime.

## Incremental adoption

An application that already mounts its native router can use the low-level `createReactProvider({ useLocation, useNavigate })` or `createVueConnection(router)`. They only connect; they neither replace the router nor mount an overlay.

See [Pages and instances](pages-and-instances) for address definitions and [Native state and query parameters](state-and-tabs) for live sources.

## Hot module replacement

Pass the owning module's hot object as `hmr` when creating Core, React or Vue instances. No bundler dependency is added. RP registers disposal only: it does not call `accept()`, install a development server, or dispose the application's native router. Let the framework/entry boundary remount consumers with the new instance; do not self-accept an instance module while consumers still hold its disposed exports. HMR recreates the instance with current configuration; it does not preserve in-memory page state automatically.

| Tool | Configuration value |
| --- | --- |
| Vite | `import.meta.hot` |
| Webpack 5 | `import.meta.webpackHot` (ESM) or `module.hot` |
| Rspack / Rsbuild | `import.meta.webpackHot` (ESM) or `module.hot` |
| Parcel | `module.hot` |
| Other HMR runtimes | An object implementing `dispose(callback)` |
| Rollup / esbuild without an HMR runtime | Omit `hmr`; watch/rebuild alone is not HMR |

```ts
// Vite: put this in the module that owns the RP instance.
import { createRouterPlus } from '@jangts/router-plus';
export const plus = createRouterPlus({
  pages: [{ path: '/', title: 'Home' }],
  hmr: import.meta.hot,
});
```

```ts
// Webpack 5 / Rspack / Rsbuild, in the instance-owning ESM module:
export const plus = createRouterPlus({
  pages: [{ path: '/', title: 'Home' }],
  hmr: import.meta.webpackHot,
});
// For Webpack/Rspack CommonJS or Parcel, use:
// hmr: typeof module !== 'undefined' ? module.hot : undefined
```

The same option is accepted by `createReactRouterPlus` and by `createVueRouterPlus` when the adapter creates Core. With an externally supplied `plus`, configure `hmr` on Core and dispose the adapter connection at the owning application's HMR boundary. Use the bundler's client types for `import.meta.hot`, `import.meta.webpackHot` or `module.hot`; RP exports the structural `RouterPlusHotModule` type without extending global host types.

Before asynchronous cleanup, disposal releases RP's exact global facade and disconnects navigation. Delayed old cleanup cannot remove a replacement instance or a foreign facade. Vue connection disposal is idempotent across HMR, app unmount and explicit disposal. It attempts every cleanup even if a native unsubscribe throws; adapter failures are reported through `onDiagnostic` at `hmr.dispose` during HMR and `vue.dispose` otherwise. Diagnostic callback failures do not interrupt cleanup. Cleanup failures are reported through `onDiagnostic(error, 'hmr.dispose')`. Production or non-HMR hosts pass `undefined`/`false`. A collision without a matching disposal remains an error; independent applications must use distinct `globalKey` values. See [Vite](https://vite.dev/guide/api-hmr.html), [Webpack](https://webpack.js.org/api/hot-module-replacement/), [Rspack](https://rspack.dev/api/runtime-api/hmr), and [Parcel](https://parceljs.org/features/development/).
