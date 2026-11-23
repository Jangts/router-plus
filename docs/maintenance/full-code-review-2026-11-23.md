# Router Plus 全量代码审查

日期：2026-11-23。审查最初发现 12 项已复现问题；后续已全部修复并完成复验，见[修复与复验记录](full-code-review-fixes-2026-11-23.md)。下文保留原始审查证据及修复方向。

## 范围与方法

依据代码检查规范 L0—L7，按 Core／框架与 Store／交互与 DOM 三组独立检查，并由主协调交叉运行主要复现。源码清单共 70 个 TypeScript 文件；生产模块检查覆盖状态、导航、实例、命令序列、插件、协议／目标解析、React/Vue、Store 适配、DOM 历史／滚动／覆盖层以及构建公开入口。测试辅助模块以构建与回归验证为主。接口与文档合同对照当前 0.5 指南及迭代计划。

重新构建成功，现有 267 项回归全部通过，0 跳过。结果只证明现有用例通过，未覆盖下列复现。日志：.tmp/full-review-build.log、.tmp/full-review-tests.log。源码指纹清单位于 .tmp/full-review-source-fingerprint.json，综合 SHA-256 为 a680039dba9227516653313771dcb60de48e562f1c7f0c302807436bc33422a1；审查期间源码未改变。

## 确定发现

| 编号／级别 | 位置 | 触发与实际影响 | 修复方向 |
| --- | --- | --- | --- |
| R01 P1 | src/vue/view.ts:140 | 保留视图从 /a?q=one 导航至 /a?q=two，原生 useRoute 和 DOM 仍为旧 query。同步 watcher 在原生路由先变化时跳过，随后 Plus context 更新没有再次同步；业务请求 watcher 漏触发 | 按原生路由与 Plus scope 两侧的提交协调更新冻结快照，同时保持隐藏页隔离 |
| R02 P1 | src/react/hooks.ts:89 | 同一地址 /a?keep=yes#old，Core resolveHref('#new') 保参，React hook 却返回 /a#new；navigate／Link 亦会清掉 Tab 或筛选 | hash-only 规范化保留原 search，与 Core 合同一致 |
| R03 P1 | src/core/query-update.ts:221 | selection 是 query:false 的声明状态；先设为 two，且已有 history state draft，再 patchQuery({q:'coffee'})，回执成功但 selection 回到默认 one，draft 丢失 | 局部 query 更新保留未显式覆盖的 history state 与非 query 导航值 |
| R04 P2 | src/stores/native.ts:25、src/stores/zustand.ts:55 | registerZustandState 接受根 Map／Set，读取投影为 {}；setState(new Map) 返回成功，但原生 Store 被改成 {} | 对根非普通对象正确适配并使用适当替换模式，或在类型与运行时一致拒绝 |
| R05 P2 | src/core/router.ts:2107、src/vue/composables.ts:58、src/vue/view.ts:85 | 未声明 retain 的页调用 plus.retain()，离页后返回 input DOM 已重建。宿主仍持有 retained:false 快照 | retain 事件应刷新上下文／缓存标记；Vue 已复现，React 同型路径应一并验证 |
| R06 P2 | src/core/sequence.ts:18 | query.patch 经 guard 重定向到 /b 已提交，但 execute([query.patch,context.read]) 返回 cancelled、failedIndex 0、results 空；等价 navigate 序列正常 | 将 query.patch 纳入导航命令的实际回执与生命周期跟随 |
| R07 P2 | src/core/history.ts:35 | navigate(...,{state:42}) 存入 rawState；随后 query-bound setState 虽传当前 state，重新包装时仍丢掉 rawState | 包装／重写 namespace 时保留已有原始非对象 state |
| R08 P2 | src/vue/view.ts:38 | 保持挂载的 Redirect 的 to 从 /b 变 /c，不再导航；React 同组组件会响应 | 观察目标及相关选项更新，处理替换、卸载和重复目标 |
| R09 P2 | src/core/query-update.ts:202 | 合法非 query 状态 ID __proto__ 的 setState(7) 返回成功但仍读到默认 0；Object.assign 将该键当原型 setter | 使用不会解释原型 setter 的数据字典合并 |
| R10 P2 | src/dom/history.ts:87 | bridge 安装后其他 SDK 再包装 history，释放 bridge 会覆盖其 pushState／replaceState | 只恢复仍由当前 bridge 持有的方法 |
| R11 P2 | src/dom/history.ts:54 | 原生 pushState 已成功，一个 reportLocation 抛错导致调用方也收到异常，后续健康观察者完全收不到通知 | 隔离每个观察者异常，保留原生结果并提供诊断 |
| R12 P2 | src/dom/targets.ts:129 | 自定义容器范围 0–100、目标 150–170，nearest 实际滚动 150，而最近边缘只需 70；该分支还忽略 inline | 按完整可见／跨越边界情况计算最小滚动，并落实水平对齐 |

框架复现：.tmp/review-vue-query.mjs、review-react-hash.mjs、review-store-map.mjs、review-vue-redirect.mjs、review-manual-retain.mjs。DOM 三项复现：.tmp/review-runtime.mjs。其他 Core 项由独立最小公开 API 调用验证。复现文件是临时证据，不作为公开 API 或交付示例。

## 证据边界

未启动应用或真实浏览器，未进行视觉验收、性能压测、消费者切包、发布或部署。滚动问题使用明确矩形与 scrollBy 参数复现。没有把候选、单纯结构偏好或未运行路径列为缺陷。应先修 R01—R03，再按对应边界补正式回归；重跑原有测试不能替代新增用例。
