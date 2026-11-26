# 状态库接入

## 创建原生 Store

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

`configureRpReduxStore(plus, configureStore)` 保留原生 reducer 和 dispatch，外部状态写入通过包装的 reducer 分发普通 action。`createRpJotaiAtom(plus, atom, store)` 保留原生 atom 身份，派生只读 atom 拒绝写入。Vue setup store 直接调用 composables，不另建 Pinia/Vuex 适配器。store 绑定随所属 Router Plus 实例或 Vue store 作用域结束清理。

## 已有 Store

```ts
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
const stop = registerZustandState(plus, counter, 'existingCounter');
await plus.callState('existingCounter/increment');
stop();
```

`registerReduxState(plus, store, options)` 默认只读并提供 `ID/dispatch`，赋值或 QS 需要业务 `set(next)` 分发已有 action；登记不替换 reducer。`registerJotaiState(plus, store, atom, options)` 让 writable atom 以 callState 转发原生参数，完整值赋值同样需显式 set 适配。Jotai 创建器仅对默认 primitive 初值构造自动提供赋值，自定义 write 不在此列。三个 register 返回幂等聚合 stop，失败整组回滚，RP dispose 兜底清理。原生来源保持原有身份和生命周期。


Vue setup store 使用与组件相同的 composables，在独立 effect scope 中登记为 Router Plus 全局来源；作用域停止时自动注销。每个 SSR 请求使用独立 Router Plus 和 Store。

Zustand 的普通对象根状态采用 merge 写入并保留动作；根 Map、Set、Date、数组和基础值保留原生身份，采用完整替换。其他类实例根状态会在登记前拒绝。
