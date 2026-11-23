# Native state bindings

Router Plus indexes native state and callable sources. React, Vue and the selected store remain the only live owners. Registration contains an ID, accessors, subscriptions and navigation rules; it is not a global store. History and SSR contain snapshots, not live copies.

## Native hooks and scope

React exports `useRpState`, `useRpRef`, `useRpContext` and `useRpCallback`. Vue exports `useRpRef`, `useRpReactiveState` and `useRpComputedState`. Native arguments and return values are retained, with one optional final `idOrOptions`. Omission calls the native API without registration or a Router Plus provider. A string is the registration ID. An options object requires `id` and can declare query binding, allowed values, validation and codecs. Initial values come from the native initializer, not a repeated configuration field.

Component IDs belong to the nearest page instance. Duplicate live IDs in the same scope are errors. External access uses `plus.getState(id)`, `plus.setState(value, id)`, `plus.callState(id, ...args)` and `plus.scope(context)` for a concrete page instance. Readonly context/computed sources reject writes; native callbacks retain their native calling behavior; store methods retain their store receiver. Components clean up their registration and dynamically declared query ownership automatically. Registration captures structural metadata such as ID, query ownership, defaults and value lists; changing that metadata requires re-registration. Callback rules observe their dependencies: Vue tracks reactive readiness/validation/codec reads, and React uses the latest committed callback implementations when those callback slots were supplied at registration. Changing the ID creates a new registration and captures that registration’s current native initial value as its fallback. Vue Options API uses these composables inside `setup()`; there is no component-wide bind/unbind API or extra component option.

Vue setup stores use the same composables and their effect-scope cleanup. Their IDs are router-wide; use names such as `filters/category` to distinguish stores. Shared store registrations are global to one Router Plus instance, not a process singleton. React store factories bind a native creator and a Router Plus instance once; the returned creator accepts the native arguments plus optional `idOrOptions`. Zustand, Redux Toolkit and Jotai adapters retain their native state/update/subscribe behavior. Store registrations last until the owning Router Plus instance is disposed; component unmounts do not dispose shared stores. Create a separate Router Plus and separate stores for each SSR request.

An ID alone indexes a source; it does not move that value into RP storage or opt it into history. `query` enables address synchronization. `PageDefinition.states` may separately describe stable navigation destinations before their native source mounts; it is an address schema, not a backing store.

## Existing sources

Use `useReactState(source, idOrOptions?)` or `useVueState(source, idOrOptions?)` when the native source already exists. Both return `void`, leave source identity intact, reuse the same rules as the creation hooks and automatically unregister. Without the optional argument they perform no registration and require no provider.

```tsx
import { useState, useRef } from 'react';
import { useReactState } from '@jangts/router-plus/react';
function Filters() {
  const state = useState({ category: 'all' });
  const input = useRef<HTMLInputElement>(null);
  useReactState(state, { id: 'filter', query: true });
  useReactState(input, 'input');
  useReactState({ get: () => state[0].category }, 'category');
  return <input ref={input} />;
}
```

React accepts a native `[value, setter]` tuple, ref-like object, callback, or `StateAccessor<S>` with `get()` and optional `set(next)`. A plain value uses an explicit getter; a function passed directly is callable, while `{ get: () => fn }` exposes a readonly function value. Tuple assignment supports function values. An accessor setter receives a complete value, so function-valued React state needs `set: next => setHandler(() => next)`. Accessor methods retain their receiver. Only committed render closures become externally visible; abandoned renders do not update registrations. Notifications for refs and accessors follow component commits, without polling or an invented external-store subscription. ID, owner or capability changes recreate registration. Structural rule changes require re-registration; initially supplied callback implementations use the latest committed React closures.

```ts
import { ref, reactive, computed } from 'vue';
import { useVueState } from '@jangts/router-plus/vue';
// Inside component setup() or a setup store:
const count = ref(0);
const filter = reactive({ category: 'all', tags: ['a'] });
useVueState(count, 'count');
useVueState(filter, { id: 'filter', query: true });
useVueState(computed(() => count.value * 2), 'doubled');
useVueState({ get: () => count.value, set: next => { count.value = next; } }, 'accessor');
```

For writable computed values whose setter cannot accept the read value, omit registration or use an explicit `get/set` accessor that adapts a complete value. Creation and existing-ref registration signatures reject this unsafe direct registration. Native computed setter/return types remain unchanged.

