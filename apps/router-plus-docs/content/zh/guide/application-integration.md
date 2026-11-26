# 应用完整接入

原生路由器持有路由，原生状态持有实时值，Router Plus 负责地址同步和实例保留。业务请求、权限、确认界面和业务值映射由应用持有。

## Vue 仪表盘：接线、Tab 与筛选

入口安装路由器与 Plus，页面直接登记原生值。以下接线包含控件、历史策略、默认值省略与页码校验：

```ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createVueRouterPlus, RouterPlusView, useRpRef,
  useRpReactiveState } from '@jangts/router-plus/vue';

const Dashboard = defineComponent({
  setup() {
    const tab = useRpRef('summary', {
      id: 'tab', query: true, history: 'push', values: ['summary', 'products'],
    });
    const filters = useRpReactiveState({ keyword: '', page: 1 }, {
      id: 'filters', query: true, omitDefault: true,
      fields: { page: { validate: value => Number.isInteger(value) && Number(value) > 0 } },
    });
    return () => h('section', [
      h('button', { onClick: () => { tab.value = 'products'; } }, 'Products'),
      h('input', { value: filters.keyword, onInput: (event: Event) => {
        filters.keyword = (event.target as HTMLInputElement).value;
        filters.page = 1;
      } }),
      h('p', `${tab.value}: ${filters.keyword} / ${filters.page}`),
    ]);
  },
});
const router = createRouter({ history: createWebHistory(),
  routes: [{ path: '/dashboard', component: Dashboard }] });
const plus = createVueRouterPlus({ router,
  pages: [{ path: '/dashboard', title: 'Dashboard', retain: true }], globalKey: false });
createApp({ render: () => h(RouterPlusView) }).use(plus).mount('#app');
```

/dashboard?tab=products&keyword=coffee&page=2 会恢复到原生值。同一轮修改关键词并重置页码只提交一次地址更新；其他 query 与 hash 保留。页面目录已声明 states 时，页面按 ID 登记即可继承合同，避免重复维护默认值、枚举和 codec。

## 局部参数更新与删除

只修改部分 query 时使用 patchQuery；未提及的键和 hash 保留。undefined 删除参数，空串保留空值，空数组清空该键，数组保留重复参数。没有有效变化时返回标准 noop 回执。patch 只修改实际 URL，不把 usePageQuery(defaultInit) 的读取回退写入地址。

```ts
import type { RouterPlus } from '@jangts/router-plus';
async function applyFilters(plus: RouterPlus) {
  return plus.patchQuery({ keyword: 'coffee', page: undefined, tags: ['hot', 'new'] },
    { replace: true });
}
```

React 使用 usePageQuery 返回的 setQuery.patch(record, options)，Vue 使用 usePageQuery().patchQuery(record, options)。命令序列使用同一操作：plus.execute([{ kind: 'query.patch', patch: { page: undefined }, options: { replace: true } }])。原 setter 继续表示完整替换；函数式 setter 可返回字符串、URLSearchParams、键值对或带数组值的参数对象。业务反馈保留真实回执。

## 异步版本目录

在页面 setup 中使用业务就绪条件，替代加载期间的回写锁和反复注册。版本目录仍由应用正常加载；成功为空与请求失败分别表达。

```ts
// Inside component setup; the entry above already provides Plus.
import { ref } from 'vue';
import { useVueState } from '@jangts/router-plus/vue';
const loaded = ref(false);
const loadError = ref<Error | null>(null);
const versions = ref<Array<{ id: string; label: string }>>([]);
const selected = ref('current');
useVueState(selected, {
  id: 'version', query: 'version', ready: () => loaded.value && !loadError.value,
  validate: value => value === 'current' || versions.value.some(item => item.id === value),
  encode: id => id === 'current' ? undefined : versions.value.find(item => item.id === id)?.label,
  decode: raw => versions.value.find(item => item.label === raw)?.id ?? 'current',
});
// Your loader assigns versions, then loaded; on failure it assigns loadError.
```

