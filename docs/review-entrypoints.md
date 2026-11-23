# 项目检查入口

| 范围 | 实际入口 | 能说明什么 |
| --- | --- | --- |
| 导航与历史 | [导航](../test/navigation.test.mjs)、[状态](../test/state.test.mjs)、[顺序命令](../test/sequence.test.mjs) | 提交、取消、状态恢复及命令结果；不证明真实浏览器表现 |
| 来源与 Store | [原生绑定](../test/native-bindings.test.mjs)、[原生 hook](../test/native-hooks.test.mjs) | 数据身份、通知、读写、QS 与来源生命周期 |
| 框架接入 | [React](../test/react-integration.test.mjs)、[Vue](../test/vue-integration.test.mjs) | 对应真实框架与模拟环境的接入；记录实际 DOM、路由和 peer 组合 |
| DOM 与覆盖层 | [DOM runtime](../test/dom-runtime.test.mjs)、[交互](../test/interaction.test.mjs) | 锚点、清理、交互及模拟 DOM 行为；不替代像素、设备、读屏和视觉验收 |
| 入口与声明 | [包体回归](../test/packaging.test.mjs)、[兼容检查](../scripts/compatibility.mjs) | ESM／CJS、类型与选定依赖组合；最低 peer 检查可能联网，须单独确定范围 |
| 生命周期 | [发布边界回归](../test/release-review.test.mjs)、[HMR](../test/hmr.test.mjs) | 销毁、清理、所有权与既有热替换合同；不等同于各 bundler 的端到端运行 |
| query 与规则依赖 | [能力组合](../test/capability-core-050.test.mjs)、[动态合同](../test/live-contracts-050.test.mjs)、[并发恢复](../test/query-races-050.test.mjs) | 局部参数更新、跨 facade 协调、独立目录订阅、异步恢复及地址意图 |
| 跨层边界 | [Core](../test/full-review-core-fixes.test.mjs)、[框架](../test/full-review-framework-fixes.test.mjs)、[Store](../test/full-review-store-fixes.test.mjs)、[DOM](../test/full-review-dom-fixes.test.mjs) | 历史载荷、保留页面、原生路由、根集合与历史包装器归属等跨层合同 |

## 诊断与素材

诊断通过宿主配置的 onDiagnostic(error, stage) 等已公开入口报告，宿主拥有存储和保留策略；默认不安装网站日志库。观察失败不能中断必要清理，具体合同见[公开配置](../src/core/types.ts)、[框架接入](frameworks.md)及[实现入口](../src/core/router.ts)。

shared/visual-assets/branding/router-plus 保存本项目保留的品牌原件；文档站在 Pages 项目中维护自己的发布资源。包的 CSS、DOM renderer 与主题定义属于 SDK 本身，不与 Jangts 业务前端共享视觉数值。

执行规则见[协作约定](../AGENTS.md)。类型、模拟 DOM、真实浏览器、兼容矩阵和设备外观分别验收，入口存在不表示本次已经执行。