Vue accepts ref/computed, reactive Object/Array/Map/Set, readonly proxies, callbacks and accessors. Native source detection precedes accessor detection, so a reactive object's business `get` field is not mistaken for a getter. Container writes preserve proxy identity. Accessor watches track actual Vue reactive dependencies; plain external values gain no new notification mechanism. Component effect scopes own page registrations. Other effect scopes, including setup stores and nested scopes, own router-wide registrations and clean up on scope disposal. Readonly sources reject assignment and query restoration. Ordinary unproxied objects must use an accessor.

### Vue callable sources

Pass a function directly to expose a command through `plus.callState(id, ...args)`. Calls preserve synchronous return values, await promises and return the result in `CommandResult.value`; exceptions produce a failed receipt with the business message. A callback is readonly state, and cannot bind to query parameters. Register a receiver-dependent method with `method.bind(owner)` or a forwarding closure; Router Plus cannot infer a detached method's owner.

```ts
// Inside setup(): reuse the existing form operation and its result contract.
useVueState((fields: Record<string, unknown>, mode: 'merge' | 'overwrite') =>
  editor.applyPatch(fields, mode), 'campaign/applyPatch');
// External caller; this invokes the original operation, not a request/watch queue.
const result = await plus.callState('campaign/applyPatch', { name: 'Summer' }, 'merge');
if (result.ok) console.log(result.value); // original applied/conflicts result
```

A ref/computed whose value is a function when registered also exposes calls. Each invocation reads the latest function; replacing it with a non-function makes calls fail. Write capability still follows native readonly rules. A plain ref initially holding a non-function needs re-registration to gain call capability. `{ get: () => callback }` remains a readonly function value without invocation capability, matching React accessor semantics. Cleanup invalidates pending call results; it does not undo business effects already issued. Scope and global/setup-store calls use the same Core cancellation checks.

## Inspect installed capabilities

`plus.inspectState()` lists frozen metadata for the sources visible to the current facade: router-wide registrations and that page instance's installed sources. `plus.scope(context).inspectState()` describes that concrete instance, including retained inactive instances. `plus.inspectState(id)` accepts an exact registration ID and returns a descriptor or `null`.

```ts
const source = plus.inspectState('filters');
if (source?.capabilities.write) await plus.setState({ category: 'code' }, source.id);
const action = plus.inspectState('filters/setCategory');
if (action?.capabilities.call) await plus.callState(action.id, 'code');
```

A descriptor contains `id`, `scope: 'global' | 'page'`, `pageId`, `stateKey`, `parentId`, `capabilities: { read, write, call }` and `queryKeys`. Global descriptors have null page/instance identity. Store commands carry their explicit parent registration ID; arbitrary IDs containing slashes do not imply a relationship. Descriptors and their nested metadata are frozen snapshots, so query again after registration changes.

Inspection does not execute native getters, codecs, validation, setters or commands, and includes no live values or function references. Static `PageDefinition.states` declarations that have no mounted source are excluded. An object path such as `filters/category` is not an independently registered source and returns null, unless explicitly registered under that exact ID. Subscription setup cannot expose half an installing store group. Unregistration and disposal remove descriptors; a disposed facade lists no sources. The browser debugging facade does not expose this API.

Capability metadata describes installed adapter operations, not business authorization or a guarantee that an invocation will succeed. For example, a Jotai command can be callable but not assignable, and a callable Vue ref can fail if its current function has been removed.

## Query contract

For a scalar, `query: true` uses the registration ID, and a string chooses the parameter name. A plain object with `query: true` binds its own enumerable fields as a group; the registration ID is not inserted into the URL. `fields` selects fields and overrides their rules. A field can contain any JSON-compatible value; field codecs never recursively expand it. Whole-object query binding and field overrides share one parameter ownership table; duplicate ownership is rejected.

Default scalar encoding writes strings, finite numbers and booleans directly. Null, arrays and plain objects use JSON; undefined removes the owned parameter. Decoding follows the native initial value and validates the decoded type. Non-JSON values require explicit codecs. A single default-encoded value requires one parameter occurrence. A custom group encoder can produce repeated parameters.

A field `encode(value)` returns a string or undefined; `decode(raw)` receives that parameter's complete string and returns the complete field value. A group `encode(value)` returns `URLSearchParams` or a parameter record whose values are strings, string arrays or undefined. Group `decode(params)` receives only parameters owned by that binding. Declare `query: ['category', 'page', 'tags']` for custom group parameter names; ownership cannot be inferred from arbitrary functions. With `query: true`, group ownership derives from the initial object's keys and field overrides.