版本 ID/展示编号映射、请求、权限过滤、合法默认值及失败界面属于业务。等待期间 URL 保留；就绪后恢复最新地址，等待期间有效的原生地址字段选择可覆盖旧意图。whenReady 不负责加载业务目录。

## 目录位于独立 Store／Atom

绑定读取的就绪、校验或 codec 数据位于另一个原生 Store／Atom 时，用 observe: notify => catalog.subscribe(notify) 订阅依赖。notify 仅通知库重读规则，不复制目录也不加载数据；返回的取消订阅归登记生命周期管理。ready 继续保持纯同步判定。目录变化时，即使筛选 Store 未改变，也能自动重验和恢复。

结构配置和依赖订阅在一次登记期间固定；更换 ID／依赖来源需重新登记。应用正常加载与更新目录，并保留失败、空目录的业务语义；登记结束时调用 registerZustandState 返回的 stop。

```ts
import type { RouterPlus } from '@jangts/router-plus';
import { createStore } from 'zustand/vanilla';
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
function bindVersionFilters(plus: RouterPlus) {
  const catalog = createStore<{ loaded: boolean; versions: Array<{ id: string; label: string }> }>(
    () => ({ loaded: false, versions: [] }));
  const filters = createStore(() => ({ version: 'current' }));
  const stop = registerZustandState(plus, filters, {
    id: 'filters', ready: () => catalog.getState().loaded,
    observe: notify => catalog.subscribe(notify),
    fields: { version: {
      query: 'version',
      validate: value => value === 'current' || catalog.getState().versions.some(item => item.id === value),
      encode: id => id === 'current' ? undefined : catalog.getState().versions.find(item => item.id === id)?.label,
      decode: raw => catalog.getState().versions.find(item => item.label === raw)?.id ?? 'current',
    } },
  });
  return { catalog, filters, stop };
}
```

## 首次与后续路由共用一条业务请求路径

用一个 immediate watcher 消费路径输入并取消过期请求；它负责加载数据，不负责镜像 URL。不要再为同一输入增加 onMounted 请求。

```ts
// Inside component setup.
import { ref, watch } from 'vue';
import { usePageContext } from '@jangts/router-plus/vue';
const context = usePageContext();
const detail = ref<unknown>(null);
const detailError = ref<Error | null>(null);
watch(() => context.value.params.id, (id, _previous, cleanup) => {
  const abort = new AbortController();
  cleanup(() => abort.abort());
  detail.value = null;
  detailError.value = null;
  if (!id) return;
  void fetch(`/api/items/${encodeURIComponent(id)}`, { signal: abort.signal })
    .then(response => {
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .then(value => { if (!abort.signal.aborted) detail.value = value; })
    .catch(error => { if (!abort.signal.aborted) detailError.value = error as Error; });
}, { immediate: true });
```

保留页隐藏时持有自己的冻结路由，不消费其他页的参数。以相同参数重新激活不意味着重新请求；按需刷新及后台工作暂停由应用／宿主决定。依赖目录的业务请求还需观察业务加载条件，未就绪时跳过，阻止过期结果发布。

## 守卫与真实回执

Vue Router 连接安装原生跳转守卫。createReactRouterPlus 装配的 Data Router 在原生版本具备 blocker API 时提供对应接入；Data Router 构造与 blocker 是不同的原生能力。低层 React Provider 需要显式传入该路由模式支持的 useBlocker。无原生拦截的声明式 React 路由可检查 Plus 发起的导航，但单纯观察地址不能拦住原生 Link／后退。

```ts
// Vue component setup: the application owns the dirty fact and confirmation UI.
import { ref } from 'vue';
import { usePageLeaveGuard, useRouterPlus } from '@jangts/router-plus/vue';
const dirty = ref(false);
usePageLeaveGuard({ id: 'unsaved-editor',
  beforeLeave: () => !dirty.value || window.confirm('Discard unsaved changes?') });
const plus = useRouterPlus();
async function closeEditor() {
  const receipt = await plus.navigate('/dashboard');
  if (!receipt.ok && receipt.reason !== 'noop') {
    // Use receipt.reason/committed for the application's feedback policy.
    return receipt;
  }
  return receipt;
}
```

