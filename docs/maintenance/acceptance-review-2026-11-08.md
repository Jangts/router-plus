# Router Plus 检查与验收记录

修复后的结果见[实施复查记录](implementation-verification-2026-11-08.md)。下文保留首次检查时的状态与证据。

日期：2026-11-08。基准：[实施方案](implementation-plan.md)。结论：不通过完整验收；基础构建与已有测试通过，但存在阻断使用的实现缺陷及合同缺项。

## 范围与方法

检查 packages/router-plus 的源码、公开类型、导出、测试与包登记。按仓库标准的 L1 接口、L2 职责、L3 协议、L4 并发与恢复、L6 清理及 L7 验证检查；不是六端全仓库验收。保留已有工作区修改，未修改运行源码，未启动应用、浏览器或视觉预览。

执行结果：

- `npm run build --workspace=@jangts/router-plus`：通过。
- `node --test packages/router-plus/test/*.test.mjs`：41 项通过，0 项失败。
- 根据 package.json exports 逐项 import/require：11 对 ESM/CJS 入口加载通过；这不代表消费者类型集成通过。
- 内存连接及结构化端口针对性复现：确认下述 F02、F04、F05、F07、F08。
- Vue 结构化失败回执复现确认 F03；尝试真实 vue-router 内存集成时，当前环境缺少 vue-router，未能执行；没有安装依赖或将模拟结果记为真实框架验证。
- React 真实挂载、SSR hydration、两端实际路由 conformance、DOM 测量与无障碍行为未验证。现有 adapters.test.mjs 主要检查导出、浅层生成结果和模拟端口，不能代替这些证据。

## 缺陷

### F01 [P1] 实例 boundary 没有建立实例作用域

位置：src/react/boundary.ts、src/react/hooks.ts、src/vue/view.ts、src/vue/composables.ts、src/core/router.ts。

React boundary 只注册 root 并渲染 div，没有实例 Context；hooks 始终读取全局 plus.getContext/getState。Vue boundary 同样没有 provide 实例 scope。RouterPlusOutlet 只是 Fragment，Retained 只是 hidden 容器；host 也没有在正常切换中驱动完整的 deactivate/activate。

触发：隐藏保留实例与新活动实例同时存在。隐藏组件读写会落到当前活动实例，未实现冻结 location、嵌套 scope 和稳定实例绑定。不能按方案宣称多实例保留已完成。

修复要求：实例 boundary 持有稳定 scope 和上下文快照，hooks、桥、目标与守卫消费最近 scope；host 与 Core 保留决策连接。以两个同时挂载实例的真实框架测试验证读写、隐藏、恢复和释放。

### F02 [P1] 两端生成器丢弃所有子路由

位置：src/react/routes.ts:82、src/vue/routes.ts:67。

records 保存的 children 数组独立于返回的 record；第二轮只向前者 push，从未赋给 record.children。复现父 /p 与子 /p/c：两个生成器都只返回 /p，返回记录没有 children。现有测试只验证平铺长度。

修复要求：构造返回对象时绑定真实 children；补嵌套、布局及别名生成验证。

### F03 [P1] Vue 阻止导航被报告为提交成功

位置：src/vue/plugin.ts:94、src/vue/plugin.ts 的 afterEach 回调。

commit 丢弃 push/replace 的 resolved value，直接返回 committed；afterEach 丢弃第三个 failure 参数，无条件发布 to。Vue Router 被阻止时可 resolve NavigationFailure，而不是 reject，见 https://router.vuejs.org/guide/advanced/navigation-failures.html 。因此被阻止的目标可能先进入 Plus 上下文，随后又被 currentRoute 回执改回，同时调用者拿到成功。

复现：结构化 router 保持 /a，push 返回失败值；请求 /b 后，连接返回 status:committed、location:/a。真实 vue-router 运行未完成，原因见验证范围。

修复要求：映射 aborted/cancelled/duplicated，过滤失败的 afterEach，使用真实提交身份，正确读取框架 history state 与 entry 身份；补真实内存路由集成。

### F04 [P1] 桥的并发 patch 丢更新

位置：src/core/state.ts:275。

无自定义 patch 的桥在进入队列前 read 和浅合并，队列只串行 write。复现初始 {a:0,b:0}，并发 patch {a:1} 与 {b:1}，结果 {a:0,b:1}。这违反同 scope/key 的 read-merge-write 整体串行要求。

