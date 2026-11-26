---
title: "状态库接入"
outline: [2, 3]
---

# 状态库接入

Zustand、Redux Toolkit 和 Jotai 的创建包装与已有来源登记；原生状态库持有实时状态，Vue setup store 直接使用 composables。

## 本页符号

| 符号 | 类别 | 说明 |
| --- | --- | --- |
| [`createRpZustand`](#api-createrpzustand) | 函数 | 绑定原生 Zustand creator；创建后委托同一登记入口。 |
| [`registerZustandState`](#api-registerzustandstate) | 函数 | 登记已有 Zustand store；普通对象 merge 保留动作，原生集合等根值完整替换，返回整组幂等注销函数。 |
| [`RpZustandCreator`](#api-rpzustandcreator) | 接口 | 保留泛型、middleware 与 currying 的创建器类型。 |
| [`configureRpReduxStore`](#api-configurerpreduxstore) | 函数 | 绑定 Redux Toolkit configure；在创建阶段准备完整值写入或采用业务 setter。 |
| [`registerReduxState`](#api-registerreduxstate) | 函数 | 登记已有 Redux store；默认只读，显式 set 适配业务写入，ID/dispatch 保留原生命令。 |
| [`ReduxStateOptions`](#api-reduxstateoptions) | 类型别名 | 通用登记规则及可选的完整 state 业务 set 适配。 |
| [`RpReduxCreator`](#api-rpreduxcreator) | 类型别名 | 原生配置参数及可选登记规则。 |
| [`createRpJotaiAtom`](#api-createrpjotaiatom) | 函数 | 绑定原生 atom 与指定 store，保留 atom 身份。 |
| [`registerJotaiState`](#api-registerjotaistate) | 函数 | 登记指定 store 的已有 atom；命令与显式 set 完整值赋值分开，返回整组注销函数。 |
| [`JotaiStateOptions`](#api-jotaistateoptions) | 类型别名 | 通用登记规则及可选的完整 atom 值 set 适配。 |
| [`RpJotaiCreator`](#api-rpjotaicreator) | 类型别名 | 保留 atom 初值、派生与自定义 write 重载的创建器。 |

## createRpZustand {#api-createrpzustand}

绑定原生 Zustand creator；创建后委托同一登记入口。

**导入：** `@jangts/router-plus/stores/zustand`。

### 定义

#### 调用

```ts
createRpZustand<F extends Creator>(plus: RouterPlus, create: F): RpZustandCreator<F>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `create` | `F` | 必需 | — |

**返回：** `RpZustandCreator<F>`

## registerZustandState {#api-registerzustandstate}

登记已有 Zustand store；普通对象 merge 保留动作，原生集合等根值完整替换，返回整组幂等注销函数。

**导入：** `@jangts/router-plus/stores/zustand`。

### 定义

#### 调用

```ts
registerZustandState<S>(plus: RouterPlus, store: Pick<StoreApi<S>, "getState" | "setState" | "subscribe">, idOrOptions: StateIdOrOptions<NoInfer<DataState<S>>>): () => void
```

Register an existing bound or vanilla store without replacing native methods.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `store` | `Pick<StoreApi<S>, "getState" \| "setState" \| "subscribe">` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<NoInfer<DataState<S>>>` | 必需 | — |

**返回：** `() => void`

## RpZustandCreator {#api-rpzustandcreator}

保留泛型、middleware 与 currying 的创建器类型。

**导入：** `@jangts/router-plus/stores/zustand`。

### 定义

```ts
interface RpZustandCreator<F>
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `F` | `Creator` | — |

#### 重载 1

```ts
RpZustandCreator<T, M extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], M>, idOrOptions?: StateIdOrOptions<DataState<T>> | undefined): Result<F, T, M>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initializer` | `StateCreator<T, [], M>` | 必需 | — |
| `idOrOptions` | `StateIdOrOptions<DataState<T>> \| undefined` | 可省略 | — |

**返回：** `Result<F, T, M>`

#### 重载 2

```ts
RpZustandCreator<T>(): <M extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], M>, idOrOptions?: StateIdOrOptions<DataState<T>> | undefined) => Result<F, T, M>
```

无调用参数。

**返回：** `<M extends [StoreMutatorIdentifier, unknown][] = []>(initializer: StateCreator<T, [], M>, idOrOptions?: StateIdOrOptions<DataState<T>> \| undefined) => Result<F, T, M>`

## configureRpReduxStore {#api-configurerpreduxstore}

绑定 Redux Toolkit configure；在创建阶段准备完整值写入或采用业务 setter。

**导入：** `@jangts/router-plus/stores/redux`。

### 定义

#### 调用

```ts
configureRpReduxStore<F extends Creator>(plus: RouterPlus, configure: F): RpReduxCreator<F>
```

Only creation can prepare a reducer-backed complete-value write adapter.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `configure` | `F` | 必需 | — |

**返回：** `RpReduxCreator<F>`

## registerReduxState {#api-registerreduxstate}

登记已有 Redux store；默认只读，显式 set 适配业务写入，ID/dispatch 保留原生命令。

**导入：** `@jangts/router-plus/stores/redux`。

### 定义

#### 调用

```ts
registerReduxState<S extends ReduxSource>(plus: RouterPlus, store: S, idOrOptions: ReduxStateOptions<NoInfer<ReturnType<S["getState"]>>>): () => void
```

Existing Redux stores are readonly unless a business setter is explicitly provided.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `store` | `S` | 必需 | — |
| `idOrOptions` | `ReduxStateOptions<NoInfer<ReturnType<S["getState"]>>>` | 必需 | — |

**返回：** `() => void`

## ReduxStateOptions {#api-reduxstateoptions}

通用登记规则及可选的完整 state 业务 set 适配。

**导入：** `@jangts/router-plus/stores/redux`。

### 定义

```ts
type ReduxStateOptions<S> = StoreStateOptions<S>;
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | — |

## RpReduxCreator {#api-rpreduxcreator}

原生配置参数及可选登记规则。

**导入：** `@jangts/router-plus/stores/redux`。

### 定义

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

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `F` | `Creator` | — |

#### 重载 1

```ts
RpReduxCreator(...args: any[]): any
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `args` | `any[]` | 剩余参数 | — |

**返回：** `any`

#### 重载 2

```ts
RpReduxCreator<S = any, A extends Action = UnknownAction, M extends Tuple<ReadonlyArray<Middleware<{}, S>>> = Tuple<[ThunkMiddleware<S, UnknownAction>]>, E extends Tuple<ReadonlyArray<StoreEnhancer>> = Tuple<[StoreEnhancer<{ dispatch: DispatchExtensions<M>; }>, StoreEnhancer]>, P = S>(options: ConfigureStoreOptions<S, A, M, E, P>, idOrOptions: ReduxStateOptions<NoInfer<S>>): EnhancedStore<S, A, E>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `options` | `ConfigureStoreOptions<S, A, M, E, P>` | 必需 | — |
| `idOrOptions` | `ReduxStateOptions<NoInfer<S>>` | 必需 | — |

**返回：** `EnhancedStore<S, A, E>`

## createRpJotaiAtom {#api-createrpjotaiatom}

绑定原生 atom 与指定 store，保留 atom 身份。

**导入：** `@jangts/router-plus/stores/jotai`。

### 定义

#### 调用

```ts
createRpJotaiAtom(plus: RouterPlus, create: typeof atom, store: AtomStore): RpJotaiCreator
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `create` | `{ <Value, Args extends unknown[], Result>(read: Read<Value>, write: Write<Args, Result>): WritableAtom<Value, Args, Result>; <Value>(read: Read<Value>): Atom<Value>; <Value, Args extends unknown[], Result>(initialValue: Value, write: Write<Args, Result>): WritableAtom<Value, Args, Result> & WithInit…` | 必需 | — |
| `store` | `Store` | 必需 | — |

**返回：** `RpJotaiCreator`

## registerJotaiState {#api-registerjotaistate}

登记指定 store 的已有 atom；命令与显式 set 完整值赋值分开，返回整组注销函数。

**导入：** `@jangts/router-plus/stores/jotai`。

### 定义

#### 重载 1

```ts
registerJotaiState<V, A extends unknown[], R>(plus: RouterPlus, store: AtomStore, source: WritableAtom<V, A, R>, options: JotaiStateOptions<V>): () => void
```

Existing writable atoms expose native commands; complete-value assignment is opt-in.

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `store` | `Store` | 必需 | — |
| `source` | `WritableAtom<V, A, R>` | 必需 | — |
| `options` | `JotaiStateOptions<V>` | 必需 | — |

**返回：** `() => void`

#### 重载 2

```ts
registerJotaiState<V>(plus: RouterPlus, store: AtomStore, source: Atom<V>, options: ReadonlyOptions<V>): () => void
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `plus` | `RouterPlus` | 必需 | — |
| `store` | `Store` | 必需 | — |
| `source` | `Atom<V>` | 必需 | — |
| `options` | `ReadonlyOptions<V>` | 必需 | — |

**返回：** `() => void`

## JotaiStateOptions {#api-jotaistateoptions}

通用登记规则及可选的完整 atom 值 set 适配。

**导入：** `@jangts/router-plus/stores/jotai`。

### 定义

```ts
type JotaiStateOptions<S> = StoreStateOptions<S>;
```

#### 类型参数

| 类型参数 | 约束 | 默认类型 |
| --- | --- | --- |
| `S` | — | — |

## RpJotaiCreator {#api-rpjotaicreator}

保留 atom 初值、派生与自定义 write 重载的创建器。

**导入：** `@jangts/router-plus/stores/jotai`。

### 定义

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

#### 重载 1

```ts
RpJotaiCreator<Value, Args extends unknown[], Result>(read: Read<Value>, write: Write<Args, Result>): WritableAtom<Value, Args, Result>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `read` | `Read<Value>` | 必需 | — |
| `write` | `Write<Args, Result>` | 必需 | — |

**返回：** `WritableAtom<Value, Args, Result>`

#### 重载 2

```ts
RpJotaiCreator<Value>(read: Read<Value>): Atom<Value>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `read` | `Read<Value>` | 必需 | — |

**返回：** `Atom<Value>`

#### 重载 3

```ts
RpJotaiCreator<Value, Args extends unknown[], Result>(initialValue: Value, write: Write<Args, Result>): WritableAtom<Value, Args, Result> & WithInitialValue<Value>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initialValue` | `Value` | 必需 | — |
| `write` | `Write<Args, Result>` | 必需 | — |

**返回：** `WritableAtom<Value, Args, Result> & WithInitialValue<Value>`

#### 重载 4

```ts
RpJotaiCreator<Value>(): PrimitiveAtom<Value | undefined> & WithInitialValue<Value | undefined>
```

无调用参数。

**返回：** `PrimitiveAtom<Value \| undefined> & WithInitialValue<Value \| undefined>`

#### 重载 5

```ts
RpJotaiCreator<Value>(initialValue: Value): PrimitiveAtom<Value> & WithInitialValue<Value>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initialValue` | `Value` | 必需 | — |

**返回：** `PrimitiveAtom<Value> & WithInitialValue<Value>`

#### 重载 6

```ts
RpJotaiCreator<T, A extends unknown[], R>(read: (get: Getter) => T, write: (get: Getter, set: Setter, ...args: A) => R, idOrOptions: JotaiStateOptions<T>): WritableAtom<T, A, R>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `read` | `(get: Getter) => T` | 必需 | — |
| `write` | `(get: Getter, set: Setter, ...args: A) => R` | 必需 | — |
| `idOrOptions` | `JotaiStateOptions<T>` | 必需 | — |

**返回：** `WritableAtom<T, A, R>`

#### 重载 7

```ts
RpJotaiCreator<T, A extends unknown[], R>(initial: T, write: (get: Getter, set: Setter, ...args: A) => R, idOrOptions: JotaiStateOptions<T>): WritableAtom<T, A, R>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `T` | 必需 | — |
| `write` | `(get: Getter, set: Setter, ...args: A) => R` | 必需 | — |
| `idOrOptions` | `JotaiStateOptions<T>` | 必需 | — |

**返回：** `WritableAtom<T, A, R>`

#### 重载 8

```ts
RpJotaiCreator<T>(read: (get: Getter) => T, idOrOptions: ReadonlyOptions<T>): Atom<T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `read` | `(get: Getter) => T` | 必需 | — |
| `idOrOptions` | `ReadonlyOptions<T>` | 必需 | — |

**返回：** `Atom<T>`

#### 重载 9

```ts
RpJotaiCreator<T>(initial: T extends (...args: never[]) => unknown ? never : T, idOrOptions: JotaiStateOptions<T>): PrimitiveAtom<T>
```

| 字段 | 类型 | 传递 | 说明 |
| --- | --- | --- | --- |
| `initial` | `T extends (...args: never[]) => unknown ? never : T` | 必需 | — |
| `idOrOptions` | `JotaiStateOptions<T>` | 必需 | — |

**返回：** `PrimitiveAtom<T>`

## 使用示例

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

### 已有 Store

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

已有 Zustand 使用 `registerZustandState(plus, store, options)`。三个 register 均返回幂等 stop，RP dispose 兜底。已有 Redux 默认只读并提供 ID/dispatch；已有 Jotai writable atom 默认只有 callState 命令能力。两者完整值赋值／QS 均需显式 set(next)。创建器仅在明确的构造分支准备默认 writer。
