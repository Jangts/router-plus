# API 参考

适用版本：**0.8.0**。原生状态是实时来源，页面 states 描述导航合同。按用途选择入口：

Router Plus 按用途拆分公开入口；Core 不加载 React、Vue 或 DOM，框架适配、DOM 交互与状态桥接分别从子入口加载。

| 入口 | 内容 | 使用场景 |
| --- | --- | --- |
| `@jangts/router-plus` | `createRouterPlus`、页面合同、命令、连接、插件、核心类型 | 与框架无关的 Core |
| `@jangts/router-plus/react` | 装配、Provider、hooks、链接、保留渲染、路由生成、覆盖层 | React 应用 |
| `@jangts/router-plus/vue` | 插件、composables、链接、保留视图、路由生成、覆盖层 | Vue 应用 |
| `@jangts/router-plus/overlay` | DOM 目标运行时、默认覆盖层、历史桥、样式 | 浏览器交互能力 |
| `@jangts/router-plus/stores/{redux,zustand,jotai}` | 原生创建包装及已有 Store 登记 | 已有状态库 |
| `@jangts/router-plus/testing` | 内存连接、实例宿主、假状态桥 | 隔离测试 |

## 页面索引

- [核心 API](/zh/api/core)：构造、目标解析、命令、调试门面与默认匹配器；
- [核心类型](/zh/api/types)：页面定义、回执、连接、插件与交互合同；
- [React 入口](/zh/api/react)：装配、hooks、组件与路由生成；
- [Vue 入口](/zh/api/vue)：插件、composables、组件与路由生成；
- [覆盖层入口](/zh/api/overlay)：DOM 运行时、默认覆盖层与样式；
- [状态库接入](/zh/api/stores)：Zustand、Redux Toolkit 与 Jotai；
- [测试工具](/zh/api/testing)：内存连接、宿主与假状态桥。

## 命令结果

`navigate`、`setState`、`callState`、`highlight` 等命令都返回 `CommandResult`：

```ts
type CommandResult =
  | { ok: true; value?: unknown }
  | {
      ok: false;
      reason: CommandReason;
      message?: string;
      navigationId?: string;
      stage?: string;
      committed?: boolean;
    };
```

`reason` 用于区分失败原因：

| reason | 含义 |
| --- | --- |
| `invalid-target` / `unknown-page` / `invalid-param` / `invalid-tab` | 目标、页面或参数无法解析 |
| `unsupported-scheme` / `unknown-action` | 链接协议或业务 action 未登记 |
| `target-not-found` | 交互目标在当前根节点内找不到 |
| `state-readonly` / `state-unsupported` / `state-unknown` | 状态不可写、缺少能力或 key 未知 |
| `unsupported-command` / `not-connected` / `not-ready` | 命令不可用或连接尚未就绪 |
| `blocked` / `cancelled` / `failed` / `timeout` / `superseded` / `noop` | 守卫拒绝、取消、失败、超时、被新目标替代或无变化 |

## 导入示例

```ts
import { createRouterPlus, createPageLink } from '@jangts/router-plus';
import type { PageDefinition, PageContext, CommandResult } from '@jangts/router-plus';
import { createReactRouterPlus } from '@jangts/router-plus/react';
import { createVueRouterPlus } from '@jangts/router-plus/vue';
import { installDomRuntime } from '@jangts/router-plus/overlay';
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
import { createMemoryConnection } from '@jangts/router-plus/testing';
```

Core 的 `apiVersion` 当前固定为整数 `1`，与包 semver 独立；只有该版本被接受。

[消费端测试：纯内存、Vue 和 React 批量用例](/zh/guide/testing)。
