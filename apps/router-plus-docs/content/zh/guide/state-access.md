# 状态访问与命令编组

原生组件或状态库先登记 ID，外部入口再按 ID 读写或调用。以下 `plus` 是已经连接的 Router Plus 实例。

## 读写与调用

```ts
const section = plus.getState<string>('section');
await plus.setState('details', 'section');
await plus.patchState({ name: 'Summer' }, 'customerForm');
const submitted = await plus.callState('submitCustomer');
if (!submitted.ok) console.error(submitted.reason);
```

`setState(value, id)` 是完整值赋值，`patchState(value, id)` 合并对象，`resetState(id)` 使用登记初值。只读来源返回 state-readonly；未知来源、缺少能力与业务调用失败分别在回执中表达。业务自身仍负责验证与权限。

React 用 `useRpCallback`／`useReactState(callback, id)`，Vue 用 `useVueState(callback, id)` 暴露调用。`callState` 转发原参数并等待原结果；依赖 receiver 的方法先 bind 或包一层转发闭包。getter-only 访问器只提供值，不自动提供调用能力。

## 查询已登记能力

```ts
const source = plus.inspectState('section');
if (source?.capabilities.write) await plus.setState('details', source.id);
const installed = plus.inspectState();
```

查询读取现有登记元数据，不读取实时值、不执行 getter／codec。只列当前门面可见的全局及页面来源，未知 ID、未挂载声明和任意字段路径返回 null。`scope(context)` 选择保留实例。能力不是业务授权，全局调试门面不暴露 inspectState。

## 等待挂载并顺序执行

```ts
const result = await plus.execute([
  { kind: 'navigate', target: '/customers/42' },
  { kind: 'state.set', key: 'editPanel', value: true },
  { kind: 'state.patch', key: 'customerForm', value: { name: 'Summer' } },
  { kind: 'state.call', id: 'submitCustomer' },
], { timeoutMs: 10000 });

if (!result.ok) console.error(result.failedIndex, result.reason, result.results);
```

应用分别登记 editPanel、条件挂载的 customerForm 和 submitCustomer。RP 不预设 Panel／Form 模型；编组依次等待指定来源的登记、恢复和框架提交。默认整组超时 10000ms，可传 timeoutMs 与 AbortSignal。

失败、超时、取消、离开实例或执行中来源替换会停止后续步骤，保留已完成 results 和 failedIndex；不自动重试、回滚或重放业务操作。取消也不会撤销已经发出的业务副作用。

`ready` 等初始安装；`whenReady()` 等已登记来源和宿主恢复，不等待未来组件，也不代表业务数据加载完成。依赖异步目录的地址绑定使用绑定配置的 ready 函数，库观察框架变化并自动恢复最新地址；业务加载仍由应用完成。

## 来源事件

```ts
const stop = plus.subscribe(event => {
  if (event.type === 'state.registered') console.log(event.source.id);
  if (event.type === 'disposed') console.log('Router disposed');
});
// End observation when its owner ends:
stop();
```

`state.registered`、`state.unregistered` 与 `state.committed` 描述来源生命周期；完整登记组成功后才发布。`state.committed` 描述适配层提交，不表示应用所有异步业务完成。
