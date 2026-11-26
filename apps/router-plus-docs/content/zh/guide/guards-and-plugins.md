# 守卫与插件

守卫在导航提交前决定是否放行；插件把协议、解析器、渲染器与策略登记到实例。两者都只解释通用合同，业务名称和数据由调用方提供。

示例中的权限、草稿、埋点与订阅函数由应用实现。

## 页面守卫

```ts
const pages = [
  {
    path: '/orders/:id/edit',
    title: '编辑订单',
    guards: {
      beforeLeave: async ({ context, signal }) => {
        if (!hasUnsavedChanges(context)) return true;
        return { message: '还有未保存的修改，确定离开吗？' };
      },
      beforeEnter: async ({ context }) => {
        if (!canEdit(context)) return { redirect: { path: '/login' } };
        return true;
      },
      afterEnter: ({ context }) => {
        reportVisit(context.pageId);
      },
      onRetain: ({ instance }) => pauseSubscriptions(instance),
      onRestore: ({ instance }) => resumeSubscriptions(instance),
    },
  },
];
```

`GuardResult` 支持：

- `true`：放行；
- `false`：拒绝，不附带消息；
- `{ redirect: PageTarget }`：改去另一个目标，仍有循环上限；
- `{ message: string }`：拒绝并附带可展示的消息。

守卫收到 `context`、所属 `page` 与取消信号。取消信号在导航被新目标替代时触发；已提交的框架跳转不会被回滚。

## 全局守卫与 hook

```ts
const stop = plus.registerGuard({
  id: 'auth',
  beforeEnter: async (context) => {
    if (context.pageId === 'orders-detail' && !(await isSignedIn())) {
      return { redirect: { path: '/login' } };
    }
    return true;
  },
});
```

React 在组件生命周期内登记：

```tsx
import { usePageLeaveGuard } from '@jangts/router-plus/react';

usePageLeaveGuard({
  id: 'draft',
  beforeLeave: () => (dirty ? { message: '未保存' } : true),
});
```

Vue 的 `usePageLeaveGuard` 在作用域内存活，卸载时自动移除。boundary 内的 hook 守卫是实例级；Provider 级守卫是全局的。

## 插件

```ts
import type { RouterPlusPlugin } from '@jangts/router-plus';

const analytics: RouterPlusPlugin = {
  id: 'analytics',
  requires: ['telemetry'],
  setup(api) {
    api.registerNavigationAction('track', {
      invoke: (payload, context) => report(payload, context.pageId),
    });

    return () => {
      // 清理；可以返回 Promise，卸载时会等待。
    };
  },
};
```

```ts
const plus = createRouterPlus({
  pages,
  plugins: [telemetry, analytics],
  globalKey: false,
});
```

插件按 `requires` 与 `before` 排序安装；动态安装不能破坏已有顺序。`setup` 中的登记是事务性的，失败会回滚。卸载仍被依赖的插件会被拒绝，除非显式 `cascade`。

`setup(api)` 可登记：

| 能力 | 方法 |
| --- | --- |
| 链接协议 | `registerLinkProtocol` |
| 全局守卫 | `registerGuard` |
| 保留策略 | `registerRetentionStrategy` |
| 实例身份策略 | `registerInstanceKeyStrategy` |
| 目标解析器与运行时 | `registerTargetResolver`、`registerTargetRuntime` |
| 高亮渲染器 | `registerHighlightRenderer` |
| 路由转换器 | `registerRouteTransformer` |
| 导航 action | `registerNavigationAction` |
| 滚动策略 | `registerScrollStrategy` |

## 路由转换

```ts
const versioned: RouterPlusPlugin = {
  id: 'versioned-routes',
  setup(api) {
    api.registerRouteTransformer({
      id: 'add-version-meta',
      transform: (routes, { framework }) =>
        routes.map((route) => ({
          ...route,
          meta: { ...route.meta, framework, version: 1 },
        })),
    });
  },
};
```

`plus.transformRoutes(routes, framework)` 会按登记顺序应用转换器；路由生成器传入 plus 选项后也使用该实例的转换器。

## 归属边界

Plus 只提供通用守卫与登记机制。业务路径策略、授权、角色和页面可见性由应用决定；页面目录只暴露安全元数据，不构成权限凭据。

[高亮与导览](interactions)使用同一插件及交互合同。
