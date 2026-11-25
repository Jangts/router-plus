# 提案：面向消费端的 Vue、React DOM 与内存路由测试套件

日期：2026-11-25。状态：待评估，不构成实施或发布授权。

## 背景与请求

WFJ Campaign Console 使用 @jangts/router-plus 0.5.0。小绽前端指令测试在 Node 加载真实路由/命令模块时，消费端 runtime-base.ts 读取 document.baseURI，导致 document is not defined，测试文件未开始执行。这是消费端测试环境缺口，尚无证据表明 Router Plus 运行时有缺陷。

希望 Router Plus 评估提供供消费端复用的测试套件，重点覆盖 Vue、React 的组件渲染、虚拟 DOM 更新和内存路由，使应用无需打开浏览器或启动服务即可验证指令、状态及路由合同。当前只请求评估和提案，不授权直接实施、发布或迁移消费端。

## 当前已有基础

本机源码的 ./testing 已导出 createMemoryConnection、createMemoryHost、createFakeBridge；test/vue-integration.test.mjs 和 test/react-integration.test.mjs 已使用 JSDOM、真实框架挂载与路由验证。这次希望评估复用现有内部测试能力，而非预设另建运行时或新增 API。

## 请评估

1. 能否提供框架无关的内存测试层，以及可选的 Vue/React 测试适配层。区分虚拟 DOM、模拟浏览器 DOM 与真实浏览器：虚拟 DOM 本身不提供 document；布局、滚动、聚光几何及视觉效果应明确不在无浏览器测试保证范围内。
2. 测试环境能否在导入 Vue/React DOM 和消费端模块前正确安装 document、window、baseURI、location、history、RAF 等所需能力；明确哪些由公共包提供，哪些由应用注入。JSDOM 等测试依赖应可选，避免进入生产运行时。
3. Vue：真实 createApp / 插件 / provide-inject / composable、nextTick 与异步刷新、effectScope、挂载卸载与页面操作注册释放。
4. React：真实 root / provider / hook、act 与异步刷新、effect 清理、StrictMode 重挂载以及上下文隔离。
5. 路由：使用各框架原生 memory history/router，覆盖初始地址、动态参数、query/hash、push/replace、前进后退、守卫拒绝、重定向及异步导航完成；不能只检查 mock 被调用。
6. 状态与指令：覆盖调用参数、实际回执、错误透传、错误路由、宿主过期或缺失、并发/取消、切页后的绑定释放、已销毁页面不得继续应用。业务字段、权限与保存规则仍由消费端校验。
7. 生命周期：提供可靠的 flush/whenReady 与统一 dispose，恢复全局变量、卸载组件、清理订阅/计时器和 DOM；支持多用例隔离，说明并发运行限制，避免用固定 sleep 等待。
8. 按需提供参数化合同测试清单，由消费者填入路由、状态、操作和断言；不要导入 WFJ 业务代码或用例名单。

## 期望输出与验收建议

- 先说明现有 ./testing 能否完成上述场景，以及缺少的是示例、封装还是运行时能力。
- 各给一个最小 Vue、React 消费端示例：环境建立 → 动态导入框架与应用模块 → 内存路由挂载 → 执行操作 → 断言实际回执和状态 → 完整清理。
- 示例可在 Node 中单独运行，无需开发服务器或浏览器；同时说明 node:test、Vitest 等运行器的接入方式和受支持版本。
- 对本次 document.baseURI 缺口给出正确的接入建议，避免消费者逐个伪造不完整 document。
- 输出兼容性、依赖及打包影响、最小测试矩阵与分期建议；先评估，不自动实现或发布。

消费端当前优先静态核对指令、参数和调用关系；该提案用于降低未来定向自动测试的成本，不将浏览器验收变为日常修改前置条件。

## 提交状态

GitHub Issue 创建请求被连接权限拒绝：403 Resource not accessible by integration。未创建远端 Issue；本文件保留完整评估请求。
