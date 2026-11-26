# 消费端测试

RP 测试工具复用真实运行时、Vue Test Utils 和 React Testing Library。消费端提供自己的生产配置、组件、操作和断言；每个用例创建独立 fixture，批量执行沿用运行器的 `test.each` 或循环。

## 无 DOM 的合同测试

`@jangts/router-plus/testing` 不加载 Vue、React 或 DOM 工具。`createRouterPlusTest` 接收生产 RP 配置与 `initial`（默认 `/`），默认关闭全局注册，连接内存路由并等待 RP 就绪。

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRouterPlusTest } from '@jangts/router-plus/testing';

const pages = [{ path: '/items', title: 'Items' }];
for (const initial of ['/items', '/items?category=all']) {
  test(initial, async () => {
    const fixture = await createRouterPlusTest({ pages, initial });
    try {
      const receipt = await fixture.plus.navigate('/items?category=code');
      assert.equal(receipt.ok, true);
      assert.equal(fixture.connection.location.search, '?category=code');
    } finally {
      await fixture.dispose();
    }
  });
}
```

保存为 `router.test.mjs`，执行 `node --test router.test.mjs`。Vitest 可直接使用相同装配与清理模式。调用应用指令时把 `fixture.plus` 注入应用装配工厂，断言真实回执与状态；业务字段、权限、保存规则仍由应用负责。

复用纯生产配置或每例创建新实例的工厂，不复用已连接的 RP／浏览器 router 单例。`initial` 是测试初始地址的唯一入口，不重复传入生产 `initialLocation`。

## 组件测试环境

按项目所用框架安装开发依赖：

```sh
# Vue
npm install -D @vue/test-utils jsdom
# React
npm install -D @testing-library/react @testing-library/dom jsdom
```

Vitest 配置 `test: { environment: 'jsdom' }`。node:test 则在预加载模块建立 JSDOM 全局，再动态导入框架测试工具及应用模块。给 JSDOM 指定 `url: 'http://localhost/'`，使 `document.baseURI` 有明确来源；不要逐个伪造不完整的 document。

模拟 DOM 由运行器持有，fixture 不替换全局变量或关闭共享 JSDOM。同一 worker 不并发切换 DOM。Vue/React Web 组件的浅挂载仍需要 DOM 实现；这不要求真实浏览器或开发服务器。布局、滚动、几何与视觉效果不在模拟 DOM 保证范围。

## Vue

```js
import { mountRouterPlus } from '@jangts/router-plus/testing/vue';
import { nextTick } from 'vue';
import Page from './Page.vue';
import { pages, routes } from './route-config.js';

const fixture = await mountRouterPlus(Page, {
  pages, routes, initial: '/items',
  mountOptions: { props: { title: 'Items' } },
});
try {
  const receipt = await fixture.plus.navigate('/items?category=code');
  await nextTick();
  expect(receipt.ok).toBe(true);
  expect(fixture.wrapper.text()).toContain('Items');
} finally {
  await fixture.dispose();
}
```

`mountOptions` 保留 VTU 的 props、插件、provide 等原生选项，RP 插件自动加入。返回 `{ wrapper, plus, router, dispose }`；`router` 是独立 Vue memory history router。若需按路由切换页面内容，挂载包含 RouterPlusView 的生产根组件。

## React

```js
import { renderRouterPlus } from '@jangts/router-plus/testing/react';
import { pages, routes } from './route-config.js';

const fixture = await renderRouterPlus({ pages, routes, initial: '/items' });
try {
  const receipt = await fixture.run(() => fixture.plus.navigate('/items?category=code'));
  expect(receipt.ok).toBe(true);
  expect(fixture.result.getByText('Items')).toBeTruthy();
} finally {
  await fixture.dispose();
}
```

返回 `{ result, plus, router, run, dispose }`。`result` 保留 RTL 查询、rerender、unmount；`renderOptions` 保留原生容器和应用 wrapper 等选项。

传 `routes` 使用原生 data router，组件放在 route tree 中，可验证 loader、重定向及 blocker。也可用 `ui` React element 替代 `routes`，在声明式 MemoryRouter 下挂载；此模式 `router` 为 `null`，通过 `plus` 操作。两种输入互斥。

`run(operation)` 在 `act` 中启动操作，让 React 提交后再等待真实回执。对于需要等待组件提交的 RP 操作，应使用它，避免在普通 `act` 回调内等待回执而阻塞所需提交。

## 等待、清理与依赖

构造完成表示初始路由、RP 与必要框架更新已就绪。后续操作沿用真实 Promise、Vue nextTick／VTU flushPromises 和 React act；不存在等待所有业务 I/O 的全局 idle。取消可能发生在提交之后，应检查真实回执，不把取消等同于业务副作用已撤销。

`dispose()` 多次调用共享完成 Promise，清理本 fixture 的组件、RP 和 router。初始化失败也清理已创建资源；某项清理失败后继续其余清理，并用 AggregateError 保留初始化错误和清理错误。工具只创建独立实例，不接管外部共享单例。

VTU 2.4.x、RTL 16.x、DOM Testing Library 10.x 是可选测试 peer，按应用框架版本选择兼容组合。纯内存与生产入口不引入这些工具；组件入口不互相加载。现有运行时框架 peer 合同保持独立，执行过的版本组合记录在维护资料中。
