# Framework integration and instance lifecycle

## React

Assemble a JSX router in the application and render the returned instance's stable Provider:

```tsx
import { BrowserRouter } from 'react-router-dom';
import { createReactRouterPlus } from '@jangts/router-plus/react';

const plus = createReactRouterPlus({
  router: <BrowserRouter basename="/" />,
  pages,
  plugins,
});

root.render(<plus.Provider><App /></plus.Provider>);
```

Plain JavaScript and TypeScript can pass a constructor tuple without JSX:

```ts
const plus = createReactRouterPlus({
  router: [BrowserRouter, { basename: '/' }],
  pages,
  plugins,
});
```

Plus creates the router element internally. Props are inferred from the selected component; required props stay required. When all props are optional, `[BrowserRouter]` is sufficient. JSX and explicit `createElement(BrowserRouter, props)` remain equivalent inputs. A separate `{ component, props }` shorthand is not supported.

JSX props are preserved. The router element's existing children and Provider children are placed inside the Plus context. The element must provide React Router's native location/navigation context; BrowserRouter, HashRouter and MemoryRouter are supported. For JSX and tuple inputs, an optional `hooks` option adapts those hooks, for example to read an application's older history state.

A Data Router instance uses its original route tree:

```tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, plugins });
root.render(<plus.Provider />);
```

Data Router content belongs in its route records; Provider children are rejected rather than silently discarded. Native route loaders, redirects and blockers remain available. Plus subscribes to the supplied router and never disposes it. Unmounting Provider disconnects Plus and cancels pending receipts; the instance owner calls `plus.dispose()` at the end of its lifetime. Keep the assembled instance stable across renders, using module scope or a state initializer. Mount one Provider per instance.

Both factories also accept `{ plus, router }` to assemble an existing Core instance instead of supplying `pages` and other Core creation options. React and Vue peers remain optional and separate: importing the React entry does not load Vue. Shared peer resolution is still required; assembly does not resolve duplicate router package copies.

For an application that already mounts its native router, keep the low-level hooks-based connection:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { createReactProvider, RouterPlusOutlet } from '@jangts/router-plus/react';

const Provider = createReactProvider({ useLocation, useNavigate });

function Layout() {
  return <Provider plus={plus}><RouterPlusOutlet /></Provider>;
}
```

The Provider connects locations and navigation. It does not replace the router or automatically mount an overlay. For router modes supporting `useBlocker`, include that hook in `createReactProvider` to enable native pre-navigation guards. Ordinary declarative routers can continue to use observation and Plus-initiated guards; a custom connection can supply additional capabilities.

`RouterPlusOutlet` caches visited retained instances, freezes native location context and removes released instances. With explicit children it leaves rendering ownership to the caller. Hand-written route trees and `createReactRoutes` use the same instance rules. The cached Outlet uses React Router's exported location context; peer-version integration tests cover that binding.

`RouterPlusScope` binds only context and adds no DOM or lifecycle behavior, for caller-owned hosts. `RouterPlusBoundary` binds children to an explicit `context` or the current instance and registers its DOM host. `RouterPlusRetained` keeps a subtree mounted while hidden, using its last active context. For full control use `plus.scope(context)` and `registerHost` instead. Hidden mounted trees keep their own effects; applications can use host activation hooks to pause expensive subscriptions, or provide an Activity-based host.

Provider native references and retained-view caches publish committed render candidates; abandoned renders do not replace the last committed retained context.

Hooks include useRouterPlus, usePageContext, usePageMatch, usePageQuery, usePageLeaveGuard, useHighlight and useTour. Native state is created with `useRpState`, `useRpRef`, `useRpContext` and `useRpCallback`; each accepts an optional final ID/options. Nearest boundaries own component registrations. Registration does not change native return values or require a provider when omitted. Hook cleanup unregisters automatically. `useReactState(source, idOrOptions?)` indexes an existing tuple, ref, callback or accessor through the same mechanism, returns `void` and only publishes committed render sources.

Vue exposes `useRpRef`, `useRpReactiveState` and `useRpComputedState`. `useVueState(source, idOrOptions?)` indexes an existing ref/computed, reactive/readonly container, callback or accessor and returns `void`. Callbacks and initially function-valued refs expose `callState` with native arguments and awaited results; bind receiver-dependent methods before registration. Component bindings follow their component scope; setup-store bindings follow their store effect scope. Options API components use `setup()` and return their native bindings. There is no component-wide bind/unbind or extra Options API schema.

The complete identity, query, readonly and creator contracts are in [Native state bindings](state-bindings.md).

## Vue

```ts
import { createVueRouterPlus } from '@jangts/router-plus/vue';

