# SSR 与测试

Core 不在导入时访问 DOM，也不加载框架依赖。SSR 每个请求创建独立 Router Plus 与原生 Store，不能把模块级可变实例复用于不同用户。

## 初始地址与快照

```ts
import { createRouterPlus } from '@jangts/router-plus';

const plus = createRouterPlus({
  pages: [{ path: '/orders/:id', title: 'Order' }],
  initialLocation: { pathname: '/orders/42', search: '', hash: '' },
  globalKey: false,
});
await plus.whenReady();
const snapshot = await plus.snapshot();
await plus.dispose();
```

客户端可用相同页面目录和 initialSnapshot 初始化地址与 RP 支持的快照数据。应用继续使用原状态库的 SSR 序列化／恢复，组件原生初值需与服务端一致；登记 ID 不等于 RP 自动持久化原生值。把快照写入 HTML 时由应用安全转义，不将用户输入直接拼成脚本。

## 内存连接测试

```ts
import assert from 'node:assert/strict';
import { createRouterPlus } from '@jangts/router-plus';
import { createMemoryConnection } from '@jangts/router-plus/testing';

const plus = createRouterPlus({
  pages: [{ path: '/orders/:id', title: 'Order' }],
  globalKey: false,
});
const disconnect = plus.connect(createMemoryConnection({
  initial: { pathname: '/orders/1' },
}));
try {
  const result = await plus.navigate('/orders/42');
  assert.equal(result.ok, true);
  assert.equal(plus.getContext().params.id, '42');
} finally {
  disconnect();
  await plus.dispose();
}
```

用真实 Hook／原生 Store 登记入口检查值、回调结果和清理。createMemoryHost 与 createFakeBridge 服务于隔离的宿主／连接合同测试，不是应用日常状态接入入口。

内存测试证明相应合同，不证明浏览器历史、CSS 布局或真实构建工具 HMR 已运行。框架集成需在应用中核对原生路由提交、条件挂载与来源注销。

## 生命周期与诊断

Core `dispose()` 同步释放自身全局门面并断开导航，等待异步资源清理；重复及重入销毁共用完成 Promise。销毁后的状态修改与保留操作返回取消。Vue 连接在热更新、卸载及手动销毁之间保持幂等；旧适配器的卸载不会断开替换连接。

`onDiagnostic(error, stage)` 接收技术诊断；诊断回调异常不会替代主结果或中断已隔离的清理。业务错误展示由应用根据回执决定。HMR 配置与宿主所有权见[接入与生命周期](getting-started#热更新接入)。

消费端批量测试优先使用 [RP 测试封装](./testing)，按需选择纯内存、Vue 或 React 入口。
