---
title: "Store integration"
outline: [2, 3]
---

# Store integration

Creation wrappers and existing-source registration for Zustand, Redux Toolkit and Jotai. Native stores own live state; Vue setup stores use composables directly.

## Symbols on this page

| Symbol | Kind | Description |
| --- | --- | --- |
| [`createRpZustand`](#api-createrpzustand) | function | Bind a native Zustand creator and delegate to the shared registrar after creation. |
| [`registerZustandState`](#api-registerzustandstate) | function | Index an existing Zustand store; plain records merge while native root values replace, with idempotent cleanup. |
| [`RpZustandCreator`](#api-rpzustandcreator) | interface | Creator preserving generics, middleware and currying. |
| [`configureRpReduxStore`](#api-configurerpreduxstore) | function | Bind native configure and prepare a creation-time writer or use the business setter. |
| [`registerReduxState`](#api-registerreduxstate) | function | Index an existing Redux store, readonly unless a business set adapter is supplied; expose native ID/dispatch. |
| [`ReduxStateOptions`](#api-reduxstateoptions) | type alias | Registration rules with an optional complete-state business setter. |
| [`RpReduxCreator`](#api-rpreduxcreator) | type alias | Native configuration with optional registration rules. |
| [`createRpJotaiAtom`](#api-createrpjotaiatom) | function | Bind the native atom factory and explicit store while preserving atom identity. |
| [`registerJotaiState`](#api-registerjotaistate) | function | Index an atom in the supplied store; native commands and opt-in complete-value assignment remain distinct. |
| [`JotaiStateOptions`](#api-jotaistateoptions) | type alias | Registration rules with an optional complete-atom-value setter. |
| [`RpJotaiCreator`](#api-rpjotaicreator) | type alias | Creator preserving initial-value, derived and custom-write atom overloads. |

## createRpZustand {#api-createrpzustand}

Bind a native Zustand creator and delegate to the shared registrar after creation.

**Import:** `@jangts/router-plus/stores/zustand`。

### Definition

#### Call

```ts
createRpZustand<F extends Creator>(plus: RouterPlus, create: F): RpZustandCreator<F>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `create` | `F` | Required | — |

**Returns:** `RpZustandCreator<F>`

## registerZustandState {#api-registerzustandstate}

Index an existing Zustand store; plain records merge while native root values replace, with idempotent cleanup.

**Import:** `@jangts/router-plus/stores/zustand`。

### Definition

#### Call

```ts
registerZustandState<S>(plus: RouterPlus, store: Pick<StoreApi<S>, "getState" | "setState" | "subscribe">, idOrOptions: StateIdOrOptions<NoInfer<DataState<S>>>): () => void
```

Register an existing bound or vanilla store without replacing native methods.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `store` | `Pick<StoreApi<S>, "getState" \| "setState" \| "subscribe">` | Required | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<DataState<S>>>` | Required | — |

**Returns:** `() => void`

## RpZustandCreator {#api-rpzustandcreator}

Creator preserving generics, middleware and currying.

**Import:** `@jangts/router-plus/stores/zustand`。

### Definition

```ts
interface RpZustandCreator<F>
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `F` | `Creator` | — |

#### Overload 1

```ts
RpZustandCreator<T, M extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], M>, idOrOptions?: StateIdOrOptions<DataState<T>> | undefined): Result<F, T, M>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initializer` | `StateCreator<T, [], M>` | Required | — |
| `idOrOptions` | `StateIdOrOptions<DataState<T>> \| undefined` | Optional | — |

**Returns:** `Result<F, T, M>`

#### Overload 2

```ts
RpZustandCreator<T>(): <M extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], M>, idOrOptions?: StateIdOrOptions<DataState<T>> | undefined) => Result<F, T, M>
```

No call parameters.

**Returns:** `<M extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], M>, idOrOptions?: StateIdOrOptions<DataState<T>> \| undefined) => Result<F, T, M>`

## configureRpReduxStore {#api-configurerpreduxstore}

Bind native configure and prepare a creation-time writer or use the business setter.

**Import:** `@jangts/router-plus/stores/redux`。

### Definition

#### Call

```ts
configureRpReduxStore<F extends Creator>(plus: RouterPlus, configure: F): RpReduxCreator<F>
```

Only creation can prepare a reducer-backed complete-value write adapter.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `configure` | `F` | Required | — |

**Returns:** `RpReduxCreator<F>`

## registerReduxState {#api-registerreduxstate}

Index an existing Redux store, readonly unless a business set adapter is supplied; expose native ID/dispatch.

**Import:** `@jangts/router-plus/stores/redux`。

### Definition

#### Call

```ts
registerReduxState<S extends ReduxSource>(plus: RouterPlus, store: S, idOrOptions: ReduxStateOptions<NoInfer<ReturnType<S["getState"]>>>): () => void
```

Existing Redux stores are readonly unless a business setter is explicitly provided.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `store` | `S` | Required | — |
| `idOrOptions` | `ReduxStateOptions<NoInfer<ReturnType<S["getState"]>>>` | Required | — |

**Returns:** `() => void`

## ReduxStateOptions {#api-reduxstateoptions}

Registration rules with an optional complete-state business setter.

**Import:** `@jangts/router-plus/stores/redux`。

### Definition

```ts
type ReduxStateOptions<S> = StoreStateOptions<S>;
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | — |

## RpReduxCreator {#api-rpreduxcreator}

Native configuration with optional registration rules.

**Import:** `@jangts/router-plus/stores/redux`。

### Definition

```ts
type RpReduxCreator<F> = F & {
  <
    S = any,
    A extends Action = UnknownAction,
    M extends Tuple<ReadonlyArray<Middleware<{}, S>>> = Tuple<[ThunkMiddleware<S, UnknownAction>]>,
    E extends Tuple<ReadonlyArray<StoreEnhancer>> = Tuple<
      [StoreEnhancer<{ dispatch: DispatchExtensions<M> }>, StoreEnhancer]
    >,
    P = S,
  >(
    options: ConfigureStoreOptions<S, A, M, E, P>,
    idOrOptions: ReduxStateOptions<NoInfer<S>>,
  ): EnhancedStore<S, A, E>;
};
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `F` | `Creator` | — |

#### Overload 1

```ts
RpReduxCreator(...args: any[]): any
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | Rest parameter | — |

**Returns:** `any`

#### Overload 2

```ts
RpReduxCreator<S = any, A extends Action = UnknownAction, M extends Tuple<ReadonlyArray<Middleware<{}, S>>> = Tuple<[ThunkMiddleware<S, UnknownAction>]>, E extends Tuple<ReadonlyArray<StoreEnhancer>> = Tuple<[StoreEnhancer<{ dispatch: DispatchExtensions<M>; }>, StoreEnhancer]>, P = S>(options: ConfigureStoreOptions<S, A, M, E, P>, idOrOptions: ReduxStateOptions<NoInfer<S>>): EnhancedStore<S, A, E>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `options` | `ConfigureStoreOptions<S, A, M, E, P>` | Required | — |
| `idOrOptions` | `ReduxStateOptions<NoInfer<S>>` | Required | — |

**Returns:** `EnhancedStore<S, A, E>`

## createRpJotaiAtom {#api-createrpjotaiatom}

Bind the native atom factory and explicit store while preserving atom identity.

**Import:** `@jangts/router-plus/stores/jotai`。

### Definition

#### Call

```ts
createRpJotaiAtom(plus: RouterPlus, create: typeof atom, store: AtomStore): RpJotaiCreator
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `create` | `{ <Value, Args extends unknown[], Result>(read: Read<Value>, write: Write<Args, Result>): WritableAtom<Value, Args, Result>; <Value>(read: Read<Value>): Atom<Value>; <Value, Args extends unknown[], Result>(initialValue: Value, write: Write<Args, Result>): WritableAtom<Value, Args, Result> & WithInit…` | Required | — |
| `store` | `Store` | Required | — |

**Returns:** `RpJotaiCreator`

## registerJotaiState {#api-registerjotaistate}

Index an atom in the supplied store; native commands and opt-in complete-value assignment remain distinct.

**Import:** `@jangts/router-plus/stores/jotai`。

### Definition

#### Overload 1

```ts
registerJotaiState<V, A extends unknown[], R>(plus: RouterPlus, store: AtomStore, source: WritableAtom<V, A, R>, options: JotaiStateOptions<V>): () => void
```

Existing writable atoms expose native commands; complete-value assignment is opt-in.

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `store` | `Store` | Required | — |
| `source` | `WritableAtom<V, A, R>` | Required | — |
| `options` | `JotaiStateOptions<V>` | Required | — |

**Returns:** `() => void`

#### Overload 2

```ts
registerJotaiState<V>(plus: RouterPlus, store: AtomStore, source: Atom<V>, options: ReadonlyOptions<V>): () => void
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | Required | — |
| `store` | `Store` | Required | — |
| `source` | `Atom<V>` | Required | — |
| `options` | `ReadonlyOptions<V>` | Required | — |

**Returns:** `() => void`

## JotaiStateOptions {#api-jotaistateoptions}

Registration rules with an optional complete-atom-value setter.

**Import:** `@jangts/router-plus/stores/jotai`。

### Definition

```ts
type JotaiStateOptions<S> = StoreStateOptions<S>;
```

#### Type parameters

| Type parameter | Constraint | Default |
| --- | --- | --- |
| `S` | — | — |

## RpJotaiCreator {#api-rpjotaicreator}

Creator preserving initial-value, derived and custom-write atom overloads.

**Import:** `@jangts/router-plus/stores/jotai`。

### Definition

```ts
type RpJotaiCreator = typeof atom & {
  <T, A extends unknown[], R>(
    read: (get: Getter) => T,
    write: (get: Getter, set: Setter, ...args: A) => R,
    idOrOptions: JotaiStateOptions<T>,
  ): WritableAtom<T, A, R>;
  <T, A extends unknown[], R>(
    initial: T,
    write: (get: Getter, set: Setter, ...args: A) => R,
    idOrOptions: JotaiStateOptions<T>,
  ): WritableAtom<T, A, R>;
  <T>(read: (get: Getter) => T, idOrOptions: ReadonlyOptions<T>): Atom<T>;
  <T>(
    initial: T extends (...args: never[]) => unknown ? never : T,
    idOrOptions: JotaiStateOptions<T>,
  ): PrimitiveAtom<T>;
};
```

#### Overload 1

```ts
RpJotaiCreator<Value, Args extends unknown[], Result>(read: Read<Value>, write: Write<Args, Result>): WritableAtom<Value, Args, Result>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `read` | `Read<Value>` | Required | — |
| `write` | `Write<Args, Result>` | Required | — |

**Returns:** `WritableAtom<Value, Args, Result>`

#### Overload 2

```ts
RpJotaiCreator<Value>(read: Read<Value>): Atom<Value>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `read` | `Read<Value>` | Required | — |

**Returns:** `Atom<Value>`

#### Overload 3

```ts
RpJotaiCreator<Value, Args extends unknown[], Result>(initialValue: Value, write: Write<Args, Result>): WritableAtom<Value, Args, Result> & WithInitialValue<Value>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initialValue` | `Value` | Required | — |
| `write` | `Write<Args, Result>` | Required | — |

**Returns:** `WritableAtom<Value, Args, Result> & WithInitialValue<Value>`

#### Overload 4

```ts
RpJotaiCreator<Value>(): PrimitiveAtom<Value | undefined> & WithInitialValue<Value | undefined>
```

No call parameters.

**Returns:** `PrimitiveAtom<Value \| undefined> & WithInitialValue<Value \| undefined>`

#### Overload 5

```ts
RpJotaiCreator<Value>(initialValue: Value): PrimitiveAtom<Value> & WithInitialValue<Value>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initialValue` | `Value` | Required | — |

**Returns:** `PrimitiveAtom<Value> & WithInitialValue<Value>`

#### Overload 6

```ts
RpJotaiCreator<T, A extends unknown[], R>(read: (get: Getter) => T, write: (get: Getter, set: Setter, ...args: A) => R, idOrOptions: JotaiStateOptions<T>): WritableAtom<T, A, R>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `read` | `(get: Getter) => T` | Required | — |
| `write` | `(get: Getter, set: Setter, ...args: A) => R` | Required | — |
| `idOrOptions` | `JotaiStateOptions<T>` | Required | — |

**Returns:** `WritableAtom<T, A, R>`

#### Overload 7

```ts
RpJotaiCreator<T, A extends unknown[], R>(initial: T, write: (get: Getter, set: Setter, ...args: A) => R, idOrOptions: JotaiStateOptions<T>): WritableAtom<T, A, R>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `T` | Required | — |
| `write` | `(get: Getter, set: Setter, ...args: A) => R` | Required | — |
| `idOrOptions` | `JotaiStateOptions<T>` | Required | — |

**Returns:** `WritableAtom<T, A, R>`

#### Overload 8

```ts
RpJotaiCreator<T>(read: (get: Getter) => T, idOrOptions: ReadonlyOptions<T>): Atom<T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `read` | `(get: Getter) => T` | Required | — |
| `idOrOptions` | `ReadonlyOptions<T>` | Required | — |

**Returns:** `Atom<T>`

#### Overload 9

```ts
RpJotaiCreator<T>(initial: T extends (...args: never[]) => unknown ? never : T, idOrOptions: JotaiStateOptions<T>): PrimitiveAtom<T>
```

| Field | Type | Passing | Description |
| --- | --- | --- | --- |
| `initial` | `T extends (...args: never[]) => unknown ? never : T` | Required | — |
| `idOrOptions` | `JotaiStateOptions<T>` | Required | — |

**Returns:** `PrimitiveAtom<T>`

## Examples

```ts
import { createStore } from 'zustand/vanilla';
import { createRouterPlus } from '@jangts/router-plus';
import { createRpZustand } from '@jangts/router-plus/stores/zustand';

const plus = createRouterPlus({ pages: [], globalKey: false });
const create = createRpZustand(plus, createStore);
const counter = create<{ count: number; increment(): void }>()((set) => ({ count: 0, increment: () => set(s => ({ count: s.count + 1 })) }), 'counter');
await plus.setState(2, 'counter/count');
await plus.callState('counter/increment');
await plus.dispose();
```

### Existing stores

```ts
import { configureStore } from '@reduxjs/toolkit';
import { registerReduxState } from '@jangts/router-plus/stores/redux';
import { atom, createStore as createAtomStore } from 'jotai/vanilla';
import { registerJotaiState } from '@jangts/router-plus/stores/jotai';
const redux = configureStore({ reducer: (state = 0, action) =>
  action.type === 'restore' ? Number(action.payload) : state });
const stopRedux = registerReduxState(plus, redux, {
  id: 'redux', set: next => { redux.dispatch({ type: 'restore', payload: next }); },
});
const store = createAtomStore();
const count = atom(0);
const stopAtom = registerJotaiState(plus, store, count, {
  id: 'atom', set: next => { store.set(count, next); },
});
stopAtom();
stopRedux();
```

Existing Zustand uses `registerZustandState(plus, store, options)`. All three register functions return an idempotent stop, with RP disposal as fallback. Existing Redux defaults to readonly plus ID/dispatch; existing writable Jotai atoms expose callState commands. Complete-value assignment and query restoration require explicit set(next) adapters. Creators prepare default writers only for known construction branches.
