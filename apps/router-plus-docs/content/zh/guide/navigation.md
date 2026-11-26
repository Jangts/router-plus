# 导航与结果

所有导航都通过同一套目标与命令。成功以底层 Router 的实际提交为准，包含最终重定向地址；失败则用 `reason` 区分原因。

## 目标

`PageTarget` 支持四种写法：

```ts
await plus.navigate('/orders/42');
await plus.navigate({ path: '/orders/42', values: { section: 'details' }, replace: true });
await plus.navigate({ pathname: '/orders/42', search: '?draft=1', hash: '#items' });
await plus.navigate({ page: 'orders-detail', params: { id: '42' }, values: { section: 'details' }, hash: '#items' });
```

- 路径对象可以指向页面目录之外的地址；此时 `pageId` 与实例为 `null`。
- 页面对象必须对应已登记的 id；缺失或非法参数会返回 `unknown-page`／`invalid-param`。
- 查询对（`queryAll`）与原始 search 会保留在上下文里；普通重复键允许存在，但普通 query 字段必须只有一个合法值；自定义对象组 codec 按声明解释重复参数。

解析目标本身是只读的：

```ts
plus.resolveTarget({ page: 'orders-detail', params: { id: '42' } });
plus.resolveHref('/orders/42');
plus.resolveLink({ action: 'export-orders', payload: { format: 'csv' } });
```

`resolveTarget` 同步返回页面／外部计划或 `null`；`resolveLink` 还接受业务 action；`resolveHref` 只返回页面地址。非法输入和协议失败都不会执行副作用。

## 局部查询参数更新

使用 `plus.patchQuery({ page: undefined, keyword: 'coffee', tags: ['hot', 'new'] }, { replace: true })` 修改指定键。undefined 和空数组删除参数，空串仍是值；未指定参数、hash、无关 history 载荷与非 query 导航状态保留。显式 `options.state` 替换 history 载荷。无变化的 patch 返回 noop，不新增历史项；`usePageQuery` 的完整 setter 仍按完整替换处理。

`{ page, params, query, hash }` 可直接构造已登记页面的深链，不必拼接路径。hash 必须为空或以 `#` 开头；仅含 hash 的字符串导航保留当前 query。

## 命令

| 分组 | 命令 |
| --- | --- |
| 导航 | `navigate`、`replace`、`back`、`forward`、`go`、`query.patch` |
| 上下文 | `context.read` |
| 状态 | `state.read`、`state.set`、`state.patch`、`state.reset`、`state.call` |
| 高亮 | `highlight.set`、`highlight.clear` |
| 导览 | `tour.start`、`tour.next`、`tour.prev`、`tour.stop` |
| 交互 | `focus`、`scroll.to` |
| 实例 | `retain`、`release` |

typed 方法与 `execute(command)` 共用处理器。推荐使用 typed 方法，排查或转接时再使用命令对象。

## 解读结果

```ts
const result = await plus.navigate({ page: 'orders-detail', params: { id: '42' } });

if (result.ok) {
  console.log('committed', result.value);
} else {
  console.error(result.reason, result.message, result.stage, result.committed);
}
```

- `blocked`：守卫拒绝或原生 Router 阻止；
- `cancelled` / `superseded`：取消或被更新的目标替代；
- `invalid-target` / `unknown-page` / `invalid-param` / `invalid-tab`：目标无法解析；
- `unsupported-command` / `not-connected` / `not-ready`：能力缺失或尚未连接。

提交后的回调失败仍保留 `committed: true`。需要更完整的导航事实时读取 `NavigationResult`，其中包含实际地址、上下文、导航 ID 与重定向事实；失败的阶段和 committed 标志在失败回执上。

## 执行顺序

一次导航依次执行：

1. 解析目标；
2. 离开守卫；
3. 进入守卫；
4. 一次历史提交；
5. 上下文与实例更新；
6. `afterEnter` 等提交后回调。

默认策略是「最新目标替换」，`navigationStrategy: 'serial'` 改为串行。重定向循环有上限；Plus 的取消不会回滚已经提交的框架跳转。

## 原生跳转与拦截

核心本身不监听浏览器。连接负责提供初始快照、提交、订阅和可选遍历；`intercept(check)` 把原生框架跳转接到同一套守卫评估。

- Vue 适配支持原生跳转前拦截；React Data Router 装配适配器在原生路由具备 blocker API 时提供拦截。Data Router 构造需要 React Router DOM >=6.4，构造能力本身不代表 blocker 可用；
- 普通声明式 React Router 观察原生提交，并检查 Plus 发起的导航；
- 完整页面卸载与刷新无法等待异步页面守卫。

## 语义链接与业务 action

配置 `pageLink` 后可编码／解析语义链接：

```ts
import { createRouterPlus, createPageLink } from '@jangts/router-plus';

const plus = createRouterPlus({
  pages,
  pageLink: { scheme: 'app', pathKey: 'screen' },
  globalKey: false,
});

const href = createPageLink({ path: '/orders/42?section=details' }, {
  scheme: 'app', pathKey: 'screen',
});
plus.resolveLink(href);
```

显式登记 action 可以处理非页面动作：

```ts
const plus = createRouterPlus({
  pages,
  actions: [
    {
      id: 'export-orders',
      handler: {
        button: true,
        invoke: (payload) => exportOrders(payload),
      },
    },
  ],
  globalKey: false,
});
```

action 链接在渲染时表现为按钮；解析阶段不会执行 handler。协议解析器必须同步、无副作用，循环、thenable 与过深递归都会被拒绝。

地址中的 section 需与页面 states 声明一致；在页面内用同名 ID 登记原生状态。命令数组与等待条件挂载来源见[状态访问与命令编组](state-access)。