const plus = createVueRouterPlus({ router, pages, plugins });
app.use(plus);
app.mount('#app');

// The same instance exposes the Core API.
await plus.navigate('/alpha');
```

The returned instance is a Vue plugin and exposes the Core API directly. It installs the supplied native router through Vue's plugin deduplication, then provides and connects Plus. Native routers created by the App retain their ownership; structural connections without an install method remain supported. `{ plus, router }` reuses an App-owned Core instance, available through the compatibility `plus.plus` reference as well. App unmount disconnects and removes adapter subscriptions; a Core created by the factory is also disposed, while an externally supplied Core is only disconnected.

The plugin connects Vue Router, registers native guards when supported and cleans up on app unmount. Vue NavigationFailure values are mapped to blocked/cancelled/noop; failed afterEach notifications do not publish a target location. Same-address state/Tab updates use forced navigation so history state can change without an address change.

`RouterPlusView` wraps RouterView and caches instances according to Core retention decisions. Frozen scope providers preserve both Plus hooks and native useRoute values. It accepts an optional explicit view component and a cache option. `RouterPlusBoundary` and `RouterPlusRetained` can be used independently in hand-written views. Custom hosts, including KeepAlive-based compositions, use the same registration API.

Vue exposes matching composables, Link, Redirect and Overlay components. Framework-native presentation mechanisms may differ, while command results, state ownership, scope isolation and retention decisions follow the same core contract.

## Scope and host ownership

`plus.scope(context)` returns a stable instance-bound facade. Its context follows that instance while active and remains frozen while inactive. State writes, bridge/target/guard registration and host mounting stay bound after asynchronous work or navigation. Releasing an instance invalidates its existing facade; reacquiring the same key creates a new lifetime.

Scoped navigation uses that scope as the source for leave guards and navigation events, including when the scope is retained but hidden. `navigate`, `replace`, command execution and `setTab` use the same source contract. The destination is still committed through the connected router; the active router context is not temporarily replaced while evaluating guards. Root-instance navigation uses the active page as its source.

`registerHost` accepts optional mount, activate, deactivate, dispose, ready and root methods. Lifecycle work is serialized per host. A bridge snapshot is restored before host activation. Root is used to limit DOM target resolution. Unregister and instance release do not dispose the same host twice.

Page id, instance key, state key and history entry identity are separate. Instance keys default to pathname, and can use page identity, selected parameters or a custom function. Retention max counts the active instance and evicts least recently visited inactive instances. `release()` rebuilds state for the active address rather than leaving it attached to disposed storage.

Generators accept component/layout maps, wrap callbacks and optional route transforms. They return nested native-compatible records; callers still own layout components, suspense/loading behavior and route file organization. Native framework APIs and partial adoption remain supported.

## Overlay configuration

React and Vue `RouterPlusOverlay` share App-owned `theme` and `className` options. The renderer defaults to a high stacking level of 10000. Set `theme.zIndex` to a fixed value or `{ min?, max? }` to bound that default according to the App's layer policy; equivalent CSS variables are available. Radius, border color/width, mask, target padding and tooltip appearance accept theme fields and CSS variables. Appearance updates preserve the active renderer and interaction state. `injectStyles: false` leaves stylesheet installation to the App. See [overlay theme fields and CSS precedence](state-and-interaction.md#app-owned-overlay-layer-and-appearance).

Apps register a highlight-only native component with `highlightComponent`. React uses a Portal and Vue uses Teleport to preserve App context. The component receives `width`, `height`, `left`, `top` and typed `context`; Plus owns the outer measured box and shared overlay layer. Default highlight styling does not decorate App content; App components own their bubbles and controls, and the default bubble is hidden in custom mode. Removing the component restores the default visual. See [component contracts](state-and-interaction.md#app-registered-highlight-components).

The default bubble supports centered sides, side/corner alignments, viewport-aware side preferences and `none`, via `HighlightOptions.placement` or a tour step's `placement`. It stays a rectangular card with basic border, background, text and radius styling, without a pointer. See [placement meanings](state-and-interaction.md#default-bubble-placement-and-basic-style).

Default and custom highlight content share `HighlightComponentProps`; the default component alone receives `DefaultHighlightComponentProps.styles`. Their context exposes `next(step = 1)`, accepting negative steps for backward movement. The default bubble contains exactly 上一步／下一步, disabling the first at the beginning and finishing on forward movement past the last step. These UI rules apply only to the default component; App-owned components may choose any presentation and controls.

## Hot module replacement

Pass the owning module's hot object as `hmr` when creating Core, React or Vue instances. No bundler dependency is added. RP registers disposal only: it does not call `accept()`, install a development server, or dispose the application's native router. Let the framework/entry boundary remount consumers with the new instance; do not self-accept an instance module while consumers still hold its disposed exports. HMR recreates the instance with current configuration; it does not preserve in-memory page state automatically.

| Tool | Configuration value |
| --- | --- |
| Vite | `import.meta.hot` |
| Webpack 5 | `import.meta.webpackHot` (ESM) or `module.hot` |
| Rspack / Rsbuild | `import.meta.webpackHot` (ESM) or `module.hot` |
| Parcel | `module.hot` |
| Other HMR runtimes | An object implementing `dispose(callback)` |
| Rollup / esbuild without an HMR runtime | Omit `hmr`; watch/rebuild alone is not HMR |

```ts
// Vite: put this in the module that owns the RP instance.
import { createRouterPlus } from '@jangts/router-plus';
export const plus = createRouterPlus({
  pages: [{ path: '/', title: 'Home' }],
  hmr: import.meta.hot,
});
```

```ts
// Webpack 5 / Rspack / Rsbuild, in the instance-owning ESM module:
export const plus = createRouterPlus({
  pages: [{ path: '/', title: 'Home' }],
  hmr: import.meta.webpackHot,
});
// For Webpack/Rspack CommonJS or Parcel, use:
// hmr: typeof module !== 'undefined' ? module.hot : undefined
```

The same option is accepted by `createReactRouterPlus` and by `createVueRouterPlus` when the adapter creates Core. With an externally supplied `plus`, configure `hmr` on Core and dispose the adapter connection at the owning application's HMR boundary. Use the bundler's client types for `import.meta.hot`, `import.meta.webpackHot` or `module.hot`; RP exports the structural `RouterPlusHotModule` type without extending global host types.

Before asynchronous cleanup, disposal releases RP's exact global facade and disconnects navigation. Delayed old cleanup cannot remove a replacement instance or a foreign facade. Vue connection disposal is idempotent across HMR, app unmount and explicit disposal. It attempts every cleanup even if a native unsubscribe throws; adapter failures are reported through `onDiagnostic` at `hmr.dispose` during HMR and `vue.dispose` otherwise. Diagnostic callback failures do not interrupt cleanup. Cleanup failures are reported through `onDiagnostic(error, 'hmr.dispose')`. Production or non-HMR hosts pass `undefined`/`false`. A collision without a matching disposal remains an error; independent applications must use distinct `globalKey` values. See [Vite](https://vite.dev/guide/api-hmr.html), [Webpack](https://webpack.js.org/api/hot-module-replacement/), [Rspack](https://rspack.dev/api/runtime-api/hmr), and [Parcel](https://parceljs.org/features/development/).

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