Updates remove all previous occurrences of owned parameters before writing the new values, preserving unrelated parameters and the hash. Empty arrays/undefined from a custom group encoder remove the owned parameter. A group encoder cannot write undeclared keys. Field rules may contain their own `encode/decode`, allowed values and validation; non-scalar fields default to JSON. Default and field codecs restore missing parameters to native initial values while preserving unbound object fields. Custom whole-group decoders define their own missing-parameter semantics. Enum and custom validation run after decoding and before writes.

Invalid explicit navigation is rejected. Invalid initial/traversed query values recover to initial values and produce diagnostics; encoder/decoder and source failures produce diagnostics with their original error. Query-bound sources must be writable; context values, readonly computed values, callbacks and DOM refs cannot bind to query parameters. React refs have no native subscription: external writes through RP are observed; direct `.current` reads are always current; change notifications require an owning-component render, without polling.

## Complete address bindings

A native binding is the live source. Declaring a `PageDefinition.states` entry makes the same navigation contract available before its component mounts. Binding that source by its ID inherits catalog rules, including the catalog default; it does not require a second query/enum/codec declaration. Explicit non-undefined binding rules override catalog rules, except the declared catalog default remains authoritative. Without a catalog declaration, the captured native initializer supplies the default. Business validators and codecs remain App-owned.

```ts
// Vue component setup: existing refs need no replacement.
import { ref } from 'vue';
import { useVueState, useRpReactiveState } from '@jangts/router-plus/vue';
const tab = ref('overview');
useVueState(tab, {
  id: 'tab', query: true, history: 'push',
  values: ['overview', 'products'],
});
const filters = useRpReactiveState(
  { keyword: '', page: 1, includeArchived: false, tags: [] as string[] },
  { id: 'filters', query: true, omitDefault: true },
);
// Bind tab.value and filters directly to controls; no route/state synchronization watches.
```

`history: 'replace' | 'push'` selects native-change history, defaulting to `replace`. Same-turn native changes in one page merge into one address commit; a batch containing a push binding pushes one entry. A later same-ID proposal supersedes the earlier proposal. A rejected proposal restores the committed address into its native sources. Application guards and their confirmation UI remain App-owned.

`omitDefault: true` removes bound parameters whose values equal the captured/declarative default. Object fields inherit this option and may override it individually. The default is false. Missing parameters restore defaults; `false`, `0`, empty strings, null and undefined remain distinct. Arrays/objects use the existing JSON encoding; business date/array formats use explicit codecs. Unbound object fields, unrelated parameters, hash and unrelated history state remain intact.

For root object sources (including Date, Map and Set), a custom decoder receives the owned `URLSearchParams` collection, even with a single named query parameter. Field decoders receive strings. For example, a root Date bound to `query: 'day'` uses `encode: date => date.toISOString()` and `decode: params => new Date(params.get('day') ?? fallbackISOString)`. Keep missing-parameter behavior explicit in whole-source decoders.

Declared defaults remain separate from instance registrations. Retained parameterized instances use their own readiness, validation and codec callbacks; an inactive instance does not lend its callbacks to another instance. Invalid native query selections restore the committed address value. Router-wide query sources also restore and write on paths outside the page catalog, while preserving unrelated URL parts.

### Asynchronous catalogs

Use a synchronous `ready` predicate with the existing binding when a validator/codec depends on data. Loading and failed loads should both return false; an empty successfully loaded catalog is a separate business case. Do not make the predicate fetch data or return a Promise.

```ts
// Vue component setup; these are application-owned loading results.
const loaded = ref(false);
const loadError = ref<Error | null>(null);
const allowedTabs = ref<string[]>([]);
const selection = ref('overview');
useVueState(selection, {
  id: 'tab', query: true, history: 'push',
  ready: () => loaded.value && !loadError.value,
  validate: value => allowedTabs.value.includes(String(value)),
});
// The App loads data and updates allowedTabs/loaded/loadError normally.
```

Vue tracks the readiness predicate and validation dependencies inside the library. React reevaluates callbacks using the latest committed render; use ordinary React state/store subscriptions for the loading results. In React, the corresponding binding is:

```tsx
import { useRpState } from '@jangts/router-plus/react';
function Filters({ loaded, loadError, allowedTabs }: {
  loaded: boolean; loadError: Error | null; allowedTabs: readonly string[];
}) {
  const [tab, setTab] = useRpState('overview', {
    id: 'tab', query: true, history: 'push',
    ready: () => loaded && !loadError,
    validate: value => allowedTabs.includes(String(value)),
  });
  return <select value={tab} onChange={event => setTab(event.target.value)}>
    {allowedTabs.map(value => <option key={value}>{value}</option>)}
  </select>;
}
```