业务持有 dirty 与确认界面。committed: true 表示地址副作用已经发生，与尚未提交就被拒绝不同；应用分类状态时保留原始回执。权限、已知目标白名单、保存／放弃策略属于业务。

## React 保留路由：库持有缓存

本例使用原生 Data Router API，需要 React Router DOM >=6.4。6.0–6.3 应用继续使用声明式 BrowserRouter／MemoryRouter 路由与低层 Provider 连接，这些版本没有 Data Router 构造 API。包的 React Router >=6 peer 要求继续支持这类声明式接入。

<!-- requires: react-router-data-router -->

```tsx
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router-dom';
import { createReactRouterPlus, RouterPlusOutlet, useRpState } from '@jangts/router-plus/react';
function List() {
  const [keyword, setKeyword] = useRpState('', { id: 'keyword', query: true, omitDefault: true });
  return <input value={keyword} onChange={event => setKeyword(event.target.value)} />;
}
function Detail() { return <p>Detail</p>; }
const router = createBrowserRouter([{ element: <RouterPlusOutlet />, children: [
  { path: '/items', element: <List /> }, { path: '/items/:id', element: <Detail /> },
] }]);
const plus = createReactRouterPlus({ router, globalKey: false, disposeOnUnmount: true,
  pages: [{ path: '/items', title: 'Items', retain: true },
    { path: '/items/:id', title: 'Detail', retain: { max: 3 } }] });
createRoot(document.getElementById('root')!).render(<plus.Provider />);
```

访问集合、冻结 location/context、淘汰、release 后代际重建由库负责。原生路由树、页面壳、滚动容器和外观由应用负责。支持 Activity 的 React 可通过 host 选择显示机制；React 18 使用默认宿主。plus.release() 重建实例。工厂自行创建的 Core 可用 disposeOnUnmount 管理最终卸载，外部 Core 仍归调用方。

## 应用封装裁切清单

| 应用里的机械封装 | 公共接入 | 业务继续保留 |
| --- | --- | --- |
| Tab/query 初读、buildQuery、双向同步 watch、JSON 防回环 | 原生绑定 query/fields/history/omitDefault | Tab 与筛选结构、合法值 |
| 加载期间禁止回写、目录完成后地址恢复 | ready 与 codec/validator | 加载请求、编号映射、合法回退与失败界面 |
| 逐键 query 合并、删除及 hash 保留 | usePageQuery 函数更新或绑定原生值 | 修改哪些参数、push/replace 策略 |
| 同一请求的 onMounted 与参数 watch 两套入口 | 单一 immediate watcher/effect 与 cleanup | 请求、取消、错误状态、结果映射 |
| visits、冻结上下文、release 订阅与 generation | RouterPlusOutlet/RouterPlusView 与 retain | 页面布局、滚动与 Activity 展示 |
| StrictMode 延迟销毁保护 | 工厂 owned Core 的 disposeOnUnmount | 应用 HMR 与原生 router 销毁 |
| 通用目标拆分与安全 URL 处理 | resolveLink/navigate、page+params、origin | 权限、白名单、站内协议与旧历史迁移 |

逐个消费者按完整场景裁切；业务 watch 不因减少 watch 数量而删除。公共库负责的机制应只有一个所有者。

## 展示宿主与文档导航

React/Vue RouterPlusLink 支持 disabled 与 reloadDocument。disabled 移除页面／外链 href 与键盘顺序焦点，并阻止点击；动作目标保留原生 button 禁用。reloadDocument 将页面 href 交给浏览器完成文档导航。业务授权仍在业务边界校验。

Vue RouterPlusView 与 RouterPlusRetained 接受 host 组件，组件接收 active prop 与默认 slot，仅控制展示；库负责缓存身份、冻结上下文和 release。普通保留页可直接使用默认 hidden-div 宿主。
