# Application integration recipes

Use one source for each decision: the native router owns routing, native state owns live values, and Router Plus owns address synchronization and page-instance retention. Business loading, authorization, confirmation UI and application-specific value mappings stay in the application.

## Vue: dashboard tabs and filters

Install the native router and Plus at the application entry. Page components register native values; no route-to-state and state-to-route watcher pair is needed.

```ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createVueRouterPlus, RouterPlusView, useRpRef,
  useRpReactiveState } from '@jangts/router-plus/vue';

const Dashboard = defineComponent({
  setup() {
    const tab = useRpRef('summary', {
      id: 'tab', query: true, history: 'push', values: ['summary', 'products'],
    });
    const filters = useRpReactiveState({ keyword: '', page: 1 }, {
      id: 'filters', query: true, omitDefault: true,
      fields: { page: { validate: value => Number.isInteger(value) && Number(value) > 0 } },
    });
    return () => h('section', [
      h('button', { onClick: () => { tab.value = 'products'; } }, 'Products'),
      h('input', { value: filters.keyword, onInput: (event: Event) => {
        filters.keyword = (event.target as HTMLInputElement).value;
        filters.page = 1;
      } }),
      h('p', `${tab.value}: ${filters.keyword} / ${filters.page}`),
    ]);
  },
});
const router = createRouter({ history: createWebHistory(),
  routes: [{ path: '/dashboard', component: Dashboard }] });
const plus = createVueRouterPlus({ router,
  pages: [{ path: '/dashboard', title: 'Dashboard', retain: true }], globalKey: false });
createApp({ render: () => h(RouterPlusView) }).use(plus).mount('#app');
```

A URL such as `/dashboard?tab=products&keyword=coffee&page=2` restores native values. Editing the keyword and resetting the page in one turn commits one address change, preserving unrelated parameters and the hash. The page validator is business policy; the synchronization mechanism is shared. If the catalog declares `states`, bind by ID to inherit that contract rather than duplicate query/default/enum rules in the component.

## Partial query changes with deletion semantics

Use a patch when changing only a few address parameters. Unmentioned keys and the hash survive. `undefined` deletes the named key, an empty string retains an empty value, an empty array clears the key, and an array writes repeated values. A patch with no effective change returns the normal `noop` receipt. Patches edit the actual URL and do not materialize the read-only fallback passed to usePageQuery(defaultInit).

```ts
import type { RouterPlus } from '@jangts/router-plus';
async function applyFilters(plus: RouterPlus) {
  return plus.patchQuery({ keyword: 'coffee', page: undefined, tags: ['hot', 'new'] },
    { replace: true });
}
```

React uses `const [, setQuery] = usePageQuery()` followed by `setQuery.patch(record, options)`. Vue uses `usePageQuery().patchQuery(record, options)`. Command sequences use the same operation: `plus.execute([{ kind: 'query.patch', patch: { page: undefined }, options: { replace: true } }])`. Complete query replacement still uses the existing setter. Functional setters can return strings, URLSearchParams, tuple pairs or repeated-value records. Keep the returned receipt when business feedback depends on rejection, cancellation or a committed failure.

## Asynchronous version catalogs

The application supplies its loading result and a valid fallback. Use a readiness predicate instead of unregistering/re-registering the state or implementing loading-time write locks.

```ts
// Inside component setup; the entry above already provides Plus.
import { ref } from 'vue';
import { useVueState } from '@jangts/router-plus/vue';
const loaded = ref(false);
const loadError = ref<Error | null>(null);
const versions = ref<Array<{ id: string; label: string }>>([]);
const selected = ref('current');
useVueState(selected, {
  id: 'version', query: 'version', ready: () => loaded.value && !loadError.value,
  validate: value => value === 'current' || versions.value.some(item => item.id === value),
  encode: id => id === 'current' ? undefined : versions.value.find(item => item.id === id)?.label,
  decode: raw => versions.value.find(item => item.label === raw)?.id ?? 'current',
});
// Your loader assigns versions, then loaded; on failure it assigns loadError.
```