Until ready, RP preserves the address and skips dependent restoration, validation and address writes. Explicit state commands return `not-ready`. Native initial values can be visible while restoration is pending; the App can use its own loading state to defer dependent controls. RP `whenReady()` waits for its current internal work and does not wait for business loading. Root and scoped readiness include in-progress global address restoration; global restorations serialize so an older asynchronous write cannot finish after the latest restoration. Navigation and traversal automatically restore the latest address after older asynchronous writes settle; applications do not need an extra readiness call to repair the value. A restoration error after native navigation commits returns a failed receipt with `committed: true`, including on an unlisted path.

Once ready, the latest address restores automatically. A native choice affecting owned address fields while pending wins over the old address; local-only edits preserve that address intent and their local values; unrelated query edits do not discard that choice. A newer address for this binding supersedes the pending choice. Invalid pending choices use normal address/default recovery. Revalidation observes validity and native address-projection changes when catalog dependencies change, including a changed codec lookup whose values remain valid. Keep the configured default valid for successful catalogs; RP does not invent an authorized fallback. Initial/traversed invalid query values retain the existing diagnostic-and-default behavior rather than silently rewriting the address. Unregistration and disposal stop pending restoration; no application synchronization watcher or readiness callback is required.

### Direct query editing

React `usePageQuery`'s setter and Vue `usePageQuery().setQuery` return the navigation receipt Promise. Functional edits use the latest committed address even when a caller retains an old setter. Same-turn edits are applied in order to one temporary projection and committed once; a non-functional input replaces the query, preserving the traditional setter meaning. Partial query patches preserve unrelated history payloads and non-query navigation state; an explicit state option overrides the history payload. Complete query setters retain ordinary navigation semantics. The last edit supplies navigation options. Functional edits arriving while a previous query navigation awaits a guard continue its uncommitted proposal; external committed navigation resets that baseline. Non-functional input and option containers are captured at submission. Updater callbacks are synchronous; thrown errors and Promise-returning inputs produce a failed receipt without clearing the URL. Arrays in object inputs create repeated parameters. Defaults apply only when the current query is empty, as before.

```ts
// React: const [, setQuery] = usePageQuery();
// Vue: const { setQuery } = usePageQuery();
const receipt = await setQuery(previous => {
  previous.set('keyword', 'coffee');
  previous.delete('page');
  return previous;
}, { replace: true });
if (!receipt.ok) { /* retain the actual navigation failure/blocked/cancelled receipt */ }
```

The library owns query merge/restore coordination. App filter structures, version ID lookup, data fetching, permissions, browser preferences and reader chapter/paragraph mapping remain business logic. Supplying an initializer derived from an App preference provides a fallback; an explicit valid URL still wins. No storage service is installed by the binding.


## Store creator setup

Bind fixed dependencies once, then create native stores with optional registration:

```ts
import { createStore } from 'zustand/vanilla';
import { createRouterPlus } from '@jangts/router-plus';
import { createRpZustand } from '@jangts/router-plus/stores/zustand';
const plus = createRouterPlus({ pages: [], globalKey: false });
const create = createRpZustand(plus, createStore);
const filters = create<{ category: string; setCategory(category: string): void }>()(set => ({ category: 'all', setCategory: category => set({ category }) }), 'filters');
await plus.setState('code', 'filters/category');
await plus.callState('filters/setCategory', 'all');
```

The native creation result is returned unchanged. Zustand data fields are read under the store ID and methods are indexed under `ID/method`; the native store's own `getState()` retains its full object. Redux creation prepares a reducer-backed writer unless a business `set(next)` adapter is supplied. Jotai creation supplies full-value assignment only for the default primitive constructor (one non-function native argument); custom/derived writable atoms expose native commands and require an explicit `set(next)` for full-value assignment.

## Existing stores

Application assembly can register existing stores directly. These functions require registration options and return one idempotent `stop()` for the main state, indexed actions, subscriptions and dynamic query ownership. `plus.dispose()` provides fallback cleanup. A failure rolls back the whole registration group. Stopping registration invalidates pending command/write results, including query-bound writes; an already committed navigation retains `committed: true` in its cancelled receipt. It does not dispose the native store or undo business effects already issued.

