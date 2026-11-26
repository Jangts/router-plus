# 原生状态与查询参数

状态由 React、Vue 或原生状态库持有。`useRp*` 保留原生参数与返回值，在最后追加可选 ID 或配置；不传该参数时不登记，也不需要 Provider。登记 ID 只提供外部访问，`query` 才启用地址同步。

## React：创建与登记

```tsx
import { useRpState } from '@jangts/router-plus/react';

function OrderDetail() {
  const [section, setSection] = useRpState('summary', {
    id: 'section', query: true, values: ['summary', 'details'],
  });
  return <button onClick={() => setSection('details')}>{section}</button>;
}
```

Tab 就是这个普通字符串状态。`section` 与页面目录中的地址状态同名；不需要 `tabs`、`defaultTab`、`tabInUrl` 或独立 Tab Hook。点击修改原生值，RP 同步地址；导航与前进后退恢复查询参数。没有 query 的 ID 不会自动进入历史或持久化。

已有状态使用 `useReactState`，不重复创建：

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

还可登记 ref、callback、`{ get, set? }` 访问器。`useRpRef`、`useRpContext`、`useRpCallback` 分别沿用原生 ref、context、callback；readonly context 拒绝外部写入。React 只发布已提交的闭包；ref／访问器在组件提交时通知，不轮询外部变化。

## Vue：创建与登记

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

对象可用 `useRpReactiveState` 创建，或用 `useVueState` 登记已有 reactive／readonly proxy、callback 和访问器。Options API 在 `setup()` 内调用。只读 computed 不允许写入，也不能绑定需要写回的 query；computed setter 不能接收完整读取值时需自行提供适配访问器。

## Query 的归属与编码

- 标量 `query: true` 使用来源 ID 作参数名；`query: 's'` 使用指定参数名。
- 普通对象根节点的 `query: true` 只展开一层；`fields` 选择或覆盖字段。未绑定的 draft 等字段仍归原生来源，恢复地址不会丢弃它们。
- 字段对象、数组等非标量默认按完整 JSON 编码；不递归展开。Date／Map／Set／自定义对象需要显式 codec。
- 字段 `encode(value)` 返回字符串或 undefined，`decode(raw)` 返回完整字段值。对象组自定义 encode/decode 使用 `query: ['q', 'p']` 显式声明全部参数归属；编码结果可用 URLSearchParams 或参数对象。
- 同一参数不能被多个来源占用。普通字段拒绝重复参数；组 codec 可自行处理重复参数。写入保留无关参数与 hash。

## 作用域与保留

组件来源归最近的页面实例；同作用域的活跃 ID 不能重复，注销会释放来源和动态 QS 规则。ID、query 归属、默认值与枚举等结构配置在一次登记期间固定；回调仍观察其依赖，React 使用最初已提供回调位置的最近提交实现。省略配置不登记，改 ID／重新登记才建立新的规则生命周期。

Vue setup store 的独立 effect scope 登记全局来源。共享来源归该 Router Plus 实例，不是进程单例；详见[状态库接入](stores)。

页面配置 `retain: true`／`{ max }`，并使用 React `RouterPlusOutlet` 或 Vue `RouterPlusView` 才能保留组件与 DOM。隐藏页面通过 `scope(context)` 仍访问自身来源。普通卸载会注销来源，RP 不额外复制组件状态来代替保留视图。


## 原生状态与地址绑定

已有值使用 useReactState/useVueState，创建值使用 useRp*。仅用 ID 登记时继承页面 states 的默认值、query、枚举与 codec，不重复维护两份规则；没有页面声明时使用原生初值作为回退。

- history 可选 push，默认 replace。同一轮原生变化合并一次提交，守卫拒绝后恢复已提交地址对应的状态。
- omitDefault 可省略等于默认值的参数，对象字段可覆盖；其他 query 和 hash 保留。
- ready 函数声明目录就绪条件，未就绪时保留地址、延迟依赖校验和回写。Vue 跟踪响应式校验依赖，React 使用提交后的最新回调；应用不写同步 watch。
- 等待期间用户新选择优先于旧地址，当前绑定的新地址可以取代该选择；显式命令返回 not-ready。whenReady 不替应用等待业务加载。
- usePageQuery 写入口返回真实导航回执，函数式修改读取最新地址，同轮变化按顺序合并；对象数组值保留重复参数。

```ts
const tab = useRpRef('overview', {
  id: 'tab', query: true, history: 'push',
  ready: () => loaded.value && !loadError.value,
  validate: value => allowedTabs.value.includes(String(value)),
});
```

此例位于 Vue 组件 setup；加载结果与合法缺省仍由应用提供。React 使用 useRpState，并在回调中读取正常渲染状态。绑定保留原生来源身份，不建立另一份 query 状态。

分组字段只配置校验、codec 或 omitDefault 时，仍继承父级 query；字段显式 omitDefault: false 可以保留其默认参数。保留的参数化页面各自使用本实例的 ready／校验／codec，等待时只修改本地字段不会覆盖待恢复 URL。非法原生选择恢复为已提交地址对应值。

usePageQuery 会捕获提交时的参数输入；守卫等待期间的后续函数式修改接续尚未提交的参数，外部已提交导航重置该基线。回调必须同步；抛错或返回 Promise 得到失败回执，地址保留。全局 query 来源在未登记页面路径上也能恢复与写入。

根对象、Date、Map、Set 的自定义 decoder 接收仅含归属参数的 URLSearchParams，即使使用单一参数名也是如此；字段 decoder 才接收字符串。例如 Date 的 decode 使用 params => new Date(params.get('day') ?? fallbackISOString)。

并发局部状态更新与 Store 字段写入在地址提交前合并；非 query Store 更新和全局地址恢复按来源串行执行。重置 Store 字段只恢复该字段的捕获默认值，保留其他字段。根实例与 scope.whenReady 都等待进行中的全局恢复；提交后的恢复失败保留 committed: true。React 更换登记 ID 时捕获当前原生值作为新登记的回退。
