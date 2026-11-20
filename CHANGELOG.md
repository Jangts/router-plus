# Changelog / 修改日志

## 0.4.6 — 2026-11-13

### English

- Add optional structural HMR disposal integration for Core, React and Vue factories without accepting module updates or taking ownership of the native router.
- Release the owned global facade before asynchronous cleanup; repeated and reentrant Core disposal share completion.
- Make Vue connection cleanup idempotent, attempt every release after unsubscribe failures, and isolate diagnostic callback errors.
- Reject state patch/reset and retention mutations after disposal instead of recreating released scopes.
- Isolate Core connection unsubscribe failures and keep stale Vue unmount callbacks from disconnecting a replacement adapter on a shared Core.
- Document module ownership and lifecycle boundaries, and cover replacement, delayed cleanup, installed Vue connections and failing native cleanup.

### 中文

- Core、React 与 Vue 创建入口新增可选的结构化 HMR 清理接入，不自动接受模块更新或接管原生路由器。
- 在异步清理前释放自身全局门面，Core 的重复及重入销毁共用完成结果。
- Vue 连接清理保持幂等，原生注销失败后继续剩余清理，诊断回调失败不打断清理。
- 销毁后拒绝状态补丁／重置与保留操作，避免重新创建已释放的作用域。
- 隔离 Core 连接注销异常，避免共用 Core 时旧 Vue 卸载回调断开新适配器连接。
- 补充模块所有权与生命周期文档，覆盖替换、延迟清理、已安装的 Vue 连接及原生清理失败。

## 0.4.0 — 2026-11-12

### English

- Add sequential `execute(commands, { timeoutMs?, signal? })` on instances, scoped facades and the console facade. Wait for conditional source registration/restoration and framework publication; retain step receipts and stop on failure, timeout, cancellation or active source replacement without replaying business operations.
- Add `state.registered`, `state.unregistered`, `state.committed` and `disposed` subscription events. Complete registration groups publish atomically; lifecycle metadata contains no live values.
- Add side-effect-free `inspectState` metadata for installed page/global sources, excluding the console facade and arbitrary field expansion.
- Isolate React registration identities and publish retained caches/native router references after commit. Prevent a newly routed component from registering into the previous page during provider publication. Deduplicate address rebuilds and restores within registration batches; snapshot and precompute fixed query rules.
- Isolate diagnostic callback failures and restore global custom Map codecs by their encoded query projection.
- Preserve Redux middleware/enhancer inference, type Zustand data projections accurately and reject incompatible computed read/write registration. Normalize legacy router CommonJS exports for Node ESM consumers.
- Require Vue >=3.5 for its native two-parameter Ref/computed types; preserve React 18 native ref overloads. Support unmount cleanup on structural Vue apps without app.onUnmount. Set Vue Router minimum to 4.0.16 following the reproduced upstream Node import failure on 4.0.0.
- Clean generated output before compilation; verify packed consumers with installed peers and declared peer minima in isolated directories.

### 中文

- 新增 `execute(commands, { timeoutMs?, signal? })` 顺序编组，实例、作用域门面及控制台门面共用。等待条件挂载来源的登记／恢复与框架提交，保留逐步回执；失败、超时、取消或执行中来源替换即停止，不重放业务操作。
- 新增 `state.registered`、`state.unregistered`、`state.committed` 和 `disposed` 订阅事件；整组登记完整安装后发布生命周期通知，元数据不包含实时值。
- 新增 `inspectState` 来源能力查询，描述已登记的全局／页面来源，不读取值、不展开任意字段，不加入控制台门面。
- 隔离 React 登记身份，保留视图缓存与原生路由引用只在提交后发布；避免新页面组件在 Provider 发布导航期间误登记到旧页面。合并批次地址重建与恢复，快照并预计算固定 QS 规则。
- 隔离诊断回调异常，修复全局 Map 自定义 codec 因 JSON 空对象比较而漏恢复的问题。
- 保留 Redux middleware／enhancer 推断，准确区分 Zustand 数据与动作，拒绝不兼容的 computed 读写登记；适配旧 Router 的 CommonJS 导出。
- Vue 最低版本调整为 3.5，Vue Router 调整为 4.0.16；保留 React 18 原生 ref 重载，并兼容没有 app.onUnmount 的结构化 Vue App 清理。
- 构建前清理过期编译产物，增加当前及最低依赖组合的实际 tarball 消费验证。

## 0.3.1 — 2026-11-12

### English

- Add `useReactState`, `useVueState` and existing Zustand/Redux/Jotai registration; creation wrappers share the same registration path and native ownership.
- Support Vue callbacks and initially function-valued refs/computed values, forwarding native arguments, awaited results and business errors through `callState`.
- Make registration rollback, grouped cleanup and owner disposal atomic with source identity checks for pending operations. Publish React accessors only after commit.
- Separate Redux/Jotai native commands from complete-value assignment with explicit business setters; keep generated writers within known creation branches.
- Reject duplicate global query ownership without catalog pages, and cancel late rejected writes/restores after source unregistration without poisoning replacement sources.
- Align scoped global Store field paths, block direct interactions after disposal, and preserve cancellation through asynchronous resolver/scroll/tour work.
- Make DOM runtime cleanup idempotent, roll back partial renderer mounts, preserve native empty download links and retain prototype-named query keys safely.

### 中文

