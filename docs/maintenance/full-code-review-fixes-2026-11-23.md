# 全量审查问题修复与复验

结论：[全量审查](full-code-review-2026-11-23.md)中的 R01—R12 均已修复。保留原有源码及 Git 改动，未提交、推送、发布或部署。

| 问题 | 修复与反向验证 | 正式回归 |
| --- | --- | --- |
| R01 Vue 原生路由旧快照 | 原生路由与 Plus context 两侧协同更新，业务 watcher 收到新 query，隐藏页保持冻结 | full-review-framework-fixes，路由更新用例 |
| R02 React 锚点丢参数 | 调用时基于自身 scope 的最新地址生成绝对目标；旧 hook、同页新 query、隐藏页均保参 | full-review-framework-fixes，2 个锚点用例 |
| R03 局部 query 丢历史 | patch 保留未显式覆盖的外层 history 及非 query 导航值，root/scoped 一致；显式覆盖和完整 setter 原语义保留 | full-review-core-fixes，2 个局部更新用例 |
| R04 Zustand 根值被写坏 | Map、Set、Date、数组、基础值以完整原生值读写，非记录值使用 replace；普通记录 merge 保留动作；其他类实例登记前拒绝 | full-review-store-fixes，3 个用例及打包类型消费 |
| R05 手动保留失效 | retain 事件刷新两端 context，Core 同步 scope 和 StateEngine；回返重新投影手动保留标记，连续两次往返保留 DOM，release 重建 | full-review-framework-fixes，React/Vue 两端保留用例 |
| R06 序列误取消 | query.patch 纳入导航命令分类，重定向后继续读取真实目标上下文 | full-review-core-fixes，重定向序列用例 |
| R07 primitive history 丢失 | 重包有效 namespace 继承已有 rawState，覆盖 42、false、null、字符串多轮提交 | full-review-core-fixes，原始历史值用例 |
| R08 Vue Redirect 更新无效 | 挂载后观察目标与选项，卸载停止观察 | full-review-framework-fixes，重定向更新与卸载用例 |
| R09 原型名状态丢失 | 地址事务值使用无原型字典；历史 namespace 使用自有数据属性 | full-review-core-fixes，__proto__/constructor 用例 |
| R10 历史包装器归属 | 仅恢复自身持有的方法；第三方保有的旧 wrapper 释放后不报告旧／新订阅；重装每次仅原生调用一次 | full-review-dom-fixes，包装器所有权与重装用例 |
| R11 历史观察者异常 | 隔离单个观察者，保留原生返回和原生异常，健康观察者继续收到通知 | full-review-dom-fixes，异常隔离用例 |
| R12 容器滚动偏差 | nearest 单轴边缘算法覆盖可见、跨界、大目标；落实 inline、offset、边框内视口及 RTL | full-review-dom-fixes，3 个滚动用例 |

四个新回归文件位于 test/，共 19 项；既有 267 项保留，最终总计 **286 项通过，0 失败、0 跳过**。构建包含 ESM/CJS 和声明生成。日志：.tmp/full-review-fixes-build.log、full-review-fixes-tests.log。

结构／导入检查通过。同一最终 tarball SHA-1 为 **da0f7a69ceea0473d05974d05b7321b502be7dae**：当前依赖消费检查全部 8 个完整配方；声明最低组合检查 7 个，仅按已声明能力门槛排除需要原生 React Router >=6.4 的 Data Router 配方。包括新增 Zustand Map 类型消费。日志：.tmp/full-review-fixes-packed.log、full-review-fixes-minimum.log。

相邻 pages 的中英文文档生成与检查通过，日志 pages/.tmp/full-review-fixes-docs.log。两仓库 unstaged/staged diff 检查均通过。完整审查的原始复现、源指纹和历史发现保留，不以修复删除原始证据。

未执行真实浏览器视觉验收、压力测试、消费者切包或线上操作；DOM 生命周期与滚动以隔离 DOM／明确几何参数回归验证。本结论为本次 12 项问题关闭及上述库级验证结果。
