# State access and command sequences

Components or stores register source IDs before external callers read, write or invoke them. Here `plus` is an already connected Router Plus instance.

## Read, write and call

```ts
const section = plus.getState<string>('section');
await plus.setState('details', 'section');
await plus.patchState({ name: 'Summer' }, 'customerForm');
const submitted = await plus.callState('submitCustomer');
if (!submitted.ok) console.error(submitted.reason);
```

`setState(value, id)` assigns a complete value; `patchState(value, id)` merges an object; `resetState(id)` uses the registered initial value. Readonly sources return state-readonly; receipts distinguish unknown sources, missing capabilities and business failures. Business validation and authorization remain application-owned.

React exposes callbacks through `useRpCallback` / `useReactState(callback, id)`; Vue uses `useVueState(callback, id)`. `callState` forwards native arguments and awaits the result. Bind receiver-dependent methods or use forwarding closures. Getter-only accessors expose values without automatically adding call capability.

## Inspect installed capabilities

```ts
const source = plus.inspectState('section');
if (source?.capabilities.write) await plus.setState('details', source.id);
const installed = plus.inspectState();
```

Inspection reads registration metadata without live values or getter/codec execution. It lists global/current-page sources visible to the facade. Unknown IDs, unmounted declarations and arbitrary field paths return null. Use `scope(context)` for a retained instance. Capabilities are not authorization; the console facade does not expose inspectState.

## Await mounting and execute in order

```ts
const result = await plus.execute([
  { kind: 'navigate', target: '/customers/42' },
  { kind: 'state.set', key: 'editPanel', value: true },
  { kind: 'state.patch', key: 'customerForm', value: { name: 'Summer' } },
  { kind: 'state.call', id: 'submitCustomer' },
], { timeoutMs: 10000 });

if (!result.ok) console.error(result.failedIndex, result.reason, result.results);
```

The application registers editPanel, conditionally mounted customerForm and submitCustomer. RP has no built-in panel/form model. A sequence awaits each required source's registration, restoration and framework publication. The default total timeout is 10000ms; pass timeoutMs and AbortSignal as needed.

Failure, timeout, cancellation, instance departure or active source replacement stops later steps while retaining completed results and failedIndex. Business operations are not retried, rolled back or replayed. Cancellation cannot revoke already-issued business effects.

`ready` waits for initial installation. `whenReady()` waits for already registered sources and hosts, not future components or business loading. For catalog-dependent address bindings, use the binding ready predicate; RP observes framework changes and restores the latest address automatically. Business loading still belongs to the App.

## Source events

```ts
const stop = plus.subscribe(event => {
  if (event.type === 'state.registered') console.log(event.source.id);
  if (event.type === 'disposed') console.log('Router disposed');
});
// End observation when its owner ends:
stop();
```

`state.registered`, `state.unregistered` and `state.committed` describe source lifecycle. Complete groups publish only after successful registration. `state.committed` describes adapter publication, not completion of all asynchronous application work.
