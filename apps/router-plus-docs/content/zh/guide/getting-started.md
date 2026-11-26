# 接入与生命周期

先让应用连上 Router Plus：创建实例、登记两个页面，再通过框架入口提供上下文。页面继续由原生路由负责渲染。

## React

```tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  createReactRouterPlus,
  RouterPlusLink,
  RouterPlusRedirect,
} from '@jangts/router-plus/react';

const plus = createReactRouterPlus({
  router: <BrowserRouter />,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { path: '/beta/:id', title: 'Beta' },
  ],
  globalKey: false,
});

function App() {
  return (
    <>
      <RouterPlusLink to="/beta/42">打开 Beta</RouterPlusLink>
      <Routes>
        <Route path="/" element={<RouterPlusRedirect to="/alpha" />} />
        <Route path="/alpha" element={<p>Alpha</p>} />
        <Route path="/beta/:id" element={<p>Beta</p>} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <plus.Provider>
    <App />
  </plus.Provider>,
);
```

`createReactRouterPlus` 返回的实例额外带一个稳定的 `Provider`。实例应放在模块作用域或状态初始化中，不要在每次渲染时重新创建。

纯 JS／TS 可以传入构造函数元组，props 会从组件推断；全部参数可选时可以简写：

```ts
const plus = createReactRouterPlus({
  router: [BrowserRouter, { basename: '/' }],
  pages,
  globalKey: false,
});
```

### Data Router

该原生 API 需要 React Router DOM >=6.4。6.0–6.3 应用使用上述声明式接入；原生跳转拦截还要求所传路由具备 blocker API。

```tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
```

Data Router 的页面放在原路由记录里，Provider 不接收 children；loader、重定向和原生路由组织继续由 React Router 负责。

## Vue

```ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory, useRoute } from 'vue-router';
import {
  createVueRouterPlus,
  RouterPlusLink,
  RouterPlusView,
} from '@jangts/router-plus/vue';

const Page = defineComponent({
  setup() {
    const route = useRoute();
    return () => h('p', route.path);
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/alpha' },
    { path: '/alpha', component: Page },
    { path: '/beta/:id', component: Page },
  ],
});

const plus = createVueRouterPlus({
  router,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { path: '/beta/:id', title: 'Beta' },
  ],
  globalKey: false,
});

createApp({
  render: () =>
    h('main', [
      h(RouterPlusLink, { to: '/beta/42' }, () => '打开 Beta'),
      h(RouterPlusView),
    ]),
})
  .use(plus)
  .mount('#app');
```

`app.use(plus)` 一次安装传入的 Vue Router 与 Plus 连接。应用卸载会清理适配层订阅，并销毁工厂创建的 Core；应用自己传入的 Router 不会被 Plus 销毁。

## 连接之后

Provider 或插件连接后，可以等待初始安装完成，并开始使用统一命令：

```ts
await plus.whenReady();

const result = await plus.navigate({ path: '/beta/42' });
if (!result.ok) console.error(result.reason, result.message);

await plus.back();
```

`ready` 等待初始插件安装与显式初始快照恢复；`whenReady()` 还会等待已登记的 bridge 恢复和排队的实例宿主生命周期工作。

## 复用已有 Core

React 与 Vue 构造函数都接受 `{ plus: existingCore, router }`。此时不再传 `pages` 等构造选项，调用方继续拥有该实例并在结束时调用 `await plus.dispose()`。

## 渐进接入

已经挂载原生 Router 的应用可以使用底层 `createReactProvider({ useLocation, useNavigate })` 或 `createVueConnection(router)`。它们只建立连接，不替换 Router，也不会自动挂载覆盖层。

页面身份与地址状态见[页面与实例](pages-and-instances)，原生值登记见[原生状态与查询参数](state-and-tabs)。

## 热更新接入

在创建 Core、React 或 Vue 实例的模块中传入 `hmr`。Vite 使用 `import.meta.hot`；Webpack 5、Rspack / Rsbuild 的 ESM 模块使用 `import.meta.webpackHot`，CommonJS 模块使用 `module.hot`；Parcel 使用 `module.hot`。无热更新环境传入 `undefined` 或 `false`。Rollup、esbuild 的 watch/rebuild 本身不提供 HMR，使用额外运行时时传入实现 `dispose(callback)` 的对象。

```ts
import { createRouterPlus } from '@jangts/router-plus';
export const plus = createRouterPlus({
  pages: [{ path: '/', title: '首页' }],
  hmr: import.meta.hot, // Webpack/Rspack ESM 改为 import.meta.webpackHot
});
```

同一选项适用于自行创建 Core 的 `createReactRouterPlus` 和 `createVueRouterPlus`。外部传入 `plus` 时，在 Core 的创建模块配置，并在应用热更新边界清理适配器连接。RP 导出结构类型 `RouterPlusHotModule`，不扩展宿主全局类型；热更新对象的类型使用构建工具提供的声明。

RP 只注册清理，不调用 `accept()`，不接管原生路由器，也不自动保留内存页面状态。由框架或入口边界重新挂载消费者；消费者仍持有旧导出时，不要单独自接受实例模块。替换前同步释放自身全局键并断开导航，异步完成插件和状态清理；旧实例不能删除新实例或第三方的全局对象。清理失败通过 `onDiagnostic(error, 'hmr.dispose')` 报告。正常的重复实例仍报冲突，独立应用应使用不同的 `globalKey`。

Vue 连接在热更新、应用卸载与手动销毁之间只清理一次；原生监听注销失败时仍继续其他清理。适配器清理失败通过 `onDiagnostic` 报告，热更新阶段为 `hmr.dispose`，其他阶段为 `vue.dispose`；诊断回调自身失败不打断清理。

React 工厂自行创建的 Core 只有在设置 `disposeOnUnmount: true` 时，才随最后一个 Provider 卸载自动销毁；StrictMode 探测卸载被忽略。默认由调用方显式销毁，外部传入的 Core 始终由调用方管理。