```ts
import { createStore } from 'zustand/vanilla';
import { registerZustandState } from '@jangts/router-plus/stores/zustand';
const filters = createStore(() => ({ category: 'all' }));
const stop = registerZustandState(plus, filters, {
  id: 'filters', query: true, fields: { category: { values: ['all', 'code'] } },
});
await plus.setState('code', 'filters/category');
stop();
```

Global Store IDs and field paths, such as `filters/category`, work through both the root instance and a live `plus.scope(context)` facade. Scoped key listings include global registration IDs. Concurrent patches and field writes compose against pending address values from the same committed address; external navigation retires older proposals; native non-query writes read and update inside a per-source serial queue. Resetting a Store field path restores that field from the captured root default while retaining other fields.

Zustand registration options infer only data fields; callable fields remain on the unchanged native store and are indexed as commands. Redux creation preserves reducer-map, slice, middleware, thunk and enhancer inference.

Zustand uses native merge writes for plain record roots to preserve actions. Root Map, Set, Date, array and primitive values remain complete native values and use replacement writes. Other class-instance roots are rejected before registration; adapt a plain record or provide an explicit accessor instead. Action names are fixed at registration: replacements of the same name use the latest function and native receiver; removed/non-callable actions fail, and newly added names require re-registration.

```ts
import { configureStore } from '@reduxjs/toolkit';
import { registerReduxState } from '@jangts/router-plus/stores/redux';
const store = configureStore({ reducer: (state = { count: 0 }, action) =>
  action.type === 'count/restore' ? { count: Number(action.payload) } : state });
const stopRedux = registerReduxState(plus, store, {
  id: 'counter', query: true,
  set: next => { store.dispatch({ type: 'count/restore', payload: next.count }); },
});
await plus.callState('counter/dispatch', { type: 'count/restore', payload: 3 });
stopRedux();
```

`registerReduxState` defaults to readonly state plus native `ID/dispatch`. `ReduxStateOptions<S>.set(next)` opts into assignment and query restoration using business actions. Registration does not replace reducers or invent an action. The creation wrapper can prepare a generated reducer/writer before store creation; supplying a business setter uses that setter directly.

```ts
import { atom, createStore } from 'jotai/vanilla';
import { registerJotaiState } from '@jangts/router-plus/stores/jotai';
const store = createStore();
const count = atom(0);
const stopAtom = registerJotaiState(plus, store, count, {
  id: 'count', query: true, set: next => { store.set(count, next); },
});
await plus.setState(3, 'count');
stopAtom();
```

Existing writable atoms expose `callState(id, ...args)` with native argument order and results. They do not implicitly support `setState`; `JotaiStateOptions<S>.set(next)` explicitly maps a complete value to native writes. This also applies to existing primitive atoms. Readonly atoms accept neither setters nor query restoration. Each registration uses only the supplied Jotai store, including for the same atom in different stores.

Vue Options API uses the same primitives in `setup()`:

```ts
import { defineComponent } from 'vue';
import { useRpRef } from '@jangts/router-plus/vue';
export default defineComponent({
  setup() {
    const count = useRpRef(0, 'count');
    return { count };
  },
});
```

## Examples

```tsx
const [filter, setFilter] = useRpState(
  { category: 'all', range: { from: 1, to: 10 }, draft: '' },
  { id: 'filter', fields: {
    category: { query: true, values: ['all', 'code'] },
    range: { query: true },
  } },
);
```

`category=code&range={"from":1,"to":10}` binds the selected fields; URL escaping is omitted above. `draft` stays local to the native source.

```ts
const filter = useRpReactiveState(
  { tags: ['a', 'b'], page: 1 },
  { id: 'filter', query: ['tags', 'p'],
    encode: value => ({ tags: value.tags, p: String(value.page) }),
    decode: query => ({ tags: query.getAll('tags'), page: Number(query.get('p') ?? 1) }),
  },
);
```

The custom encoder writes `tags=a&tags=b&p=1`. Vue reactive objects keep their original proxy identity when values are restored.

### Independent rule dependencies

