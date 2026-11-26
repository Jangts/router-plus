# Store integration

## Create native stores

```ts
import { createRouterPlus } from '@jangts/router-plus';
import { createStore } from 'zustand/vanilla';
import { createRpZustand } from '@jangts/router-plus/stores/zustand';
const plus = createRouterPlus({ pages: [], globalKey: false });
const create = createRpZustand(plus, createStore);
const counter = create<{ count: number; increment(): void }>()(set => ({ count: 0, increment: () => set(s => ({ count: s.count + 1 })) }), 'counter');
await plus.setState(2, 'counter/count');
await plus.callState('counter/increment');
```

`configureRpReduxStore(plus, configureStore)` retains native reducers/dispatch; indexed writes dispatch an ordinary action handled by the wrapped reducer. `createRpJotaiAtom(plus, atom, store)` preserves atom identity; readonly derived atoms reject writes. Vue setup stores use the composables directly. Store bindings end with their Router Plus instance or Vue store effect scope.

## Existing stores

```ts
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
const stop = registerZustandState(plus, counter, 'existingCounter');
await plus.callState('existingCounter/increment');
stop();
```

`registerReduxState(plus, store, options)` defaults to readonly plus `ID/dispatch`; assignment or query restoration requires a business `set(next)` dispatching an existing action. Registration never replaces reducers. `registerJotaiState(plus, store, atom, options)` forwards writable atoms' native arguments through callState; complete-value assignment likewise needs an explicit set adapter. The Jotai creator supplies automatic assignment only for default primitive construction, excluding custom writes. Each register returns an idempotent group stop, rolls back failures and cleans up on RP disposal. Native source identity and lifecycle are preserved.


Vue setup stores use the same composables inside an independent effect scope to register router-global sources. Scope disposal unregisters them. Create separate Router Plus instances and stores for each SSR request.

Plain Zustand record roots use merge writes and retain actions. Root Map, Set, Date, array and primitive values retain native identity and use complete replacement writes. Other class-instance roots are rejected before registration.