Version ID/label mapping, permission filtering, catalog requests and loading/error UI remain application logic. During loading, the address is preserved. Once ready, Plus restores the latest address; a valid native address-field choice made while pending takes priority over the older intent. `whenReady()` does not fetch or wait for the business catalog. Empty successful catalogs and failed loads must remain distinguishable.

## A catalog in a separate native store

When a binding reads readiness, validation or codec data from an independent Store/Atom, subscribe to that dependency through `observe`. The callback only notifies Plus to reread its rules; it does not copy state or load data. Registration owns the returned cleanup. Keep `ready` a pure synchronous predicate.

```ts
import type { RouterPlus } from '@jangts/router-plus';
import { createStore } from 'zustand/vanilla';
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
function bindVersionFilters(plus: RouterPlus) {
  const catalog = createStore<{ loaded: boolean; versions: Array<{ id: string; label: string }> }>(
    () => ({ loaded: false, versions: [] }));
  const filters = createStore(() => ({ version: 'current' }));
  const stop = registerZustandState(plus, filters, {
    id: 'filters', ready: () => catalog.getState().loaded,
    observe: notify => catalog.subscribe(notify),
    fields: { version: {
      query: 'version',
      validate: value => value === 'current' || catalog.getState().versions.some(item => item.id === value),
      encode: id => id === 'current' ? undefined : catalog.getState().versions.find(item => item.id === id)?.label,
      decode: raw => catalog.getState().versions.find(item => item.label === raw)?.id ?? 'current',
    } },
  });
  return { catalog, filters, stop };
}
```

The app loads and updates `catalog` normally. A directory change triggers revalidation even when `filters` has not changed. Call `stop()` when this store registration ends. Structural metadata and the dependency subscription are fixed for the registration lifetime; changing an ID or dependency source requires a new registration. A loading failure can remain not-ready according to the application's loading state.

## One business request path for initial and subsequent routes

Use one immediate watcher for the route input, with cancellation and an error state. This watcher loads business data; it does not mirror query values or own address restoration.

```ts
// Inside component setup.
import { ref, watch } from 'vue';
import { usePageContext } from '@jangts/router-plus/vue';
const context = usePageContext();
const detail = ref<unknown>(null);
const detailError = ref<Error | null>(null);
watch(() => context.value.params.id, (id, _previous, cleanup) => {
  const abort = new AbortController();
  cleanup(() => abort.abort());
  detail.value = null;
  detailError.value = null;
  if (!id) return;
  void fetch(`/api/items/${encodeURIComponent(id)}`, { signal: abort.signal })
    .then(response => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then(value => { if (!abort.signal.aborted) detail.value = value; })
    .catch(error => { if (!abort.signal.aborted) detailError.value = error as Error; });
}, { immediate: true });
```

The same watcher handles initial deep links and subsequent parameter changes. A retained page keeps its own last route while inactive; reactivation with unchanged parameters does not imply a new data request. Do not add an `onMounted` request for the same input. For catalog-dependent business requests, also observe the application loading condition and skip until ready; cancel obsolete requests and prevent stale results from publishing. A hidden retained tree stays mounted with its frozen route, so it does not consume another page's parameters. Pausing expensive background work remains a host/application decision.

## Guards and navigation receipts

Vue Router connections install native transition guards. A Data Router assembled by `createReactRouterPlus` supplies blocker integration when its native version exposes the blocker API. Data Router construction and blocker availability are separate native capabilities. A low-level React provider needs the native `useBlocker` hook explicitly when that router mode supports it. Declarative React routers without native interception run Plus-initiated guards; their native Link/back transitions cannot gain interception from an observation-only connection.

```ts
// Vue component setup: the application owns the dirty fact and confirmation UI.
import { ref } from 'vue';
import { usePageLeaveGuard, useRouterPlus } from '@jangts/router-plus/vue';
const dirty = ref(false);
usePageLeaveGuard({ id: 'unsaved-editor',
  beforeLeave: () => !dirty.value || window.confirm('Discard unsaved changes?') });
const plus = useRouterPlus();
async function closeEditor() {
  const receipt = await plus.navigate('/dashboard');
  if (!receipt.ok && receipt.reason !== 'noop') {
    // Use receipt.reason/committed for the application's feedback policy.
    return receipt;
  }
  return receipt;
}
```