For a binding depending on another native Store/Atom, provide `observe: notify => dependency.subscribe(notify)`. Plus subscribes once per registration, rereads readiness/validation/codec rules on notification and releases the subscription with the binding. The callback does not publish application values or run a loading operation. Keep readiness synchronous; use application-owned subscriptions rather than polling or re-registering the source. See the complete [independent catalog example](application-integration.md#a-catalog-in-a-separate-native-store).

## 中文设计要点

- React 保持原生参数和返回值，只追加可选 ID／配置；不传登记参数时不订阅 RP，也不要求 Provider。Vue 组件和 setup store 使用同一套 composables，Options API 在 `setup()` 中调用。
- 当前值始终由原状态源持有。RP 只保存访问索引、初值与导航快照；组件按页面实例隔离，Vue store 的 ID 在一个 Router Plus 实例内唯一，可写成 `filters/category`。
- 对象整组 `query: true` 展开一层；`fields` 选择或覆盖字段。字段本身可以是对象或数组，默认 JSON；字段 codec 接收整个字段，不递归拆分。
- 整组 `encode` 返回参数对象或 `URLSearchParams`，对象中的数组值表示重复参数；`decode` 接收只含本绑定参数的 `URLSearchParams`。字段 `encode/decode` 则转换一个完整字段和一个字符串。
- 自定义整组参数名通过 `query: ['tags', 'p']` 声明；更新先删除本绑定旧参数再写新参数，保留其他 QS 与 hash。默认与字段级解码在缺参时恢复原生初值；自定义整组解码自行定义缺参语义。
- 只读 context、只读 computed 和派生 atom 拒绝外部写入。callbacks 与 DOM ref 不绑定 QS。配置按登记生命周期固定，改变 ID 会重建登记；卸载会清理来源与动态参数归属。
- 创建时使用 `useRp*`；已有来源使用 `useReactState`／`useVueState`，返回 void，复用同一登记与自动清理机制。React 只发布已提交闭包；Vue 访问器按实际响应式依赖通知。
- 已有 Store 使用 `registerZustandState`、`registerReduxState`、`registerJotaiState`，返回聚合且幂等的 stop；RP dispose 兜底，登记失败整组回滚。共享 store 不随页面卸载注销。
- Zustand 普通对象根状态采用 merge 保留动作，Map／Set／Date／数组／基础值采用原生完整替换，其他类实例根状态在登记前拒绝；动作名按登记时固定，同名替换取最新，新增动作需重新登记。已有 Redux 默认只读并提供 `ID/dispatch`，配置 `set(next)` 才可赋值或恢复 QS；登记不替换 reducer。
- Jotai writable atom 的原生命令调用与完整值赋值分开：已有 atom 需显式 `set(next)` 才支持 setState／QS；创建器仅对确定的默认 primitive 初值构造提供赋值适配，自定义 write 不自动开放赋值。


## 声明式地址绑定

已有 ref/原生状态直接通过 useVueState/useReactState 登记；useRp* 继续保留原生返回值。只按 ID 登记时继承页面 states 的 query、枚举、codec 和默认值，显式绑定规则可覆盖其他已声明项；没有页面声明时以原生初值作为默认。不需要两份实时状态、双向 watch 或防循环锁。

- history 默认为 replace，可声明 push。同页同一轮原生变化合并提交，含 push 的批次只新增一条历史；同 ID 后来的提案覆盖前项。守卫拒绝后恢复已提交地址对应的状态。
- omitDefault 默认 false；启用后省略等于默认值的参数，对象字段可单独覆盖。false、0、空串、null、undefined 和缺参分别处理，其他 query、hash 与无关历史状态保留。
- ready 是同步就绪函数，不负责加载。未加载和加载失败均可保持 false，保留地址意图；空目录的含义、合法缺省与权限由应用定义。Vue 由库跟踪依赖；React 在组件提交后读取最新回调，加载结果仍使用普通 React 状态或 Store 订阅。
- 就绪后自动恢复最新地址。等待期间的原生选择优先于旧地址；其他参数变化不会抹掉选择，当前绑定的新地址可取代它。无效选择按原有地址／默认值恢复。目录依赖变化会重新检查有效性；卸载与销毁后不再恢复。
- 等待期间显式状态命令返回 not-ready；控件可能暂时显示原生初值，应用可依已有加载态延后展示。whenReady 只等待 RP 内部任务，不替应用等待业务加载。
- usePageQuery 的写入口返回真实回执 Promise；函数式修改读取最新提交地址，同轮修改顺序合并后提交一次，非函数输入仍替换整组 query。最后一次修改决定导航参数；对象数组值保留重复参数。

上方 Complete address bindings 提供 Vue、React、异步目录与直接 query 编辑示例。页面业务结构、版本映射、阅读位置、数据加载与授权规则仍归应用。



### 独立规则依赖

依赖独立 Store／Atom 目录时，用 observe 登记通知订阅，返回清理函数；通知仅触发重读规则。订阅与来源登记同生命周期，ready 仍是纯同步判定，业务加载保持在应用。
