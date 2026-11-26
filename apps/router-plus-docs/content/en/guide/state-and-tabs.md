# Native state and query parameters

React, Vue or a native store owns live state. `useRp*` keeps native arguments and return values, adding only an optional final ID/options argument. Omit it to skip registration and provider requirements. An ID exposes external access; `query` enables address synchronization.

## React: create and register

```tsx
import { useRpState } from '@jangts/router-plus/react';

function OrderDetail() {
  const [section, setSection] = useRpState('summary', {
    id: 'section', query: true, values: ['summary', 'details'],
  });
  return <button onClick={() => setSection('details')}>{section}</button>;
}
```

A tab is this ordinary string state. `section` matches the catalog's address state ID; no `tabs`, `defaultTab`, `tabInUrl` or dedicated tab hook is needed. Native updates synchronize the address, and navigation/traversal restores query values. An ID without query binding does not automatically enter history or persistence.

Register existing state with `useReactState` without recreating it:

```tsx
import { useState } from 'react';
import { useReactState } from '@jangts/router-plus/react';

function Filters() {
  const state = useState({ category: 'all', draft: '' });
  useReactState(state, { id: 'filter', fields: { category: { query: true } } });
  return <input value={state[0].draft}
    onChange={event => state[1](value => ({ ...value, draft: event.target.value }))} />;
}
```

Refs, callbacks and `{ get, set? }` accessors can also be registered. `useRpRef`, `useRpContext` and `useRpCallback` retain native ref/context/callback behavior; readonly context rejects writes. React publishes only committed closures. Ref/accessor notifications follow component commits without polling external changes.

## Vue: create and register

```ts
import { ref } from 'vue';
import { useRpRef, useRpComputedState, useVueState } from '@jangts/router-plus/vue';

// Inside setup() or an effect scope:
const section = useRpRef('summary', {
  id: 'section', query: true, values: ['summary', 'details'],
});
const count = ref(0);
useVueState(count, 'count');
const doubled = useRpComputedState(() => count.value * 2, 'doubled');
section.value = 'details';
```

Use `useRpReactiveState` to create containers, or `useVueState` to register existing reactive/readonly proxies, callbacks and accessors. Options API calls them inside `setup()`. Readonly computed values reject writes and query bindings that require restoration. Adapt computed setters that cannot accept the complete read value through an explicit accessor.

## Query ownership and codecs

- Scalar `query: true` uses the source ID as the parameter name; `query: 's'` chooses a name.
- A plain-object root with `query: true` expands one level. `fields` selects or overrides fields. Unbound fields such as drafts remain native and survive address restoration.
- Non-scalar field values, including objects/arrays, default to complete JSON values without recursive expansion. Date/Map/Set/custom instances require explicit codecs.
- Field `encode(value)` returns a string or undefined; `decode(raw)` returns a complete field value. Object-group custom encode/decode declares all owned parameters using `query: ['q', 'p']`; encoders return URLSearchParams or parameter records.
- Multiple sources cannot own the same parameter. Ordinary fields reject duplicates; group codecs can interpret repeated parameters. Writes preserve unrelated parameters and the hash.

## Scopes and retained views

Component sources belong to the nearest page instance. Live IDs cannot repeat within that scope. Unregistration releases the source and dynamic query rules. Structural metadata (ID, query ownership, defaults and value lists) is fixed for a registration lifetime. Callback dependencies remain live; React uses the latest committed implementations of initially supplied callbacks. Changing an ID or re-registering starts another lifetime.

Vue setup stores register globally through an independent effect scope. Shared sources belong to one Router Plus instance, not a process singleton; see [Store integration](stores).

Configure page `retain: true` / `{ max }` and use React `RouterPlusOutlet` or Vue `RouterPlusView` to retain components and DOM. Hidden instances still access their own sources through `scope(context)`. Ordinary unmount unregisters sources; RP does not keep a second copy of component state as a replacement for retained views.


## Native address bindings

Bind existing values with useReactState/useVueState, or create native values with useRp*. An ID-only binding inherits PageDefinition.states rules, avoiding duplicate defaults/query/enums/codecs. Without a static declaration, the native initializer supplies the fallback.

- `history: 'push'` creates traversable entries; the default is replace. Same-turn native changes merge into one commit; a rejected proposal restores the committed address.
- `omitDefault: true` omits parameters equal to their defaults, with per-field overrides. Unrelated parameters and hash remain intact.
- `ready: () => loaded && !loadError` defers dependent restoration and address writes. Declare business validation normally; Vue tracks reactive validation dependencies and React reads callbacks from committed renders. No App synchronization watch is needed.
- A pending user choice wins over the old address; a newer address for that binding supersedes it. Explicit commands return not-ready during loading. whenReady does not wait for business loading.
- usePageQuery setters return navigation receipts; functional edits read the latest address and same-turn edits merge in call order. Array-valued object inputs preserve repeated parameters.

```ts
const tab = useRpRef('overview', {
  id: 'tab', query: true, history: 'push',
  ready: () => loaded.value && !loadError.value,
  validate: value => allowedTabs.value.includes(String(value)),
});
```

This is Vue component setup; the App owns the loading results and a valid fallback. React uses useRpState with callbacks reading its normal render state. The library maintains the source identity; it does not install a parallel query store.

Field-only validation, codec or omitDefault rules inherit the parent query binding. An explicit field omitDefault: false retains its default parameter. Retained parameterized instances use their own readiness/validation/codec callbacks; local-only edits while pending preserve the address intent. Invalid native selections recover the committed address value.

usePageQuery captures submitted inputs. Functional edits continue an uncommitted proposal while a guard waits; external committed navigation resets the baseline. Updaters must be synchronous: throwing or returning a Promise yields a failed receipt without clearing the URL. Global query sources restore and write even outside the page catalog.

Custom decoders on root object, Date, Map and Set sources receive owned URLSearchParams, even for one named parameter; field decoders receive strings. For a Date, use params => new Date(params.get('day') ?? fallbackISOString).

Concurrent partial state updates and Store field writes compose before address commit. Non-query Store updates and global address restoration share a per-source serial queue. Resetting a Store field restores its captured default without resetting sibling fields. Root and scoped whenReady both wait for active global restoration; a post-commit restore failure reports committed: true. A new React registration ID captures the current native value as its own fallback.
