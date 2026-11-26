# 原生状态绑定验收记录（2026-11-11）

## 范围与设计依据

正式合同见 [原生状态绑定](../../packages/router-plus/docs/state-bindings.md)。本次范围为 Router Plus 的原生 React／Vue 入口、store 创建封装、内部来源索引、QS 编解码、cafe Tab 调用方、公开类型及双语文档站。依赖锁只补充验证所需的状态库开发依赖和可选 peer 元数据，保留原有平台依赖记录。

按代码检查标准选取 I01、I03、I04、I06、I07、I11、I13，并检查对应的生命周期、历史恢复、并发与查询参数边界：

- 原生参数、返回类型、引用身份与读写能力保留；不传 ID 不登记、不要求 Provider。
- 组件按页面实例定位，Vue setup store 按 store effect scope 清理；共享 store 随所属 Router Plus 实例清理。
- 业务接入使用 hooks 或创建封装；手动来源登记与自有状态 hooks 不列入公开接入接口。
- 字段 codec 处理完整值，非标量字段默认 JSON；整组 codec 支持参数对象、URLSearchParams 与重复参数。
- 参数归属在声明时校验，卸载释放动态归属；保留无关参数和 hash，恢复时保留未绑定字段。
- 合并并发地址投影，查询值不重复写入历史；来源初值与 Vue proxy 身份保持各自边界。
- 诊断只记录相关查询输入，不记录未绑定的来源数据；已结束的 owner 拒绝新登记。

## 实际验证

| 检查 | 结果 |
| --- | --- |
| `npm run build:packages` | 通过；包含 ESM／CJS 生成和既有前置检查 |
| `node --test packages/router-plus/test/*.test.mjs` | 126 项通过 |
| 公开类型消费者 | NodeNext ESM／CommonJS；原生 hooks、Zustand 泛型与 currying、Redux、Jotai、只读 ref 和移除的入口均有正反类型用例 |
| 原生状态库 | 真实 Zustand、Redux Toolkit、Jotai、Pinia 的离线集成用例通过 |
| cafe 路由集成 | `routerPro.test.mjs` 与 `routerPlusIntegration.test.mjs` 共 10 项通过 |
| cafe 类型 | `tsc -b apps/cafe/tsconfig.json --pretty false` 通过 |
| 文档站 | `node apps/router-plus-docs/scripts/check.mjs` 通过；公开导出、双语页面及来源一致 |
| 修改范围 | `git diff --check` 通过；未重置已有或并行修改 |

框架交互通过 JSDOM、原生内存路由和 cafe 的 Vite middleware 测试装配验证；这些结果不构成实际浏览器视觉验收、性能容量结论或生产验证。本次没有发布 npm、部署站点或修改业务数据。
