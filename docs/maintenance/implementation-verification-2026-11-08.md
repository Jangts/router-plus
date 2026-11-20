# Router Plus 实施复查记录

接入复查后的五项修正及 77 项测试结果见[接入复查修正记录](review-followup-2026-11-08.md)。本文保留对应 72 项测试时的源码与验证证据。

日期：2026-11-08。基准为[实施方案](implementation-plan.md)及[首次验收记录](acceptance-review-2026-11-08.md)。本记录对应修复后的源码，不删除首次检查的失败证据。

## 结论与证据范围

本包构建、72 项行为与集成测试、公开入口解析及消费者类型检查通过。首次记录的 F01—F08 均有实现修改和对应回归。未引入具体 App 的业务实现；App 可以使用手写路由、生成器、原生导航、独立状态桥、自定义 host 或 renderer。

完整 Workspace 检查未通过：它在根 lockfile 的可选依赖完整性检查处停止，尚未运行到包入口扫描。对比本次修改前的暂存区 lockfile 与当前文件，`optionalLockProblems` 均返回 26 项缺失，均为 esbuild 0.28.2 的跨平台可选依赖。该结果不能写成 Workspace 已通过，也没有通过跳过检查或放宽门禁消除它。

真实 React/Vue 框架集成在 Node + jsdom 中验证。没有启动六端应用、打开浏览器、截屏、开展视觉验收、进行性能压测或发布 npm 包。DOM 模拟测试不证明浏览器真实布局与跨文档坐标表现；这些范围保留人工验收边界。

## 执行检查

| 检查 | 实际结果 |
| --- | --- |
| `npm run build --workspace=@jangts/router-plus` | ESM、CJS、声明和 CSS 生成通过 |
| `npm test --workspace=@jangts/router-plus` | 72 项通过，0 失败、0 跳过 |
| packaging.test.mjs | 11 对 JavaScript 入口导出一致；CSS 文件存在且配置 sideEffects；阻断框架模块解析后 Core 仍能加载 |
| NodeNext 消费者 | ESM 与 CommonJS 临时消费者均完成严格类型检查，包含负向类型断言 |
| `npm pack --dry-run --json --workspace=@jangts/router-plus` | 使用任务临时 cache 完成预检；154 个文件，包含 CSS 和三份正式参考，维护记录不打包 |
| `git diff --check`（本次范围） | 无空白错误 |
| `node development/scripts/workspace/check.mjs` | 在上述已有的 26 项可选依赖缺失处失败 |

源码指纹：按相对路径排序，把 `packages/router-plus/src/**`、`test/**` 与 `package.json` 的路径、NUL、内容、NUL 依次输入 SHA-256，得到 `772d80d013947f3f7577ed2d30e5b61feda1622c32c25ed5bd26ab74fb68aab8`。

## 首次缺陷复查

| 编号 | 修改后的行为 | 回归证据 |
| --- | --- | --- |
| F01 | boundary 提供稳定实例 facade；hooks、桥、目标、守卫及 host 按 scope 绑定；缓存出口冻结原生路由上下文 | react-integration、vue-integration 中的真实缓存视图、DOM 身份与状态隔离断言 |
| F02 | 子记录真正进入返回树；别名树同步生成 | regressions 的嵌套生成及嵌套别名测试 |
| F03 | Vue 区分 NavigationFailure，过滤失败的 afterEach；相同 URL 的 Tab/state 更新可提交 | 真实 Vue Router 阻止导航、原生守卫及共享 conformance |
| F04 | 桥的读取、浅合并和写入一起进入同 key 队列 | 并发两个不同字段 patch 后同时保留更新 |
| F05 | 事件使用捕获的 scope；释放及登记替换使旧任务失效 | 导航后旧桥完成仍归原页，release 后旧 facade 拒绝写入 |
| F06 | React 回执按 operation token 关联；支持真实重定向与历史 entry 更新 | 同路径 query 连续提交、真实 loader 重定向、晚到回执不回退新地址 |
| F07 | history 桥维护每个实例订阅及其引用计数；独立解绑；相同地址变化带修订 | 两实例共享 window 的更新和解绑测试 |
| F08 | clear、提交导航和释放取消目标等待；异步结果不能复活旧高亮 | 延迟 resolver、DOM 等待取消及清理回归 |

## 补齐的执行链与覆盖

| 能力 | 实际实现与证据 |
| --- | --- |
| 匹配 | 可注入 matcher；React/Vue 使用框架匹配与目录优先级；测试 Unicode 编解码、静态/动态冲突、别名与自定义 matcher |
| 连接 | 两端 traversal；Vue beforeEach 和可选 React blocker 接入原生守卫；同一套 conformance 验证导航、state、history、Tab 和阻止结果 |
| 状态 | 注入及注册的 adapter 参与实际 owned 存储与订阅；桥恢复可晚于快照；session 版本、重置、codec/诊断配置和实例失效参与执行 |
| SSR | snapshot/initialSnapshot/restore；真实 React renderToString + hydrateRoot 验证同 seed 无恢复错误 |
| 扩展 | renderer 实际挂载/渲染/销毁；route transformer 接入生成结果；滚动策略有匹配条件、优先级及独立卸载；异步插件清理可等待 |
| 交互 | host.root 限定目标；支持矩形锚点、取消等待、容器滚动、焦点恢复、dismissible/keyboard、ResizeObserver 和 visualViewport 监听 |
| 生命周期 | host 操作串行化；setup 回滚；renderer 初始渲染失败可清理；初始插件未完成时卸载 DOM runtime 不会留下晚到安装 |
| 发布资料 | 正式 README、API/框架/状态交互参考；公开包配置与独立 CSS 子入口；Workspace 检查增加严格的 CSS 资产验证分支 |

框架支持和测试证据不等于所有 peer 版本均执行过。本次安装并测试 React/React DOM 19.3.1、React Router DOM 7.18.4、Vue 3.5.45、Vue Router 4.6.4。自定义连接与 host 仍由其实现者保证实际能力，缺失的拦截能力不假装成功。
