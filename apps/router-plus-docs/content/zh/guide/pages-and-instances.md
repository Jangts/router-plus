# 页面与实例

页面目录声明路径、身份、可导航状态及保留策略，组件和布局通过原生路由或生成器接入。

## 页面与地址状态

```ts
import type { PageDefinition } from '@jangts/router-plus';

const pages: PageDefinition[] = [
  { id: 'orders', path: '/orders', title: 'Orders' },
  {
    id: 'order',
    path: '/orders/:id',
    title: 'Order',
    params: { id: value => /^\d+$/.test(value) || 'Invalid order ID' },
    states: {
      section: { default: 'summary', values: ['summary', 'details'], query: true },
    },
    retain: { max: 8 },
  },
];
```

`id` 省略时等于路径模板。`states.section` 是地址合同，不创建组件状态；页面通过原生状态 Hook 用同名 ID 登记实际来源。这样导航目标可以在页面尚未挂载时指定 `values: { section: 'details' }`。查询参数更新保留无关参数与 hash。

`pathAliases` 登记同一页面的其他路径。重复 ID、不合法的默认状态、查询参数归属冲突、父级缺失或循环、非正整数保留上限会被拒绝。

## 实例身份与保留

- 页面 ID 标识定义，例如 `order`。
- `instanceKey` 默认按 pathname 区分，因此 `/orders/1` 与 `/orders/2` 是不同实例；也可使用 `'page'`、`{ params: ['id'] }` 或函数。
- `instance.stateKey` 是页面 ID 与实例 key 合成的作用域身份；登记来源的 `section` 等 ID 位于该作用域内，二者不同。
- 历史条目的身份由原生 Router 提供，用于辨认提交与遍历；QS 状态由地址恢复。

`retain: true` 不限制保留数量；`{ max: 8 }` 是该页面的总保留上限，包含进入的活动实例，按 LRU 释放非活动实例。还需 React `RouterPlusOutlet` 或 Vue `RouterPlusView` 保持渲染宿主；仅声明 retain 不会自动缓存 DOM。

## 读取与定位

React 在组件中使用 `usePageContext()`／`usePageMatch()`；Vue 在 setup 中使用，返回只读 ref／计算值。Core 提供 `getContext()`、`getInstance()` 和 `match(pathname)`。

读取 `context.params`、`context.values`、`context.instance` 与 `context.query`；`query` 取每个参数的首值，重复参数保存在 `queryAll`。原生实时状态通过原生变量或 `plus.getState(id)` 读取。`plus.scope(context)` 选择具体保留实例，不改变活动页面。

`plus.pages` 投影页面 ID、路径、标题、states、保留与父级等公开元数据；不包含应用 `meta` 或 guard 实现，不能当作权限凭据。

## 生成原生路由

```tsx
import { createReactRoutes } from '@jangts/router-plus/react';
const routes = createReactRoutes(pages, {
  components: { orders: OrdersList, order: OrderDetail },
});
```

```ts
import { createVueRoutes } from '@jangts/router-plus/vue';
const routes = createVueRoutes(pages, {
  components: { orders: OrdersList, order: OrderDetail },
});
```

`OrdersList`／`OrderDetail` 是应用组件。生成器使用页面 ID 查找组件，返回原生兼容路由记录；加载、错误处理和路由树布局由应用决定。需要运行已注册的转换器时传入 `{ plus, components }`，否则只生成路由。

`await plus.retain()` 可手动保留当前实例，不修改页面声明；保留 DOM 仍需保留渲染宿主持续挂载。`await plus.release()` 释放当前作用域并重建活动子树，不会关闭页面已声明的保留策略。Vue View 的 cache 属性不能替代 Core 的保留声明。
