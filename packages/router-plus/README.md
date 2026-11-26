[English](#english) | [中文](#中文)

<a id="english"></a>

# @jangts/router-plus

<img src="https://router-plus-docs.pages.jangts.cafe/branding/router-plus-logo.png" alt="Router Plus" width="360">

Routing enhancements for React and Vue: unified navigation, page instance state, validated state with optional query binding, retained views, scoped guards, highlights and guided tours.

Router Plus connects to your router. Your application keeps its route tree, layouts, components and stores; it can adopt only the capabilities it needs. The framework-independent Core has no React, Vue or application dependencies. Framework adapters, DOM interactions and store bridges use separate entry points.

Apache-2.0 · ESM/CommonJS · TypeScript declarations · Node >=22.12 for Node consumers and tooling. Browser applications use their own bundler.

## Install

```sh
# React application with React and React DOM already installed
npm install @jangts/router-plus react-router-dom

# Vue application with Vue already installed
npm install @jangts/router-plus vue-router
```

TypeScript React applications also need `@types/react` and `@types/react-dom` as development dependencies.

React >=18, React Router DOM >=6, Vue >=3.5 and Vue Router >=4.0.16 are optional peers. Install the stack you use; the React entry does not import Vue. Your application and Plus must resolve the same framework/router copies. For linked workspaces, configure your bundler's dependency deduplication when needed.

## Tabs, filters and address restoration

Register existing native values with `useReactState` / `useVueState`, or create them with `useRp*`. Use `query` for address binding, `history: 'push'` for traversable changes, `omitDefault` for compact URLs, and a synchronous `ready` predicate for asynchronous catalogs. Bindings restore navigation automatically; application synchronization watchers are not needed. See [complete address bindings](docs/state-bindings.md#complete-address-bindings) and [retained hosts](docs/frameworks.md#retained-rendering-hosts-and-owned-provider-lifetime).

See [application integration recipes](docs/application-integration.md) for complete dashboard, asynchronous catalog, request lifecycle, guards and retained-route compositions.

## Development hot reload

Pass `hmr: import.meta.hot` (Vite), `hmr: import.meta.webpackHot` (Webpack/Rspack/Rsbuild ESM), or `hmr: module.hot` (Webpack/Rspack CommonJS or Parcel) in the module creating your RP instance. The Core, React and Vue factories support this option. Keep framework remount ownership at the app entry; RP does not self-accept updates. See [HMR integration](docs/frameworks.md#hot-module-replacement).

## React quick start

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
      <RouterPlusLink to="/beta/42">Open Beta</RouterPlusLink>
      <Routes>
        <Route path="/" element={<RouterPlusRedirect to="/alpha" />} />
        <Route path="/alpha" element={<p>Alpha</p>} />
        <Route path="/beta/:id" element={<p>Beta</p>} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <plus.Provider><App /></plus.Provider>,
);
```

Plain JS/TS can use `router: [BrowserRouter, { basename: '/' }]` or `router: createElement(BrowserRouter, { basename: '/' })`. Tuples infer the component's props; `[BrowserRouter]` is valid when no required props are needed. JSX, tuples and explicit React elements use the same connection.

A Data Router instance is also supported with React Router DOM >=6.4 (6.0–6.3 use the declarative integration above):

```tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
```

Here, `createBrowserRouter` comes from `react-router-dom`; `routes` is your native route tree and `pages` is the Plus page catalog. Data Router content remains in its route records; its Plus Provider takes no children. Loaders, redirects and native routing remain owned by React Router. For an already mounted router, use `createReactProvider({ useLocation, useNavigate })` inside the existing context. Keep the Plus instance stable across renders. Provider unmount disconnects; the owner calls `await plus.dispose()` when the instance is no longer needed.

## Vue quick start

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
  render: () => h('main', [
    h(RouterPlusLink, { to: '/beta/42' }, () => 'Open Beta'),
    h(RouterPlusView),
  ]),
}).use(plus).mount('#app');
```

`app.use(plus)` installs the supplied Vue Router and the Plus connection. Both framework factories accept `{ plus: existingCore, router }` to reuse a Core instance. Vue app unmount removes adapter subscriptions and disposes a factory-created Core; an externally supplied Core remains owned by the caller. Native router instances are never disposed by Plus.

## Navigation and results

After the provider/plugin has connected:

```ts
await plus.whenReady();
const result = await plus.navigate('/beta/42');
if (!result.ok) console.error(result.reason, result.message);
await plus.back();
```

Register navigable state before selecting it: for example, `{ path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } }`. Targets may be URL strings, `{ path, values: { section: 'details' } }`, `{ pathname, search, hash }` or `{ page, params, query }`. A page id defaults to its path template. `pageLink: { scheme: 'example' }` enables semantic page links; explicit registered actions provide non-navigation links without executing effects while parsing.

Commands return `{ ok: true, value? }` or `{ ok: false, reason, message?, ... }`. Guards, cancellation, invalid targets and missing capabilities have distinct outcomes. Successful navigation uses the connected router's actual commit, including redirects. Native pre-navigation interception depends on the router: Vue adapters support it, and Data Router adapters support it when native blocker registration/state is available, while ordinary declarative React routers observe native commits and guard Plus-initiated navigation. A browser refresh cannot await asynchronous leave guards.

## Native state and retained views

React uses native-compatible hooks with an optional final registration ID or options:

```tsx
import { useRpState, useRpRef, useRpCallback } from '@jangts/router-plus/react';
// Inside a React component:
const [filter, setFilter] = useRpState({ category: 'all', range: { from: 1 }, draft: '' }, {
  id: 'filter',
  fields: {
    category: { query: true, values: ['all', 'code'] },
    range: { query: true },
  },
});
const input = useRpRef<HTMLInputElement>(null, 'searchInput');
const refresh = useRpCallback(() => setFilter(value => ({ ...value, draft: '' })), [], 'refresh');
```

Omit registration to use the native API without a provider. Vue uses `useRpRef`, `useRpReactiveState` and `useRpComputedState` in components and setup stores. Options API components call them in `setup()`. Components/effect scopes automatically unregister their sources.

A plain object with `query: true` expands one level. `fields` selects or overrides individual values; a non-scalar field defaults to JSON. Whole groups and fields accept `encode/decode`. Explicit parameter ownership preserves unrelated query values and hashes. See [the complete state contract](docs/state-bindings.md) for repeated parameters, codecs and lifecycle rules.

External access uses `plus.getState('filter')`, `plus.setState(value, 'filter')` and `plus.callState('refresh')`. A concrete page instance is selected with `plus.scope(context)`. Readonly sources reject writes. `plus.inspectState(id)` describes an installed source's write/call capabilities and query parameter names without reading its value; omission lists visible registrations. For dependent navigation/panel/form actions, `plus.execute(commands, { timeoutMs?, signal? })` runs existing commands in order, waiting for source registration and framework publication. Lifecycle notifications use `subscribe` with `state.registered`, `state.unregistered` and `state.committed`; failed groups retain completed receipts and never retry a submit. Existing state is not copied into an RP store. To index an existing native source, call `useReactState(stateTupleOrRefOrCallbackOrAccessor, idOrOptions?)` or `useVueState(refOrReactiveOrCallbackOrAccessor, idOrOptions?)`. Both return `void` and clean up automatically; `useRp*` creation hooks use the same registration path.

Store creators bind native libraries once: `createRpZustand(plus, create)`, `configureRpReduxStore(plus, configureStore)` and `createRpJotaiAtom(plus, atom, store)` return creators with the native arguments plus optional registration. The resulting stores/atoms keep their native API. Store IDs namespace field/action access, such as `filters/category` and `filters/setCategory`. Store bindings live with their router instance; they survive page unmounts. Existing stores use `registerZustandState(plus, store, options)`, `registerReduxState(plus, store, options)` or `registerJotaiState(plus, store, atom, options)`, each returning an idempotent stop function. Existing Redux state is readonly unless `set(next)` dispatches a business action; existing writable Jotai atoms expose commands, with complete-value assignment enabled only by an explicit `set(next)`. See [state bindings](docs/state-bindings.md#existing-stores) for examples.

`retain: true` retains the page instance. React `RouterPlusOutlet` and Vue `RouterPlusView` preserve its rendering host. A stable scope keeps inactive instances isolated. See [framework integration](docs/frameworks.md).

## Highlights and guided tours

Mount `RouterPlusOverlay` from your framework entry to install the default renderer and DOM target runtime. Core construction alone does not add UI. Then use explicit targets:

```ts
await plus.highlight(
  { selector: '#controls' },
  { message: 'Controls', spotlight: true },
);
await plus.clearHighlight();
await plus.startTour([
  { target: { selector: '#controls' }, message: 'Choose an option' },
  { target: { selector: '#content' }, message: 'Inspect the result' },
]);
```

The overlay's stacking level and appearance belong to your App. Configure `<RouterPlusOverlay theme={{ zIndex: 50, highlightRadius: 4, highlightBorderWidth: 1, highlightBorderColor: 'var(--app-accent)', maskColor: 'rgba(0,0,0,.25)', highlightPadding: 0 }} />`. The same theme is accepted by Vue and `mountOverlay`. The stacking fallback is 10000; `theme.zIndex` also accepts `{ min?, max? }` to bound it (for example `{ max: 59 }` reserves higher App layers); ordinary App CSS can override the zero-specificity defaults. See [theme options and CSS precedence](docs/state-and-interaction.md#app-owned-overlay-layer-and-appearance).

To supply your own highlight visual, use `<RouterPlusOverlay highlightComponent={AppHighlight} />`. `AppHighlight` implements `HighlightComponentProps`: `width`, `height`, `left`, `top` and typed `context`. Plus measures and positions the outer box, keeps shared overlay stacking/mask behavior and preserves App context. Custom components own their bubbles and controls; the default bubble is hidden in custom mode. Both built-in and custom components receive the same five-field props; only the built-in receives extra style parameters. `context.next(step = 1)` moves a tour forward or backward with signed steps. Default highlight styles do not decorate custom content; removing the registration restores the default. The default rectangular bubble supports side/corner placements, viewport-aware modes and `none`; `tipBorderColor`, `tipBorderWidth`, `surfaceColor`, `textColor` and `radius` provide basic styling without an arrow. See [components and placement](docs/state-and-interaction.md#app-registered-highlight-components).

Focus, scrolling, named targets, asynchronous resolvers and custom renderers use the same scoped context and cancellation contracts. To supply only DOM capabilities without the default overlay, use `installDomRuntime` from `@jangts/router-plus/overlay`. Runtime-injected default styles and the optional `@jangts/router-plus/overlay.css` export share one source.

## Entry points and extension

| Import | Purpose |
| --- | --- |
| `@jangts/router-plus` | Core construction, page contracts, commands, plugins and connections |
| `@jangts/router-plus/react` | React assembly, provider, hooks, links, retained rendering and overlay |
| `@jangts/router-plus/vue` | Vue assembly/plugin, composables, links, retained rendering and overlay |
| `@jangts/router-plus/overlay` | Optional DOM runtime, renderer and raw history bridge |
| `@jangts/router-plus/stores/{redux,zustand,jotai}` | Native store creation and existing-source registration entry points; replace the brace expression with one store name |
| `@jangts/router-plus/testing` | DOM-free RP fixtures, memory connection, host and bridge helpers |
| `@jangts/router-plus/testing/vue` | Vue Test Utils mounting with RP and memory routing |
| `@jangts/router-plus/testing/react` | React Testing Library rendering with RP and memory routing |

See [consumer testing](docs/testing.md) for setup and batch examples.

Applications can keep hand-written routes or use `createReactRoutes` / `createVueRoutes`. Plugins register protocols, actions, guards, instance identity and retention strategies, target resolvers, renderers and route transforms. Page catalogs contain safe metadata, while component/layout maps remain in the application. Route policy and authorization belong to the application.

Core can run without framework or DOM imports. Create a separate instance per SSR request and use `initialLocation`, `initialSnapshot` and `snapshot()` for matching hydration seeds. In browsers the default global facade is `__ROUTER_PLUS__`; set `globalKey: false` to disable it. The facade is a debug surface, not an authorization boundary.

## Documentation and license

- [Online documentation](https://router-plus-docs.pages.jangts.cafe/en/): guide, API reference and framework examples.
- [Changelog](CHANGELOG.md): version change notes.
- [API and connections](docs/api.md): construction, targets, receipts, guards and plugins.
- [Framework integration](docs/frameworks.md): JSX/tuple/Data Router inputs, Vue installation, scopes and lifecycle ownership.
- [State, SSR and interactions](docs/state-and-interaction.md): state bridges, persistence, snapshots, DOM targets and tours.

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

---

<a id="中文"></a>

# @jangts/router-plus

<img src="https://router-plus-docs.pages.jangts.cafe/branding/router-plus-logo.png" alt="Router Plus" width="360">

面向 React 与 Vue 的路由增强库，提供统一导航、页面实例状态、历史 Tab、页面保留、实例级守卫、高亮和分步导览。

Router Plus 与应用现有 Router 连接。路由树、布局、组件和状态库仍由应用选择与组织，也可以只接入其中一项能力。Core 不依赖 React、Vue 或具体业务，框架适配、DOM 交互和状态桥接分别从独立入口加载。

Apache-2.0 许可，提供 ESM、CommonJS 和 TypeScript 声明。Node 消费端及构建工具要求 Node >=22.12；浏览器应用使用自己的打包工具。

## 安装

```sh
# 已安装 React、React DOM 的 React 应用
npm install @jangts/router-plus react-router-dom

# 已安装 Vue 的 Vue 应用
npm install @jangts/router-plus vue-router
```

TypeScript React 应用还需要将 `@types/react` 与 `@types/react-dom` 安装为开发依赖。

React >=18、React Router DOM >=6、Vue >=3.5、Vue Router >=4.0.16 均声明为可选 peer 依赖，只安装应用采用的框架即可；React 入口不导入 Vue。应用和 Plus 必须解析到同一份框架与 Router，关联 workspace 时可通过打包工具的依赖去重配置保证 Context 一致。

## Tab、筛选与地址恢复

已有原生状态使用 useReactState／useVueState，创建状态可用 useRp*。通过 query 绑定地址、history 选择可后退的切换、omitDefault 省略默认参数、ready 声明异步目录就绪条件；同步与恢复由库执行。完整示例见[状态绑定](docs/state-bindings.md#complete-address-bindings)，自定义保留宿主见[框架接入](docs/frameworks.md#retained-rendering-hosts-and-owned-provider-lifetime)。

## 开发热更新

在创建 RP 实例的模块中配置 `hmr: import.meta.hot`（Vite）、`hmr: import.meta.webpackHot`（Webpack/Rspack/Rsbuild ESM）或 `hmr: module.hot`（Webpack/Rspack CommonJS、Parcel）。Core、React 和 Vue 工厂均支持该选项。入口仍负责框架重新挂载，RP 不自动接受模块更新。参阅[热更新接入](docs/frameworks.md#热更新接入)。

## React 快速接入

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
  <plus.Provider><App /></plus.Provider>,
);
```

纯 JS／TS 可以写成 `router: [BrowserRouter, { basename: '/' }]`，由 Plus 内部构造 Router 元素；也可以显式传入 `createElement(BrowserRouter, { basename: '/' })`。数组会推断原生组件的 props，全部参数可选时可简写 `[BrowserRouter]`。JSX、数组与显式元素共用同一连接机制。

React Router DOM >=6.4 的 Data Router 可以直接传实例；6.0–6.3 使用上面的声明式接入：

```tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
```

这里的 `createBrowserRouter` 来自 `react-router-dom`；`routes` 是应用原生路由树，`pages` 是 Plus 页面目录。Data Router 的页面放在原路由记录里，Plus Provider 不接收 children；loader、重定向和原生路由组织继续由 React Router 负责。已有 Router 上下文的应用可使用底层 `createReactProvider({ useLocation, useNavigate })` 渐进接入。Plus 实例需在渲染之间保持稳定；Provider 卸载负责断开连接，实例所有者在结束使用时调用 `await plus.dispose()`。

## Vue 快速接入

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
  render: () => h('main', [
    h(RouterPlusLink, { to: '/beta/42' }, () => '打开 Beta'),
    h(RouterPlusView),
  ]),
}).use(plus).mount('#app');
```

一次 `app.use(plus)` 同时安装传入的 Vue Router 和 Plus 连接。React／Vue 两个构造函数都支持 `{ plus: existingCore, router }`，用于装配已有 Core。Vue 应用卸载会清理适配层订阅，并销毁工厂创建的 Core；外部传入的 Core 仍由调用方管理。Plus 不销毁应用传入的原生 Router。

## 导航与执行结果

Provider／插件连接后可调用：

```ts
await plus.whenReady();
const result = await plus.navigate('/beta/42');
if (!result.ok) console.error(result.reason, result.message);
await plus.back();
```

需要导航定位的状态先在页面定义登记，例如 `{ path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } }`。导航目标支持 URL 字符串、`{ path, values: { section: 'details' } }`、`{ pathname, search, hash }` 和 `{ page, params, query }`；页面 id 默认取路径模板。配置 `pageLink: { scheme: 'example' }` 可启用语义页面链接，显式登记 action 可处理非页面动作；解析链接本身不执行副作用。

命令返回 `{ ok: true, value? }` 或 `{ ok: false, reason, message?, ... }`，区分守卫拒绝、取消、非法目标和缺少能力。导航成功以底层 Router 的实际提交为准，包含最终重定向地址。原生跳转前能否拦截取决于 Router：Vue 适配支持原生守卫，Data Router 在具备原生 blocker 登记和状态能力时支持拦截；普通声明式 React Router 观察原生提交，并检查 Plus 发起的导航。浏览器刷新不能等待异步离开守卫。

## 原生状态与保留视图

React 使用 `useRpState`、`useRpRef`、`useRpContext`、`useRpCallback`，Vue 使用 `useRpRef`、`useRpReactiveState`、`useRpComputedState`。原生参数与返回值保持原样，只增加最后一个可选 ID 或配置：

```tsx
// 在 React 组件内部调用：
const [filter, setFilter] = useRpState(
  { category: 'all', range: { from: 1 }, draft: '' },
  { id: 'filter', fields: {
    category: { query: true, values: ['all', 'code'] },
    range: { query: true },
  } },
);
```

不传登记参数时无需 Provider，直接使用原生状态。组件和 Vue setup store 随所属作用域销毁自动注销；Vue Options API 在 `setup()` 内使用同一套 composables。

对象整组 `query: true` 展开一层字段，`fields` 选择或覆盖字段配置，非标量字段默认 JSON。整组和字段都支持 `encode/decode`，更新只修改声明归属的参数，保留其他参数和 hash。[完整合同](docs/state-bindings.md)说明重复参数、编解码、枚举及生命周期。

外部通过 `plus.getState('filter')`、`plus.setState(value, 'filter')`、`plus.callState('refresh')` 操作；`plus.scope(context)` 选择具体页面实例。只读来源拒绝写入，当前值始终由原组件或状态库持有。

React 状态库通过 `createRpZustand(plus, create)`、`configureRpReduxStore(plus, configureStore)`、`createRpJotaiAtom(plus, atom, store)` 绑定原生创建入口，返回的创建函数沿用原参数并追加可选登记配置。创建结果保留原生 API，store ID 为字段和动作提供命名空间，例如 `filters/category`、`filters/setCategory`。共享 store 随 Router Plus 实例结束清理，不随使用它的页面卸载。

`plus.execute(commands, { timeoutMs?, signal? })` 将现有命令顺序编组，等待条件挂载来源登记和框架提交；失败保留逐步回执，不自动重试提交操作。来源注册／注销／提交通过 `subscribe` 的 `state.registered`、`state.unregistered`、`state.committed` 通知。

`plus.inspectState(id)` 可查询已登记来源的读写／调用能力及 QS 参数名，不读取实时值；省略 ID 列出当前门面可见来源，未挂载的地址声明不列入。

Vue 也可直接登记 callback，通过 `plus.callState(id, ...args)` 获取原方法的异步结果；依赖 receiver 的方法需先 bind 或使用转发闭包。

已有来源可直接调用 `useReactState(source, idOrOptions?)`／`useVueState(source, idOrOptions?)`，返回 void 并自动清理；创建用的 `useRp*` 复用同一登记路径。已有 Store 分别使用 `registerZustandState(plus, store, options)`、`registerReduxState(plus, store, options)`、`registerJotaiState(plus, store, atom, options)`，返回幂等 stop，RP 销毁时兜底清理。已有 Redux 默认只读，显式 `set(next)` 分发业务 action 才能赋值或恢复 QS；已有 Jotai writable atom 支持原生命令调用，完整值赋值需显式 set 适配。参见[状态登记示例](docs/state-bindings.md#existing-stores)。

`retain: true` 保留页面实例，React `RouterPlusOutlet` 与 Vue `RouterPlusView` 配合保留组件和 DOM；具体行为见[框架接入](docs/frameworks.md)。

## 高亮与分步导览

从框架入口挂载 `RouterPlusOverlay`，即可安装默认覆盖层和 DOM 目标运行时；仅创建 Core 不会增加界面。随后可显式指定目标：

```ts
await plus.highlight(
  { selector: '#controls' },
  { message: '操作区', spotlight: true },
);
await plus.clearHighlight();
await plus.startTour([
  { target: { selector: '#controls' }, message: '选择一个选项' },
  { target: { selector: '#content' }, message: '查看结果' },
]);
```

覆盖层的层级和外观由 App 决定，可配置 `<RouterPlusOverlay theme={{ zIndex: 50, highlightRadius: 4, highlightBorderWidth: 1, highlightBorderColor: 'var(--app-accent)', maskColor: 'rgba(0,0,0,.25)', highlightPadding: 0 }} />`。Vue 与 `mountOverlay` 接受相同 theme；Vue 模板使用 `:theme="guideTheme"`。默认层级为较高的 10000，App 可用 `zIndex: { max: 59 }` 保留更高层级，也可指定 `{ min, max }` 范围或直接给固定值；默认选择器采用零优先级，普通 App CSS 可以覆盖；主题切换不会重建高亮或运行时。`highlightRadius`、`highlightBorderColor`、`highlightBorderWidth`、`maskColor` 和 `highlightPadding` 分别控制高亮圆角、边色、边宽、遮罩和外扩，数字长度单位为 px，0 会原样保留；也可使用 CSS 变量和 `calc()`。单次 `highlight` 的 `padding` 优先于 theme。完整字段和 CSS 优先级见[覆盖层配置](docs/state-and-interaction.md#app-owned-overlay-layer-and-appearance)。

App 可以用 `<RouterPlusOverlay highlightComponent={AppHighlight} />` 注册自己的高亮组件，Vue 使用 `:highlight-component="AppHighlight"`。组件按 `HighlightComponentProps` 接口接收五个完整命名的参数：`width`、`height`、`left`、`top`、`context`。Plus 负责含外扩的实际尺寸、位置跟随和统一 overlay 层级；`context` 包含原始目标矩形、高亮、页面、导览状态及 `next(step = 1)` 控制函数。自定义内容及其气泡、文案呈现和按钮由 App 自行绘制，注册后不显示或定位默认气泡，不套用默认高亮的圆角／边线样式；撤销注册后恢复默认高亮。React Portal／Vue Teleport 保留 App 上下文。

默认组件与自定义组件共用五参数接口，默认组件仅额外接收样式参数。默认多步引导在气泡内始终提供“上一步／下一步”两个按钮：首步禁用上一步，末步点下一步结束，不加独立悬浮按钮；自定义组件不受这些 UI 规则约束，只使用 `context.next(step = 1)` 按正负步长控制导览。

默认气泡保持无尖角矩形卡片，宽度随内容收缩并受可见区限制。`placement` 支持上下左右居中、左上／右上／左下／右下、上左／上右／下左／下右、四个方向的可见区自动、全自动和“无”；例如 `left-top` 是左侧顶边对齐，`top-left` 是上方左边对齐，`right-auto` 优先右侧并避让可见区边界，`none` 只隐藏气泡。固定方位优先保留请求的边和对齐方式，该侧放不下时自动翻到对侧；所有气泡最终都会收进可见区。`tipGap` 从高亮边框外侧起算，不会被高亮外扩吞掉。位置可通过单次高亮或各导览步骤配置。样式只提供边框色／宽、底色、字色、圆角等基础项，分别用 `tipBorderColor`、`tipBorderWidth`、`surfaceColor`、`textColor`、`radius` 设置。详见[组件接口与气泡位置](docs/state-and-interaction.md#app-registered-highlight-components)。

聚焦、滚动、命名目标、异步目标解析与自定义 renderer 共用实例上下文和取消机制。不需要默认覆盖层时，可从 `@jangts/router-plus/overlay` 导入 `installDomRuntime`，单独安装 DOM 能力。运行时注入的默认样式与可选的 `@jangts/router-plus/overlay.css` 来自同一来源。

## 公开入口与扩展

| 导入路径 | 用途 |
| --- | --- |
| `@jangts/router-plus` | Core 构造、页面合同、命令、插件和连接 |
| `@jangts/router-plus/react` | React 装配、Provider、hooks、链接、保留渲染和覆盖层 |
| `@jangts/router-plus/vue` | Vue 装配／插件、composables、链接、保留渲染和覆盖层 |
| `@jangts/router-plus/overlay` | 可选 DOM 运行时、默认 renderer 与原生历史桥接 |
| `@jangts/router-plus/stores/{redux,zustand,jotai}` | 按状态库拆分的创建与登记入口；使用时将花括号部分替换为具体库名 |
| `@jangts/router-plus/testing` | 无 DOM 的 RP fixture、内存连接、host 与 bridge 工具 |
| `@jangts/router-plus/testing/vue` | 基于 Vue Test Utils 的 RP 挂载与内存路由 |
| `@jangts/router-plus/testing/react` | 基于 React Testing Library 的 RP 渲染与内存路由 |

环境配置和批量用例见[消费端测试](docs/testing.md)。

应用可继续手写路由，也可选用 `createReactRoutes`／`createVueRoutes`。插件登记协议、action、守卫、实例身份与保留策略、目标解析器、renderer 和路由转换。页面目录只投影安全元数据，组件／布局映射仍由应用持有；业务路径策略和授权也由应用负责。

Core 可以在不加载框架或 DOM 的环境运行。SSR 每个请求创建独立实例，通过 `initialLocation`、`initialSnapshot` 与 `snapshot()` 提供一致的 hydration 初值。浏览器默认全局门面为 `__ROUTER_PLUS__`，设置 `globalKey: false` 可关闭；该门面用于调试，不构成权限边界。

## 参考文档与许可

以下详细参考使用英文；本 README 的中英文部分提供对应的安装、接入与能力说明。

- [在线文档](https://router-plus-docs.pages.jangts.cafe/zh/)：接入课程、API 参考与框架示例。
- [修改日志](CHANGELOG.md)：各版本的变更说明。
- [API 与连接](docs/api.md)：构造、目标、回执、守卫与插件。
- [框架接入](docs/frameworks.md)：JSX／数组／Data Router、Vue 安装、scope 和生命周期归属。
- [状态、SSR 与交互](docs/state-and-interaction.md)：状态桥接、持久化、快照、DOM 目标和导览。

Apache License 2.0，见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。

完整仪表盘、异步目录、业务请求、守卫与缓存路由接线见[应用完整接入](docs/application-integration.md)。