修复要求：把读取、合并和写入放在同一队列任务内，验证两个更新都被保留。

### F05 [P1] 旧实例写入事件使用新页面上下文

位置：src/core/state.ts:183、write/patch/reset 队列与 disposeInstance。

notify 接收旧 instance，却从全局 getContext 获取事件归属；异步任务没有登记代次及释放检查。复现 A 的 slow 桥写入等待，导航到 B 后完成，state 事件的 context.pageId 为 B。

修复要求：事件使用操作捕获的 scope，登记替换和实例释放使旧回调失效；保留已发生外部写入的真实结果，不对新页面发旧值。补离开、release、重新登记三种竞争验证。

### F06 [P1] React 导航回执仅按 pathname 关联

位置：src/react/provider.ts:133。

每次 location 更新会完成所有 path 等于 next.pathname 的 pending。不同 query/hash/Tab/state 的同路径导航可能互相认领回执；重定向到不同 pathname 会超时，原生同路径变化也可能被认作 Plus 提交。effect 依赖没有 entry key，缺少 AbortSignal 处理。

修复要求：使用 operation/entry 身份关联真实回执，识别重定向和取消，正确处理同 URL 不同 entry；用真实挂载测试验证，不能只测试内存连接。

### F07 [P2] 同 window 第二个实例未订阅 history 桥

位置：src/dom/history.ts 的 existing 分支。

WeakMap 命中只增加 count，没有登记第二个 plus；report 闭包始终使用首个 plus。复现两个实例共享 window，push /b 后第一个上下文为 /b，第二个仍为 /。detach 首个实例后闭包也继续向它报告。

修复要求：维护每个订阅者及其引用计数，独立解绑，最后一个订阅者退出时恢复原方法；同 URL 不同 entry 变化也应可观察。

### F08 [P2] clearHighlight 后异步结果重新显示高亮

位置：src/core/interaction.ts:176。

clearHighlight 只清状态，不取消在途 resolver；导航 handleNavigation 在没有已显示高亮时同样不会取消等待。复现 highlight 等待 Promise，先 clearHighlight 再 resolve，最终 getHighlight 非 null。

修复要求：清除、导航失效与 dispose 都取消操作并递增代次；所有 await 后检查有效性。补目标等待、异步滚动和实例切换验证。

## 合同覆盖缺项

以下属于尚未交付的计划能力，不能因存在接口或目录就认定实现完成：

- Matcher：router.ts 将 matcher 固定为 defaultMatcher；构造与连接都没有可替换入口，也没有两端真实 matched chain 回灌。App 的框架路径语法不能按方案原样接入。
- 原生守卫与历史：两端连接均声明 traversal/interception 为 false，未提供完整原生拦截实现；back/forward/go 在实际框架连接不可用。仅暴露 capability 标志不等于完成这些能力。
- 扩展：registerStateAdapter 和 registerHighlightRenderer 只保存到集合，没有执行消费；注册后不能改变持久化或覆盖层。路由转换扩展也未提供。
- 状态恢复：注入的 PageStateAdapter 没有在 owned 读写路径中使用；桥 snapshot/restore 未接入生命周期；没有公共 SSR 状态快照/hydration 恢复接口。session 固定 JSON 且吞掉存储/迁移错误，没有方案要求的 codec 与诊断策略。
- 交互：目标注册是实例全局 Map，DOM runtime 不使用 host.root；无矩形锚点协议。默认 overlay 未接入 ResizeObserver/visualViewport，dismissible、keyboard 等选项没有完整执行。focus.restore 也未实现。
- 文档与发布：没有计划要求的正式 API/连接/实例参考及逐项覆盖证据表。package 仍为 private:true，未提供原提案的 overlay.css 子入口；样式目前用字符串注入，需明确正式发布合同，不能默认为原要求已验收。

未发现本包引入具体 App 业务实现；框架与 store 分入口的组织方向成立。但 scope、matcher、host 与连接缺项会实质限制 App 接入方式，因此目前也不满足“不限制 App 如何使用”的完成标准。

## 复查出口

先修 F01—F06，再修 F07—F08，并对照覆盖缺项补实现和正式参考。复查必须包含真实 React/Vue 集成与新的行为回归；现有 41 项测试全绿只能证明其已覆盖场景。外观、浏览器真实布局及用户交互体验仍由用户按仓库约定验收。