- 新增 `useReactState`、`useVueState` 和已有 Zustand／Redux／Jotai 的登记入口；创建包装器共用相同登记路径，保留原生状态所有权。
- Vue 支持回调与初值为函数的 ref／computed，通过 `callState` 转发原参数、异步结果和业务错误。
- 补齐登记回滚、整组清理、dispose 兜底与未完成操作的来源身份检查；React 只发布已提交的访问器。
- Redux／Jotai 通过显式业务 setter 区分完整值赋值与原生命令调用；默认 writer 仅在明确的创建分支准备。
- 补齐空页面目录下的全局 QS 冲突检查；注销后的异步写入／恢复失败不会污染替换来源。
- 统一作用域门面对全局 Store 字段路径的访问，阻止销毁后的直接交互，异步目标／滚动／导览保持取消回执。
- DOM runtime 注销保持幂等，renderer 部分挂载失败完整回滚；空 download 链接保留原生行为，查询键安全保留原型同名字段。

## 0.3.0 — 2026-11-11

### English

- Add native React/Vue state hooks with optional ID/options, automatic source cleanup, and creation-time Zustand/Redux/Jotai wrappers. Remove the application-facing owned-state hooks and manual registration API.
- Bind query groups and complete fields through explicit parameter ownership, default JSON for non-scalar fields, custom encode/decode, enum checks and native source restoration.

- Size the default bubble to its content so centered and end-aligned placements near a viewport edge no longer collapse into a narrow, heavily wrapped column.
- Flip fixed placements to the opposite side when the requested side cannot hold the bubble, and clamp every placement inside the visible viewport with a 16px gutter.
- Measure `tipGap` from the visible highlight edge so per-highlight and theme padding no longer halve the perceived gap; edge-aligned placements align with the same outer edge.
- Keep the built-in close and tour buttons isolated from host `button` font/line-height resets, and add a visible focus ring for keyboard users.

### 中文

- 增加原生 React／Vue hooks、可选 ID／配置、自动来源清理，以及创建时登记的 Zustand／Redux／Jotai 封装；业务接入不再使用自有状态 hooks 与主动注册 API。
- QS 整组和完整字段共用参数归属、非标量字段默认 JSON、自定义 encode／decode、枚举检查和原生来源恢复。

- 默认气泡按内容收缩，修复靠右或贴边时按剩余空间计算宽度导致气泡被压成窄条、文字逐字换行的问题。
- 固定方位在请求侧放不下时自动翻到对侧，并让所有气泡都收进可见区（保留 16px 边距）。
- `tipGap` 改为从高亮边框外侧起算，高亮外扩或主题 padding 不再吞掉一半间距；贴边对齐也改为对齐同一条外沿。
- 内置关闭按钮和导览按钮不再被宿主的 `button` 字体／行高重置影响，并补充键盘焦点样式。

## 0.2.1 — 2026-11-08

### English

- Fix excess bubble whitespace caused by host paragraph margins. Align the message and close control vertically in one row, and exclude hidden actions from layout while keeping compact padding and spacing.

### 中文

- 修复宿主段落外边距导致的气泡多余留白；正文与关闭按钮同排垂直居中，隐藏操作区不再占位，保持紧凑的内边距和间距。

## 0.2.0 — 2026-11-08

### English

- Add App-owned overlay themes with fixed z-index or inclusive minimum/maximum bounds on the default level 10000. Support radius, borders, mask, padding and basic bubble styling through typed options and overridable CSS.
- Add React/Vue highlight component registration, preserving App context through Portal/Teleport. Components receive width, height, left, top and typed context; Plus owns measured geometry and the shared overlay. App components own their bubbles and controls.
- Give default and custom components the same props contract, with additional styles for the default renderer. The default tour bubble contains exactly Previous/Next controls; ordinary highlights use a compact corner close button.
- Extend bubble placement to 18 modes: centered sides, side/corner alignment, viewport-aware side preferences, auto and none. Bubbles remain rectangular without arrows.
- Support signed relative tour movement through context.next(step = 1), nextTourStep(step) and the tour.next command. Negative steps go backward; zero is a no-op; movement past the last step finishes.
- Keep default CSS at zero specificity and avoid inline visual properties that block App overrides. Respect App-handled keyboard events and ignore keys while the guide is inactive.

API contract version remains 1. Existing mountOverlay cleanup functions remain callable and support live appearance updates. Custom content uses the new component contract; the existing full-overlay HighlightRenderer remains available separately. Shared overlay masking, geometry padding and stacking apply to either component; default highlight/bubble styles apply only to the built-in component.

### 中文

- 新增由 App 控制的覆盖层主题，可指定固定层级或为默认层级 10000 设置最小／最大值；圆角、边线、遮罩、外扩及气泡基础样式可通过类型化选项或 CSS 配置。
- 新增 React／Vue 自定义高亮组件注册，通过 Portal／Teleport 保留 App 上下文。组件统一接收 width、height、left、top 和类型化 context；Plus 负责测量定位与公共 overlay，自定义气泡和控件由 App 决定。
- 默认和自定义组件共用参数合同，默认组件仅额外接收 styles。默认导览气泡内保持上一步／下一步两个按钮，普通高亮改用紧凑的右上角关闭按钮。
- 气泡位置扩展为 18 种：居中侧边、双向贴角、指定方向的可见区自动、auto 和 none；保持无尖角矩形。
- context.next(step = 1)、nextTourStep(step) 与 tour.next 命令统一支持有符号相对步长：负数后退、0 不操作、越过末步结束。
- 默认样式使用零优先级，动态定位不锁死外观；尊重 App 已处理的键盘事件，未激活引导时不接管按键。

API 合同版本保持 1。mountOverlay 的清理函数保留可调用方式，并支持实时更新外观。自定义组件采用新的参数合同；原有完整覆盖层 HighlightRenderer 独立保留。公共遮罩、几何外扩和层级对两类组件有效，默认高亮／气泡的样式仅作用于内置组件。