A committed failure is different from a rejected navigation: `committed: true` means address-side effects have already occurred. Keep raw receipts when mapping to application status labels. Authentication, permitted destinations and save/discard semantics remain business policy.

## React: retained views without an application cache

This composition uses native Data Router APIs and requires React Router DOM >=6.4. Applications using 6.0–6.3 keep their declarative BrowserRouter/MemoryRouter routes and the low-level Provider connection; Data Router construction is not available there. The package's React Router >=6 peer requirement continues to cover those declarative integrations.

<!-- requires: react-router-data-router -->

```tsx
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import { createReactRouterPlus, RouterPlusOutlet, useRpState } from '@jangts/router-plus/react';
function List() {
  const [keyword, setKeyword] = useRpState('', { id: 'keyword', query: true, omitDefault: true });
  return <input value={keyword} onChange={event => setKeyword(event.target.value)} />;
}
function Detail() { return <p>Detail</p>; }
const router = createBrowserRouter([{ element: <RouterPlusOutlet />, children: [
  { path: '/items', element: <List /> }, { path: '/items/:id', element: <Detail /> },
] }]);
const plus = createReactRouterPlus({ router, globalKey: false, disposeOnUnmount: true,
  pages: [{ path: '/items', title: 'Items', retain: true },
    { path: '/items/:id', title: 'Detail', retain: { max: 3 } }] });
createRoot(document.getElementById('root')!).render(<plus.Provider />);
```

Plus owns visits, frozen location/context, eviction and release generations. The app owns the native routes, layout, scroll container and appearance. React Activity can be supplied through the documented `host` option on supporting React versions; the default host remains available on React 18. Explicit `plus.release()` rebuilds the instance. An application no longer needs a parallel visits map or release-generation counter for this composition.

## Responsibility checklist

| Common application wrapper | Shared replacement | Application responsibility |
| --- | --- | --- |
| Tab/query initial read, buildQuery, paired synchronization watchers and JSON echo locks | Native binding query/fields/history/omitDefault | Tab list, filter value shape and business validation |
| Catalog-loading write suppression, route restoration after loading | ready and the binding's codec/validator | Catalog request, ID/label mapping, fallback and failure UI |
| Repeated query merge/delete/hash preservation | usePageQuery functional updates or native bound values | Which business parameters to change and push/replace choice |
| Initial onMounted plus route watcher for the same request | One immediate watcher/effect with cleanup | Request, cancellation, error state and result mapping |
| Visited-page list, frozen context, cache generation and release subscriptions | RouterPlusOutlet / RouterPlusView plus retain policy | Page shell, scroll behavior and optional Activity presentation |
| StrictMode delayed owned-Core disposal wrapper | disposeOnUnmount for factory-owned React instances | App-level HMR replacement and native router disposal |
| App target splitting and safe shared URL resolution | resolveLink/navigate, page+params and origin | Known-page whitelist, permissions, application protocols and legacy history migration |

Use this checklist per consumer. Remove synchronization and cache ownership only where the selected library composition now owns the complete behavior; keep business watches, domain mappings and native routing policy explicit.

## Presentation and document links

React and Vue RouterPlusLink support `disabled` and `reloadDocument`. Disabled page/external links remove href and keyboard focus and prevent click navigation; action targets keep native button disabling. `reloadDocument` on a page href delegates navigation to the browser. Business authorization remains at the business boundary.

Vue retained views accept a host component with an active prop and default slot:

```ts
import { defineComponent, h } from 'vue';
import { RouterPlusView } from '@jangts/router-plus/vue';
const PageHost = defineComponent({
  props: { active: Boolean },
  setup(props, { slots }) {
    return () => h('section', { hidden: !props.active }, slots.default?.());
  },
});
const AppView = defineComponent({ render: () => h(RouterPlusView, { host: PageHost }) });
```

The host chooses presentation; Plus continues owning cache identity, frozen context and release. The default hidden-div host is sufficient for ordinary retained pages.
