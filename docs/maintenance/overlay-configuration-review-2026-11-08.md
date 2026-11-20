# 覆盖层配置检查与修复记录

## 检查范围与发现

检查默认 DOM 覆盖层、样式生成来源、React／Vue 生命周期适配和 cafe 消费者，未检查其他应用的层级设计。

- 默认样式在挂载时注入，根层级固定为 2147483000，无法适应 App 的层级分配。
- 默认 CSS 变量直接声明在覆盖层根上，阻断 App 祖先的同名变量继承；晚注入的普通选择器也可能覆盖此前的同优先级 App 样式。
- 目标外扩按 JavaScript 默认 6px 写入定位，CSS 无法独立控制。
- 高亮边线使用 outline，会被 cafe 的统一浏览器 reset 隐藏。
- 覆盖层的全局键盘监听在未激活高亮时也处理 Escape，且未尊重 App 的 defaultPrevented。

## 实施结果

- 样式仅提供零优先级的 CSS 缺省值，层级缺省 10000，支持固定值或 min／max 范围，不声明阻断继承的变量初值。
- `OverlayTheme` 统一配置层级、遮罩、高亮圆角／边色／边宽／外扩和提示卡外观，分别从 overlay、React、Vue 入口导出。
- 动态写入限于测量坐标与显式单次 padding；外观和几何外扩通过 CSS 变量及 calc 计算，边线改用 border。
- 支持持久 className、禁用样式注入及挂载句柄 update；React／Vue 更新外观保留 renderer、DOM runtime 和当前高亮。
- 键盘事件尊重 App 已处理的 defaultPrevented，未激活高亮时不接管按键。
- cafe 用独立的 CafeRouterOverlay 持有主题和层级上限 58；Dock、聊天、抽屉、播放器继续拥有各自更高层级。

## 验证证据与边界

- 包构建通过，CSS 从同一个 styles.ts 来源生成。
- DOM runtime、React integration、Vue integration、packaging 四个文件合计 26 项通过，无失败；覆盖主题移除／替换、显式 0、保留现有高亮、CSS 变量、键盘事件和公开类型。
- cafe routerPlusIntegration 4 项通过，含 StrictMode 根挂载、保留页生命周期和初始重定向。
- cafe TypeScript 检查及改动范围 git diff --check 通过。
- 验证使用隔离 DOM 和类型检查，未打开浏览器、启动应用或进行页面视觉验收；未发布 npm。本记录不宣称任意 App 的 stacking context 已经过真实页面验证。

## 层级默认值修正

按用户明确的层级需求，将缺省值设为 10000；App 可配置单侧／双侧范围或固定值。范围由 CSS clamp 计算；非法数值与上下限冲突在修改主题前拒绝。cafe 通过 max: 58 保留更高的 Dock、面板和播放器层级。此次追加验证范围为 DOM runtime 与 packaging 两个测试文件。

## 高亮组件接口与多步引导

- React／Vue 支持注册 highlightComponent，保留 App 原有 Context／injection；自定义组件不套用默认高亮和气泡的样式或布局。
- 默认和自定义组件共用 width、height、left、top、context 五个参数；默认组件通过 DefaultHighlightComponentProps 额外接收 styles。
- Plus 持有含外扩的测量框、坐标与共享 overlay 层级／遮罩。context 包含目标矩形、当前高亮／页面／导览状态、overlayRoot 和唯一的导览控制函数 next(step = 1)。
- 默认组件的气泡内只有上一步／下一步两个导览按钮，首步禁用上一步，末步前进结束。自定义组件可以自行安排气泡、按钮或其他呈现；默认规则不适用于它。
- signed step 统一进入 Core 的 nextTourStep；正数前进、负数后退、0 不执行步骤钩子，下越界到首步，上越界完成，非法数值拒绝。
- 默认气泡提供居中侧边、双向贴角、四个方向的可见区自动、auto 与 none 共 18 种 placement；只有默认组件使用这些位置及基础气泡样式。
- 为 Portal 显式登记 React／React DOM 类型开发依赖，根锁文件按相同版本去重，没有新增运行时依赖。
- 本次最终验证：interaction、DOM runtime、React integration、Vue integration、packaging 共 43 项通过，cafe 接入回归 4 项通过；包构建、cafe 类型检查及改动范围空白检查通过。未启动应用或进行浏览器视觉预览，未发布 npm。

## cafe 其他 RP 功能复查与气泡紧凑布局

检查范围为 cafe 实际消费的 RouterPro、查询／Tab hooks、历史状态、保留页、Markdown 链接、小可乐既有导航动作和覆盖层兄弟节点的生命周期。按检查标准 G01–G05、I11 和逻辑／生命周期相关条目检查；不是全仓库或浏览器视觉验收。

- 源码对照确认：本次 cafe 运行代码只替换覆盖层装配，导航适配、页面投影、Tab、白名单和保留页未重写。包内导航相关运行改动限 tour.next 的有符号步长，不改变页面导航提交。
- cafe 与服务端现有工具清单没有新增高亮／导览能力；小可乐原导航、打开聊天与提问链接保持原有入口。
- 新增实际挂载用例，验证重复查询参数、函数式更新、hash、replace、state、前进后退、页面局部状态及主题更新后的 Router 身份；非激活 overlay 不吞 Escape。
- 历史验证使用 BrowserRouter 的 entry index 与实际遍历回执，不假设 push 必须增加 history.length，因为已有前进栈会被截断。
- cafe 的 RouterPro、routerPlusIntegration、reader-markdown-links、chat-markdown 合计 36 项通过；assistant-browsing 中既有导航保持聊天的一项通过，共 37 项。包侧 DOM runtime 15 项通过，cafe TypeScript 与包构建通过。未发现本次调整引入其他 RP 功能回归。
- 普通默认气泡改为右上角有可访问名称的 ×，不占底部操作行；多步模式将关闭控件移出 DOM，只保留上下两个按钮。上下 padding 为 8px，正文／导览操作区间距为 4px，按钮上下 padding 为 2px。
- 未打开应用、浏览器预览或拍摄截图，未调用真实模型，未发布 npm。外观结论仅限源码调整，视觉效果由用户验收。

## 气泡间距修复复查

默认正文由 p 改为中性 div，避免宿主段落 margin 覆盖零优先级默认样式。正文与关闭按钮由同一 Grid 行垂直居中；上下内边距保持 8px，正文与多步操作区纵向 gap 为 4px。仅未隐藏的操作区设置 display:flex，隐藏区不占网格行或间距。无关闭按钮时使用单列，避免额外空列。样式继续可由 App 覆盖，自定义组件不受影响。

本次只修复源码及本地构建产物，不补发 npm。根 npm run build:packages 通过，核对 Router Plus 的 ESM 成品已包含中性正文容器和 Grid 布局。未运行测试、启动应用或进行浏览器视觉验收。
