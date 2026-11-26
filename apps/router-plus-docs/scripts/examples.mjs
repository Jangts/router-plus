// Router Plus 公开 API 的页面编排与场景示例。中文为源语言，英文在同结构中覆盖标题、导语、说明与示例。
// 该清单是「每个公开导出都有文档条目」校验的唯一真源，须与包导出保持一致。

const sharedOverlayTypes = [
  'OverlayTheme',
  'OverlayZIndexRange',
  'HighlightComponentProps',
  'HighlightComponentContext',
  'HighlightRectangle',
  'DefaultHighlightComponentProps',
  'DefaultHighlightStyles',
];

const sharedPages = [
  {
    slug: 'core',
    modules: ['.'],
    symbols: [
      'createRouterPlus',
      'RouterPlusImpl',
      'ROUTER_PLUS_VERSION',
      'ROUTER_PLUS_API_VERSION',
      'createPageLink',
      'parsePageLink',
      'attachGlobal',
      'detachGlobal',
      'DEFAULT_GLOBAL_KEY',
      'toGlobalFacade',
      'defaultMatcher',
      'RouteMatcher',
      'RouteMatch',
    ],
  },
  {
    slug: 'types',
    modules: ['.'],
    symbols: [
      'ParamValidator',
      'ParamSchema',
      'StateField',
      'StateValueOptions',
      'StateBindingOptions',
      'StateIdOrOptions',
      'StateAccessor',
      'StateInspection',
      'QueryRecord',
      'QueryEncoding',
      'PageTab',
      'InstanceKeyStrategy',
      'PageGuards',
      'GuardContext',
      'GuardResult',
      'PageDefinition',
      'PageCatalogEntry',
      'QueryPairs',
      'RouterLocation',
      'PageContext',
      'PageInstance',
      'PageMatch',
      'PageCatalog',
      'PageTarget',
      'LinkTarget',
      'LinkResolution',
      'NavigationPlan',
      'NavigateOptions',
      'ConnectionCapabilities',
      'CommitRequest',
      'CommitStatus',
      'CommitResult',
      'CommittedChange',
      'RouterConnection',
      'CommandReason',
      'CommandSuccess',
      'CommandFailure',
      'CommandResult',
      'CommandSequenceOptions',
      'CommandSequenceResult',
      'NavigationStatus',
      'NavigationResult',
      'RouterCommand',
      'RouterEvent',
      'TargetAnchor',
      'TargetRef',
      'HighlightPlacement',
      'HighlightOptions',
      'HighlightState',
      'TourStep',
      'TourState',
      'TourOptions',
      'FocusOptions',
      'ScrollOptions',
      'TargetResolver',
      'HighlightRenderer',
      'TargetRuntime',
      'ScrollStrategy',
      'LinkProtocol',
      'NavigationActionHandler',
      'NavigationActionRegistration',
      'PageStateBridge',
      'RouterPlusPluginApi',
      'GlobalGuard',
      'RetentionStrategy',
      'RouterPlusPlugin',
      'RouteTransformer',
      'RouterSnapshot',
      'InstanceHost',
      'PageLinkOptions',
      'CreateRouterPlusOptions',
      'RouterPlusHotModule',
      'RouterPlus',
      'RouterPlusGlobal',
    ],
  },
  {
    slug: 'react',
    modules: ['./react'],
    symbols: [
      'createReactRouterPlus',
      'CreateReactRouterPlusOptions',
      'ReactRouterTuple',
      'ReactRouterPlus',
      'createReactProvider',
      'usePlusContext',
      'ReactRouterHooks',
      'ReactRouterLocationLike',
      'RouterPlusProviderProps',
      'useRouterPlus',
      'usePageContext',
      'usePageMatch',
      'useRpState',
      'useReactState',
      'useRpRef',
      'useRpContext',
      'useRpCallback',
      'usePageQuery',
      'PageQueryInit',
      'SetPageQuery',
      'usePageLeaveGuard',
      'useHighlight',
      'useTour',
      'RouterPlusLink',
      'RouterPlusLinkProps',
      'RouterPlusRedirect',
      'RouterPlusRedirectProps',
      'RouterPlusScope',
      'RouterPlusBoundary',
      'RouterPlusBoundaryProps',
      'RouterPlusOutlet',
      'RouterPlusRetained',
      'RouterPlusRetainedProps',
      'RetainedHost',
      'createReactRoutes',
      'CreateReactRoutesOptions',
      'ReactRouteRecord',
      'RouteComponent',
      'RouterPlusOverlay',
      'RouterPlusOverlayProps',
      ...sharedOverlayTypes,
    ],
  },
  {
    slug: 'vue',
    modules: ['./vue'],
    symbols: [
      'createVueRouterPlus',
      'CreateVueRouterPlusOptions',
      'VueRouterPlus',
      'createVueConnection',
      'VueConnectionResult',
      'VueRouteLike',
      'VueRouterLike',
      'ROUTER_PLUS_KEY',
      'useRouterPlus',
      'usePageContext',
      'usePageMatch',
      'useRpRef',
      'useRpReactiveState',
      'useVueState',
      'useRpComputedState',
      'usePageQuery',
      'PageQueryInit',
      'usePageLeaveGuard',
      'useHighlight',
      'useTour',
      'RouterPlusLink',
      'RouterPlusRedirect',
      'RouterPlusView',
      'RouterPlusBoundary',
      'RouterPlusRetained',
      'createVueRoutes',
      'CreateVueRoutesOptions',
      'VueRouteRecord',
      'RouterPlusOverlay',
      ...sharedOverlayTypes,
    ],
  },
  {
    slug: 'overlay',
    modules: ['./overlay'],
    symbols: [
      'createDomRuntime',
      'DomRuntimeOptions',
      'installDomRuntime',
      'mountOverlay',
      'MountOverlayOptions',
      'installHistoryBridge',
      'overlayStyles',
      ...sharedOverlayTypes,
      'OverlayAppearanceOptions',
      'OverlayMount',
      'DEFAULT_OVERLAY_Z_INDEX',
      'OverlayHighlightRenderer',
      'createDefaultHighlightRenderer',
      'DefaultHighlightRenderer',
    ],
  },
  {
    slug: 'stores',
    modules: ['./stores/redux', './stores/zustand', './stores/jotai'],
    symbols: [
      'createRpZustand',
      'registerZustandState',
      'RpZustandCreator',
      'configureRpReduxStore',
      'registerReduxState',
      'ReduxStateOptions',
      'RpReduxCreator',
      'createRpJotaiAtom',
      'registerJotaiState',
      'JotaiStateOptions',
      'RpJotaiCreator',
    ],
  },
  {
    slug: 'testing',
    modules: ['./testing', './testing/vue', './testing/react'],
    symbols: [
      'createRouterPlusTest', 'RouterPlusTestOptions',
      'mountRouterPlus', 'MountRouterPlusOptions',
      'renderRouterPlus', 'RenderRouterPlusOptions',
      'createMemoryConnection',
      'MemoryConnection',
      'MemoryConnectionOptions',
      'createMemoryHost',
      'MemoryHost',
      'createFakeBridge',
      'FakeBridge',
    ],
  },
];

const strings = {
  zh: {
    core: {
      title: '核心 API',
      lead: '`createRouterPlus` 创建与框架无关的实例；页面目录、目标解析、命令、守卫、插件、状态与交互都由这一层拥有。框架适配和 DOM 能力从其他入口按需加载。',
      summaries: {
        createRouterPlus: '创建与框架无关的 Plus 实例；接收页面目录、插件、状态、连接与交互选项。',
        RouterPlusImpl:
          '`RouterPlus` 的默认实现类；通常通过 `createRouterPlus` 创建，不直接实例化。',
        ROUTER_PLUS_VERSION: '当前包的 semver 版本字符串。',
        ROUTER_PLUS_API_VERSION: '公开 API 合同版本，整数；当前为 `1`，与包版本无关。',
        createPageLink: '按 `pageLink` 配置把页面目标编码成语义链接。',
        parsePageLink: '解析语义链接并返回导航目标；解析本身不执行副作用。',
        attachGlobal: '把实例投影出的调试门面挂到指定全局属性；同名属性已存在时拒绝覆盖。',
        detachGlobal: '移除本实例安装的调试门面，不删除其他代码后来写入的值。',
        DEFAULT_GLOBAL_KEY: '浏览器默认调试门面名称 `__ROUTER_PLUS__`。',
        toGlobalFacade: '把实例投影为不含安装权限的调试门面。',
        defaultMatcher: '默认路径匹配器，支持普通命名参数与尾部 splat。',
        RouteMatcher: '路径匹配与 href 构造的接口；框架适配提供各自的原生实现。',
        RouteMatch: '默认匹配器返回的页面 id 与参数结果。',
      },
      notes: {
        'CreateRouterPlusOptions.hmr': '传入实例所属模块的热更新对象；省略或 false 时关闭。',
        'CreateRouterPlusOptions.pages': '固定的页面定义数组；id 默认取路径模板。',
        'CreateRouterPlusOptions.matcher': '省略时使用默认匹配器；框架适配会传入原生匹配器。',
        'CreateRouterPlusOptions.globalKey': '浏览器默认暴露调试门面；设为 `false` 关闭。',
        'CreateRouterPlusOptions.initialLocation': 'SSR 或 hydration 时在连接前建立初始地址。',
        'CreateRouterPlusOptions.navigationStrategy': '默认替换最新目标；`serial` 让请求串行执行。',
        'RouterPlus.navigate': '解析目标、执行守卫、提交一次历史并更新上下文与实例。',
        'RouterPlus.scope': '返回绑定到指定实例的稳定门面；隐藏实例仍保留自己的上下文。',
        'RouterPlus.snapshot': '捕获地址与支持的显式快照；原生状态 SSR 由应用的状态库负责。',
        'RouterPlus.whenReady': '等待初始安装、bridge 恢复和已排队的宿主生命周期工作。',
        'RouterPlus.dispose': '断开连接、取消交互、等待宿主与插件清理并使 scope 失效。',
      },
    },
    types: {
      title: '核心类型',
      lead: '页面定义、目标、命令回执、连接、插件与交互合同。应用通常只实现 `PageDefinition` 与少量连接或插件接口，其余类型用于标注回执和扩展点。',
      summaries: {
        StateInspection: '已登记来源的只读能力元数据，不含实时值或函数引用。',
        StateAccessor: '保留原生来源 receiver 的 get／可选 set 完整值访问器。',
        ParamValidator: '单参数校验函数；返回 `true` 或错误消息，返回字符串表示非法。',
        ParamSchema: '按路径参数名登记的可选校验表。',
        StateField: '页面导航状态声明。原生 hooks 的登记配置使用 StateBindingOptions。',
        StateBindingOptions: '原生初值之外的 ID、QS、枚举与整组编解码配置。',
        StateValueOptions: '一个完整字段的 QS、枚举与编解码配置；字段内部不递归展开。',
        StateIdOrOptions: '可选登记参数：字符串 ID 或有 ID 的配置对象。',
        PageTab: '普通 tab 状态的兼容声明。',
        InstanceKeyStrategy: '页面实例身份策略：pathname、page、指定参数或自定义函数。',
        PageGuards: '页面级离开、进入、进入后与保留生命周期守卫。',
        GuardContext: '守卫收到的页面上下文、页面定义与取消信号。',
        GuardResult: '守卫决定：放行、拒绝、重定向或带消息阻止。',
        PageDefinition: '调用方声明的页面定义；路由树与组件仍归应用。',
        PageCatalogEntry: '只含安全元数据的页面投影。',
        QueryPairs: '保留重复项与顺序的多值查询对。',
        RouterLocation: '地址快照，含历史条目身份与框架匹配。',
        PageContext: '当前页面上下文，包含页面、参数、查询、Tab 与实例。',
        PageInstance: '页面实例身份；页面 id、实例 key、状态 key 与历史条目彼此独立。',
        PageMatch: '一个地址与页面目录匹配的结果。',
        PageCatalog: '只读页面目录。',
        PageTarget: '导航目标：路径字符串、路径对象、地址对象或页面对象。',
        LinkTarget: '导航目标加显式业务 action。',
        LinkResolution: '链接解析结果：页面、外部地址或 action。',
        NavigationPlan: '不包含业务 action 的导航计划。',
        NavigateOptions: '传给底层 Router 的导航选项。',
        ConnectionCapabilities: '连接声明的原生拦截、遍历与历史观察能力。',
        CommitRequest: '交给框架连接的真实提交请求。',
        CommitStatus: '一次提交的状态。',
        CommitResult: '真实提交回执，成功时包含实际地址。',
        CommittedChange: '一次已提交的地址变化及其来源。',
        RouterConnection: '框架导航端口：初始快照、提交、订阅与可选遍历。',
        CommandReason: '命令失败原因枚举。',
        CommandSuccess: '命令成功结果。',
        CommandFailure: '命令失败结果，可带阶段与是否已提交。',
        CommandResult: '命令结果联合类型。',
        NavigationStatus: '导航状态。',
        NavigationResult: '带上下文、阶段、重定向与错误的导航结果。',
        CommandSequenceOptions: '编组的整组超时和取消信号。',
        CommandSequenceResult: '编组的逐步回执及失败位置。',
        RouterCommand: '可执行命令联合类型；typed 方法与 `execute` 共用处理器。',
        RouterEvent: '实例事件：地址、导航、Tab、状态、交互、保留与释放。',
        TargetAnchor: 'DOM 元素或几何锚点；canvas 区域也可作为目标。',
        TargetRef: '交互目标引用：id、选择器、元素、矩形或命名解析器输入。',
        HighlightPlacement: '高亮提示相对目标的位置。',
        HighlightOptions: '高亮消息、位置、聚光、超时、持续时间与交互选项。',
        HighlightState: '当前高亮状态。',
        TourStep: '导览步骤：目标、消息与推进方式。',
        TourState: '当前导览状态。',
        TourOptions: '导览回调、键盘、关闭与步骤前后钩子。',
        FocusOptions: '聚焦选项。',
        ScrollOptions: '滚动行为、对齐、偏移与容器选项。',
        TargetResolver: '自定义目标解析器。',
        HighlightRenderer: '高亮渲染器；挂载、渲染与销毁由覆盖层驱动。',
        TargetRuntime: 'DOM 目标运行时：解析、聚焦与滚动。',
        ScrollStrategy: '自定义滚动策略，可处理非原生滚动容器。',
        LinkProtocol: '链接协议解析器；同步解析且不执行副作用。',
        NavigationActionHandler: '业务 action 处理器。',
        NavigationActionRegistration: 'action 注册项。',
        PageStateBridge: 'delegated 状态桥；读写仍由调用方的状态库拥有。',
        RouterPlusPluginApi: '插件可用的注册接口。',
        GlobalGuard: '全局离开或进入守卫。',
        RetentionStrategy: '页面保留与淘汰策略。',
        RouterPlusPlugin: '插件声明：id、依赖、安装顺序与 setup。',
        RouteTransformer: '原生路由记录转换器。',
        RouterSnapshot: 'SSR 与 hydration 使用的快照。',
        InstanceHost: '框架适配层上报的实例宿主生命周期。',
        PageLinkOptions: '语义页面链接的 scheme 与字段配置。',
        CreateRouterPlusOptions: '`createRouterPlus` 的构造选项。',
        RouterPlusHotModule: '实例所属模块提供的热更新清理合同。',
        RouterPlus: '主实例合同。',
        RouterPlusGlobal: '浏览器调试门面合同；不构成权限边界。',
      },
      notes: {
        'PageDefinition.id': '省略时使用路径模板。',
        'PageDefinition.path': '路由模板，例如 `/beta/:id`。',
        'PageDefinition.params': '按参数名提供校验函数。',
        'PageDefinition.defaultTab': '兼容 tab 简写的默认值；普通页面状态默认值声明在 states 中。',
        'PageDefinition.tabs': '普通 tab 状态的兼容简写；页面原生状态使用 states 与同名来源 ID。',
        'PageDefinition.tabInUrl': '兼容 tab 简写的查询开关；原生来源通过 query 配置参数同步。',
        'PageDefinition.instanceKey': '默认按 pathname 区分实例。',
        'PageDefinition.retain': '保留实例；同时保留组件与 DOM 还需要渲染宿主。',
        'PageDefinition.meta': '应用元数据，不通过 `PageCatalog` 暴露。',
        'PageContext.query': '重复查询键请读取 `queryAll`。',
        'RouterLocation.matched': '框架提供的权威匹配优先于推断结果。',
        'CommandFailure.reason': '使用 `CommandReason` 区分守卫拒绝、取消、非法目标与缺少能力。',
      },
    },
    react: {
      title: 'React 入口',
      lead: '`@jangts/router-plus/react` 提供装配函数、Provider、hooks、链接、保留渲染、路由生成与覆盖层。React 与 React Router 保持可选 peer 依赖，入口不会加载 Vue。',
      summaries: {
        useRpState: '创建原生 React state，可选登记 ID／导航规则，返回原生 tuple。',
        useReactState: '登记已有 tuple、ref、callback 或访问器；返回 void，自动清理。',
        useRpRef: '创建原生 ref，可选登记访问入口。',
        useRpContext: '读取原生 context，可选登记只读来源。',
        useRpCallback: '创建原生 callback，可选登记 callState 调用入口。',
        createReactRouterPlus: '装配 React Router 与 Plus，返回带稳定 Provider 的实例。',
        CreateReactRouterPlusOptions:
          'React 装配选项；`router` 接受元素、构造函数元组或 Data Router。',
        ReactRouterTuple: '`[组件, props?]` 构造函数元组；props 从组件推断。',
        ReactRouterPlus: 'React 实例，额外提供 `Provider`。',
        createReactProvider: '用应用已有的原生 hooks 创建底层 Provider 组件。',
        usePlusContext: '读取最近 Provider 提供的 Plus 实例。',
        ReactRouterHooks: '适配原生 Router 所需的地址与导航 hooks。',
        ReactRouterLocationLike: '适配层可读取的地址对象。',
        RouterPlusProviderProps: 'Provider 属性。',
        useRouterPlus: '读取绑定到当前边界的 Plus 门面。',
        usePageContext: '订阅当前页面上下文。',
        usePageMatch: '读取当前页面匹配。',
        usePageQuery: '读取并更新查询参数。',
        PageQueryInit: '查询参数初始值。',
        SetPageQuery: '顺序合并同轮函数式修改，返回真实导航回执的查询参数写入口。',
        usePageLeaveGuard: '在组件生命周期内注册离开守卫。',
        useHighlight: '读取高亮状态并触发或清除高亮。',
        useTour: '读取导览状态并控制导览。',
        RouterPlusLink: '通过 Plus 解析目标的链接组件。',
        RouterPlusLinkProps: '链接组件属性。',
        RouterPlusRedirect: '声明式重定向组件。',
        RouterPlusRedirectProps: '重定向属性。',
        RouterPlusScope: '只绑定 Plus 上下文，不增加 DOM 或生命周期行为。',
        RouterPlusBoundary: '把子树绑定到显式上下文或当前实例，并登记 DOM 宿主。',
        RouterPlusBoundaryProps: '边界属性。',
        RouterPlusOutlet: '按保留策略缓存、冻结上下文并渲染页面实例。',
        RouterPlusRetained: '隐藏时继续挂载子树，使用最后的活动上下文。',
        RouterPlusRetainedProps: '保留容器属性。',
        RetainedHost: '仅负责显示／隐藏的 React 宿主组件，实例与缓存生命周期由库持有。',
        createReactRoutes: '由页面目录生成 React Router 路由记录。',
        CreateReactRoutesOptions: '路由生成选项：组件与布局映射、包装与转换。',
        ReactRouteRecord: '生成的 React 路由记录。',
        RouteComponent: '路由组件类型。',
        RouterPlusOverlay: '安装默认覆盖层与 DOM 目标运行时。',
        RouterPlusOverlayProps: '覆盖层属性。',
      },
      notes: {
        'CreateReactRouterPlusOptions.router':
          'JSX 元素、`[组件, props?]` 元组或 Data Router 实例。',
        'CreateReactRouterPlusOptions.hooks': '仅用于 JSX 或元组输入，适配应用已有地址 hooks。',
        'CreateReactRouterPlusOptions.plus': '传入已有 Core 实例时不再提供页面目录等构造选项。',
        'RouterPlusProviderProps.plus': '保持实例在渲染之间稳定，通常放在模块作用域。',
        'RouterPlusRetainedProps.active': '默认宿主在 false 时继续挂载；自定义宿主遵守其框架生命周期语义。',
      },
    },
    vue: {
      title: 'Vue 入口',
      lead: '`@jangts/router-plus/vue` 提供插件、composables、链接、保留视图、路由生成与覆盖层。`app.use(plus)` 同时安装 Vue Router 与 Plus 连接。',
      summaries: {
        useRpRef: '创建原生 Vue ref，可选登记 ID／导航规则。',
        useRpReactiveState: '创建原生 reactive 容器，可选登记访问入口。',
        useRpComputedState: '创建原生 computed，保留原生读写类型及能力。',
        useVueState: '登记已有 Vue 来源、callback 或访问器；返回 void，作用域自动清理。',
        createVueRouterPlus: '创建 Vue 插件并连接 Vue Router；返回的实例同时暴露 Core API。',
        CreateVueRouterPlusOptions: 'Vue 装配选项；传入 `router` 或复用已有 Core。',
        VueRouterPlus: 'Vue 实例，额外提供 `install`、`connection` 与兼容的 `plus` 引用。',
        createVueConnection: '单独构造 Vue Router 连接，可不经插件使用。',
        VueConnectionResult: 'Vue 连接、提交通知与清理函数。',
        VueRouteLike: 'Vue Router 路由的最小结构。',
        VueRouterLike: 'Vue Router 的最小结构；缺少可选方法时相应能力关闭。',
        ROUTER_PLUS_KEY: 'Vue `provide`／`inject` 使用的注入键。',
        useRouterPlus: '读取当前应用提供的 Plus 实例。',
        usePageContext: '订阅当前页面上下文的只读 ref。',
        usePageMatch: '读取当前页面匹配。',
        usePageQuery: '读取并更新查询参数，返回只读 ref 与 `setQuery`。',
        PageQueryInit: '查询参数初始值。',
        usePageLeaveGuard: '在组件作用域内注册离开守卫，卸载时自动移除。',
        useHighlight: '读取高亮状态并触发或清除高亮。',
        useTour: '读取导览状态并控制导览。',
        RouterPlusLink: 'Vue 链接组件。',
        RouterPlusRedirect: 'Vue 声明式重定向组件。',
        RouterPlusView: '包装 RouterView，按保留策略缓存实例并冻结作用域。',
        RouterPlusBoundary: '把子树绑定到显式上下文或当前实例。',
        RouterPlusRetained: '隐藏时继续挂载子树。',
        createVueRoutes: '由页面目录生成 Vue Router 路由记录。',
        CreateVueRoutesOptions: '路由生成选项：组件与布局映射、包装与转换。',
        VueRouteRecord: '生成的 Vue 路由记录。',
        RouterPlusOverlay: 'Vue 覆盖层组件，负责安装与清理默认覆盖层。',
      },
      notes: {
        'CreateVueRouterPlusOptions.router': '应用现有的 Vue Router 实例。',
        'CreateVueRouterPlusOptions.plus': '复用应用持有的 Core；工厂不再销毁它。',
        'VueRouterPlus.connection': '插件使用的底层连接，可用于排查或测试。',
      },
    },
    overlay: {
      title: '覆盖层入口',
      lead: '`@jangts/router-plus/overlay` 是浏览器专属入口，提供 DOM 目标运行时、默认覆盖层、原生历史桥与样式。只创建 Core 不会增加任何界面。',
      summaries: {
        createDomRuntime: '创建 DOM 目标运行时。',
        DomRuntimeOptions: 'DOM 运行时选项。',
        installDomRuntime: '向实例安装 DOM 目标能力，不安装默认覆盖层。',
        mountOverlay: '安装默认覆盖层渲染器与 DOM 运行时。',
        MountOverlayOptions: '覆盖层挂载选项：根节点、交互与是否安装运行时。',
        installHistoryBridge: '安装原生历史观察桥。',
        overlayStyles: '默认覆盖层样式文本；与 `overlay.css` 导出同源。',
      },
      notes: {
        'DomRuntimeOptions.root': '限制 DOM 目标解析范围的根节点。',
        'MountOverlayOptions.root': '覆盖层挂载的根节点；省略时使用文档 body。',
        'MountOverlayOptions.interactive': '允许与高亮内容交互。',
      },
    },
    stores: {
      title: '状态库接入',
      lead: 'Zustand、Redux Toolkit 和 Jotai 的创建包装与已有来源登记；原生状态库持有实时状态，Vue setup store 直接使用 composables。',
      summaries: {
        registerZustandState: '登记已有 Zustand store；普通对象 merge 保留动作，原生集合等根值完整替换，返回整组幂等注销函数。',
        registerReduxState:
          '登记已有 Redux store；默认只读，显式 set 适配业务写入，ID/dispatch 保留原生命令。',
        ReduxStateOptions: '通用登记规则及可选的完整 state 业务 set 适配。',
        registerJotaiState:
          '登记指定 store 的已有 atom；命令与显式 set 完整值赋值分开，返回整组注销函数。',
        JotaiStateOptions: '通用登记规则及可选的完整 atom 值 set 适配。',
        createRpZustand: '绑定原生 Zustand creator；创建后委托同一登记入口。',
        RpZustandCreator: '保留泛型、middleware 与 currying 的创建器类型。',
        configureRpReduxStore:
          '绑定 Redux Toolkit configure；在创建阶段准备完整值写入或采用业务 setter。',
        RpReduxCreator: '原生配置参数及可选登记规则。',
        createRpJotaiAtom: '绑定原生 atom 与指定 store，保留 atom 身份。',
        RpJotaiCreator: '保留 atom 初值、派生与自定义 write 重载的创建器。',
      },
      notes: {},
    },
    testing: {
      title: '测试工具',
      lead: '`@jangts/router-plus/testing` 提供无 DOM 消费端 fixture；`testing/vue` 和 `testing/react` 分别复用 Vue Test Utils 与 React Testing Library。完整接入见[消费端测试](../guide/testing)。',
      summaries: {
        createRouterPlusTest: '创建独立的无 DOM RP 测试 fixture。', RouterPlusTestOptions: '复用生产配置，使用 initial 指定初始地址。', mountRouterPlus: '装配 Vue Test Utils、RP 和原生内存路由。', MountRouterPlusOptions: 'Vue fixture 的路由与原生挂载选项。', renderRouterPlus: '装配 React Testing Library、RP 和原生内存路由。', RenderRouterPlusOptions: 'React fixture 的 UI 或 data routes 与原生渲染选项。',
        createMemoryConnection: '创建内存导航连接。',
        MemoryConnection: '内存连接接口：地址、历史、能力与手动变更。',
        MemoryConnectionOptions: '内存连接选项。',
        createMemoryHost: '创建内存实例宿主。',
        MemoryHost: '内存宿主接口。',
        createFakeBridge: '创建可观测的假状态桥。',
        FakeBridge: '假状态桥接口。',
      },
      notes: {
        'MemoryConnection.setLocation': '手动提交地址变化，用于模拟原生跳转。',
        'MemoryConnection.blockNext': '让下一次提交返回 blocked。',
      },
    },
  },
  en: {
    core: {
      title: 'Core API',
      lead: '`createRouterPlus` creates a framework-independent instance. The page catalog, target resolution, commands, guards, plugins, state and interactions live here; framework adapters and DOM capabilities load from separate entries.',
      summaries: {
        createRouterPlus:
          'Create a framework-independent Plus instance from pages, plugins, state, connection and interaction options.',
        RouterPlusImpl:
          'Default `RouterPlus` implementation; normally created through `createRouterPlus` rather than directly.',
        ROUTER_PLUS_VERSION: 'Current package semver string.',
        ROUTER_PLUS_API_VERSION:
          'Public API contract version, an integer. It is `1` and independent of package semver.',
        createPageLink:
          'Encode a page target as a semantic link using the configured `pageLink` scheme.',
        parsePageLink: 'Parse a semantic link into a navigation target without executing effects.',
        attachGlobal:
          'Attach the instance debug facade to a global property; an occupied key is rejected.',
        detachGlobal:
          'Remove the facade installed by this instance without deleting values written later.',
        DEFAULT_GLOBAL_KEY: 'Default browser facade name: `__ROUTER_PLUS__`.',
        toGlobalFacade: 'Project an instance into a debug facade without installation privileges.',
        defaultMatcher:
          'Default path matcher supporting ordinary named parameters and a trailing splat.',
        RouteMatcher:
          'Path matching and href construction interface; framework adapters supply native implementations.',
        RouteMatch: 'Page id and parameters returned by the default matcher.',
      },
      notes: {
        'CreateRouterPlusOptions.hmr':
          'Hot object of the owning module; omitted or false disables integration.',
        'CreateRouterPlusOptions.pages':
          'Fixed array of page definitions; an id defaults to the path template.',
        'CreateRouterPlusOptions.matcher':
          'Defaults to the built-in matcher; framework adapters pass their native one.',
        'CreateRouterPlusOptions.globalKey':
          'Exposed in browsers by default; set `false` to disable.',
        'CreateRouterPlusOptions.initialLocation':
          'Establishes an initial address before connection for SSR or hydration.',
        'CreateRouterPlusOptions.navigationStrategy':
          'Replaces the latest target by default; `serial` runs requests in order.',
        'RouterPlus.navigate':
          'Resolves the target, runs guards, commits one history entry and updates context and instance.',
        'RouterPlus.scope':
          'Returns a stable facade bound to an instance; hidden instances keep their own context.',
        'RouterPlus.snapshot':
          'Captures addresses and supported explicit snapshots; native state SSR remains application-owned.',
        'RouterPlus.whenReady':
          'Waits for initial installation, bridge restoration and queued host lifecycle work.',
        'RouterPlus.dispose':
          'Disconnects, cancels interactions, awaits host and plugin cleanup and invalidates scopes.',
      },
    },
    types: {
      title: 'Core types',
      lead: 'Page definitions, targets, command receipts, connections, plugins and interaction contracts. Applications usually implement `PageDefinition` plus a few connection or plugin interfaces; the remaining types annotate receipts and extension points.',
      summaries: {
        StateInspection:
          'Readonly installed-source metadata without values or executable references.',
        StateAccessor: 'Receiver-safe getter with an optional complete-value setter.',
        ParamValidator:
          'Per-parameter validator; return `true` or a message. A returned string means invalid.',
        ParamSchema: 'Optional validator table keyed by route template parameter.',
        StateField:
          'Defaults, allowed values, validation and optional query binding for registered state.',
        PageTab: 'Compatibility declaration for ordinary tab state.',
        InstanceKeyStrategy:
          'Instance identity: pathname, page, selected parameters or a custom function.',
        PageGuards: 'Page-level leave, enter, after-enter and retention lifecycle guards.',
        GuardContext: 'Page context, page definition and cancellation signal passed to a guard.',
        GuardResult: 'Guard decision: allow, reject, redirect or block with a message.',
        PageDefinition:
          'Page definition supplied by the caller; route trees and components stay in the application.',
        PageCatalogEntry: 'Sanitized page projection containing safe metadata only.',
        QueryPairs: 'Ordered multi-value query pairs that preserve duplicates.',
        RouterLocation: 'Address snapshot with history entry identity and framework matches.',
        PageContext: 'Current page context with page, params, query, tab and instance.',
        PageInstance:
          'Page instance identity; page id, instance key, state key and history entry stay separate.',
        PageMatch: 'Result of matching one address against the page catalog.',
        PageCatalog: 'Read-only page catalog.',
        PageTarget: 'Navigation target: path string, path object, address object or page object.',
        LinkTarget: 'Navigation target plus an explicit business action.',
        LinkResolution: 'Resolved link: page, external href or action.',
        NavigationPlan: 'Navigation plan that never contains a business action.',
        NavigateOptions: 'Navigation options passed through to the native router.',
        ConnectionCapabilities:
          'Native interception, traversal and history observation declared by a connection.',
        CommitRequest: 'Real commit request handed to the framework connection.',
        CommitStatus: 'Status of one commit.',
        CommitResult: 'Real commit receipt; successful results include the actual location.',
        CommittedChange: 'One committed address change and its source.',
        RouterConnection:
          'Framework navigation port: initial snapshot, commit, subscribe and optional traversal.',
        CommandReason: 'Reason codes for command failures.',
        CommandSuccess: 'Successful command result.',
        CommandFailure: 'Failed command result, optionally with a stage and committed flag.',
        CommandResult: 'Command result union.',
        NavigationStatus: 'Navigation status.',
        NavigationResult: 'Navigation result with context, stage, redirect and error.',
        CommandSequenceOptions: 'Total group deadline and cancellation signal.',
        CommandSequenceResult: 'Completed step receipts and the stopped step index.',
        RouterCommand: 'Executable command union; typed methods and `execute` share handlers.',
        RouterEvent:
          'Instance events: location, navigation, tab, state, interaction, retain and release.',
        TargetAnchor: 'DOM element or geometric anchor; a canvas region can be a target.',
        TargetRef:
          'Interaction target reference: id, selector, element, rect or named resolver input.',
        HighlightPlacement: 'Placement of a highlight message relative to its target.',
        HighlightOptions:
          'Highlight message, placement, spotlight, timeout, duration and interaction options.',
        HighlightState: 'Current highlight state.',
        TourStep: 'Tour step with target, message and progression mode.',
        TourState: 'Current tour state.',
        TourOptions: 'Tour callbacks, keyboard, dismissal and step hooks.',
        FocusOptions: 'Focus options.',
        ScrollOptions: 'Scroll behavior, alignment, offset and container options.',
        TargetResolver: 'Custom target resolver.',
        HighlightRenderer: 'Highlight renderer mounted, rendered and destroyed by the overlay.',
        TargetRuntime: 'DOM target runtime: resolve, focus and scroll.',
        ScrollStrategy: 'Custom scroll strategy for non-native scrolling containers.',
        LinkProtocol: 'Link protocol parser; synchronous and free of side effects.',
        NavigationActionHandler: 'Business action handler.',
        NavigationActionRegistration: 'Action registration entry.',
        PageStateBridge:
          'Delegated state bridge; the caller-owned store remains the source of truth.',
        RouterPlusPluginApi: 'Registration API available to plugins.',
        GlobalGuard: 'Global leave or enter guard.',
        RetentionStrategy: 'Page retention and eviction strategy.',
        RouterPlusPlugin: 'Plugin declaration: id, dependencies, ordering and setup.',
        RouteTransformer: 'Native route record transformer.',
        RouterSnapshot: 'Snapshot used for SSR and hydration.',
        InstanceHost: 'Instance host lifecycle reported by framework adapters.',
        PageLinkOptions: 'Scheme and field configuration for semantic page links.',
        CreateRouterPlusOptions: 'Construction options for `createRouterPlus`.',
        RouterPlusHotModule:
          'Structural disposal contract supplied by the instance-owning HMR module.',
        RouterPlus: 'Main instance contract.',
        RouterPlusGlobal: 'Browser debug facade contract; not an authorization boundary.',
      },
      notes: {
        'PageDefinition.id': 'Defaults to the path template.',
        'PageDefinition.path': 'Route template, for example `/beta/:id`.',
        'PageDefinition.params': 'Validators keyed by parameter name.',
        'PageDefinition.defaultTab':
          'Default for the tab shorthand; ordinary address defaults belong in states.',
        'PageDefinition.tabs':
          'Compatibility shorthand for ordinary tab state; use states and matching native source IDs for application state.',
        'PageDefinition.tabInUrl':
          'Query switch for the tab shorthand; native sources declare query synchronization in their registration options.',
        'PageDefinition.state':
          'Owned state seed; may also declare session persistence and migration.',
        'PageDefinition.instanceKey': 'Instances are distinguished by pathname by default.',
        'PageDefinition.retain':
          'Retains the instance; keeping component and DOM also needs a rendering host.',
        'PageDefinition.meta': 'Application metadata that is never exposed through `PageCatalog`.',
        'PageContext.query': 'Read `queryAll` when duplicate query keys matter.',
        'RouterLocation.matched':
          'Authoritative framework matches take precedence over inferred ones.',
        'CommandFailure.reason':
          'Use `CommandReason` to distinguish guard rejection, cancellation, invalid targets and missing capabilities.',
      },
    },
    react: {
      title: 'React entry',
      lead: '`@jangts/router-plus/react` provides assembly, a Provider, hooks, links, retained rendering, route generation and the overlay. React and React Router remain optional peers; the entry never loads Vue.',
      summaries: {
        useRpState:
          'Create native React state with optional source registration; return the native tuple.',
        useReactState:
          'Register an existing tuple, ref, callback or accessor; return void and clean up automatically.',
        useRpRef: 'Create a native ref with optional source registration.',
        useRpContext: 'Read native context with optional readonly registration.',
        useRpCallback: 'Create a native callback with optional callState registration.',
        createReactRouterPlus:
          'Assemble React Router and Plus; returns an instance with a stable Provider.',
        CreateReactRouterPlusOptions:
          'React assembly options; `router` accepts an element, constructor tuple or Data Router.',
        ReactRouterTuple:
          '`[component, props?]` constructor tuple with props inferred from the component.',
        ReactRouterPlus: 'React instance with an additional `Provider`.',
        createReactProvider: 'Create the low-level Provider from the application’s native hooks.',
        usePlusContext: 'Read the Plus instance provided by the nearest Provider.',
        ReactRouterHooks: 'Native location and navigation hooks used by the adapter.',
        ReactRouterLocationLike: 'Address object readable by the adapter.',
        RouterPlusProviderProps: 'Provider props.',
        useRouterPlus: 'Read the Plus facade bound to the nearest boundary.',
        usePageContext: 'Subscribe to the current page context.',
        usePageMatch: 'Read the current page match.',
        usePageQuery: 'Read and update query parameters.',
        PageQueryInit: 'Initial query value.',
        SetPageQuery: 'Query writer that merges same-turn functional edits and returns a navigation receipt.',
        usePageLeaveGuard: 'Register a leave guard for the component lifetime.',
        useHighlight: 'Read highlight state and trigger or clear a highlight.',
        useTour: 'Read tour state and control the tour.',
        RouterPlusLink: 'Link component that resolves its target through Plus.',
        RouterPlusLinkProps: 'Link component props.',
        RouterPlusRedirect: 'Declarative redirect component.',
        RouterPlusRedirectProps: 'Redirect props.',
        RouterPlusScope: 'Binds Plus context only, without DOM or lifecycle behavior.',
        RouterPlusBoundary:
          'Binds a subtree to an explicit context or the current instance and registers its DOM host.',
        RouterPlusBoundaryProps: 'Boundary props.',
        RouterPlusOutlet:
          'Caches, freezes context and renders page instances according to retention.',
        RouterPlusRetained: 'Keeps a subtree mounted while hidden using its last active context.',
        RouterPlusRetainedProps: 'Retained container props.',
        RetainedHost: 'React presentation host; instance identity, cache and release remain library-owned.',
        createReactRoutes: 'Generate React Router records from the page catalog.',
        CreateReactRoutesOptions:
          'Route generation options: component and layout maps, wrappers and transforms.',
        ReactRouteRecord: 'Generated React route record.',
        RouteComponent: 'Route component type.',
        RouterPlusOverlay: 'Install the default overlay and DOM target runtime.',
        RouterPlusOverlayProps: 'Overlay props.',
      },
      notes: {
        'CreateReactRouterPlusOptions.router':
          'A JSX element, `[component, props?]` tuple or Data Router instance.',
        'CreateReactRouterPlusOptions.hooks':
          'Only for JSX or tuple input; adapts existing application hooks.',
        'CreateReactRouterPlusOptions.plus':
          'When reusing a Core instance, omit page catalog and other construction options.',
        'RouterPlusProviderProps.plus':
          'Keep the instance stable across renders, usually at module scope.',
        'RouterPlusRetainedProps.active': 'The default host stays mounted while false; custom hosts retain their framework lifecycle semantics.',
      },
    },
    vue: {
      title: 'Vue entry',
      lead: '`@jangts/router-plus/vue` provides the plugin, composables, links, retained views, route generation and overlay. `app.use(plus)` installs both Vue Router and the Plus connection.',
      summaries: {
        useRpRef: 'Create a native Vue ref with optional registration and query rules.',
        useRpReactiveState: 'Create a native reactive container with optional registration.',
        useRpComputedState:
          'Create native computed values while preserving read/write types and capabilities.',
        useVueState:
          'Register existing Vue sources, callbacks or accessors; return void with effect-scope cleanup.',
        createVueRouterPlus:
          'Create the Vue plugin and connect Vue Router; the result also exposes the Core API.',
        CreateVueRouterPlusOptions:
          'Vue assembly options; pass `router` or reuse an existing Core.',
        VueRouterPlus:
          'Vue instance with `install`, `connection` and a compatibility `plus` reference.',
        createVueConnection: 'Build a Vue Router connection usable without the plugin.',
        VueConnectionResult: 'Vue connection, commit notification and cleanup.',
        VueRouteLike: 'Minimal Vue Router route shape.',
        VueRouterLike:
          'Minimal Vue Router shape; missing optional methods disable those capabilities.',
        ROUTER_PLUS_KEY: 'Injection key for Vue `provide`/`inject`.',
        useRouterPlus: 'Read the Plus instance provided by the application.',
        usePageContext: 'Subscribe to a read-only ref of the current page context.',
        usePageMatch: 'Read the current page match.',
        usePageQuery: 'Read and update query parameters through a read-only ref and `setQuery`.',
        PageQueryInit: 'Initial query value.',
        usePageLeaveGuard:
          'Register a leave guard in the component scope; it is removed on unmount.',
        useHighlight: 'Read highlight state and trigger or clear a highlight.',
        useTour: 'Read tour state and control the tour.',
        RouterPlusLink: 'Vue link component.',
        RouterPlusRedirect: 'Vue declarative redirect component.',
        RouterPlusView:
          'Wraps RouterView, caches instances by retention and freezes scope providers.',
        RouterPlusBoundary: 'Binds a subtree to an explicit context or the current instance.',
        RouterPlusRetained: 'Keeps a subtree mounted while hidden.',
        createVueRoutes: 'Generate Vue Router records from the page catalog.',
        CreateVueRoutesOptions:
          'Route generation options: component and layout maps, wrappers and transforms.',
        VueRouteRecord: 'Generated Vue route record.',
        RouterPlusOverlay: 'Vue overlay component that installs and cleans up the default overlay.',
      },
      notes: {
        'CreateVueRouterPlusOptions.router': 'The app’s existing Vue Router instance.',
        'CreateVueRouterPlusOptions.plus':
          'Reuse an application-owned Core; the factory will not dispose it.',
        'VueRouterPlus.connection':
          'The connection used by the plugin, useful for diagnostics or tests.',
      },
    },
    overlay: {
      title: 'Overlay entry',
      lead: '`@jangts/router-plus/overlay` is the browser-only entry for the DOM target runtime, default overlay, raw history bridge and styles. Constructing Core alone adds no UI.',
      summaries: {
        createDomRuntime: 'Create the DOM target runtime.',
        DomRuntimeOptions: 'DOM runtime options.',
        installDomRuntime: 'Install DOM target capabilities without the default overlay.',
        mountOverlay: 'Install the default overlay renderer and DOM runtime.',
        MountOverlayOptions: 'Overlay mount options: root, interaction and runtime installation.',
        installHistoryBridge: 'Install the raw history observation bridge.',
        overlayStyles:
          'Default overlay style text; shares one source with the `overlay.css` export.',
      },
      notes: {
        'DomRuntimeOptions.root': 'Root that limits DOM target resolution.',
        'MountOverlayOptions.root': 'Root for the overlay; the document body is used when omitted.',
        'MountOverlayOptions.interactive': 'Allow interaction with highlighted content.',
      },
    },
    stores: {
      title: 'Store integration',
      lead: 'Creation wrappers and existing-source registration for Zustand, Redux Toolkit and Jotai. Native stores own live state; Vue setup stores use composables directly.',
      summaries: {
        registerZustandState:
          'Index an existing Zustand store; plain records merge while native root values replace, with idempotent cleanup.',
        registerReduxState:
          'Index an existing Redux store, readonly unless a business set adapter is supplied; expose native ID/dispatch.',
        ReduxStateOptions: 'Registration rules with an optional complete-state business setter.',
        registerJotaiState:
          'Index an atom in the supplied store; native commands and opt-in complete-value assignment remain distinct.',
        JotaiStateOptions: 'Registration rules with an optional complete-atom-value setter.',
        createRpZustand:
          'Bind a native Zustand creator and delegate to the shared registrar after creation.',
        RpZustandCreator: 'Creator preserving generics, middleware and currying.',
        configureRpReduxStore:
          'Bind native configure and prepare a creation-time writer or use the business setter.',
        RpReduxCreator: 'Native configuration with optional registration rules.',
        createRpJotaiAtom:
          'Bind the native atom factory and explicit store while preserving atom identity.',
        RpJotaiCreator:
          'Creator preserving initial-value, derived and custom-write atom overloads.',
      },
      notes: {},
    },
    testing: {
      title: 'Testing utilities',
      lead: '`@jangts/router-plus/testing` provides DOM-free consumer fixtures; `testing/vue` and `testing/react` reuse Vue Test Utils and React Testing Library. See [consumer testing](../guide/testing) for setup and batch examples.',
      summaries: {
        createRouterPlusTest: 'Create an independent DOM-free RP fixture.', RouterPlusTestOptions: 'Production configuration with one initial address.', mountRouterPlus: 'Mount Vue Test Utils with RP and native memory routing.', MountRouterPlusOptions: 'Vue routes and native mounting options.', renderRouterPlus: 'Render React Testing Library with RP and native memory routing.', RenderRouterPlusOptions: 'React UI or data routes and native rendering options.',
        createMemoryConnection: 'Create an in-memory navigation connection.',
        MemoryConnection:
          'Memory connection interface: location, history, capabilities and manual changes.',
        MemoryConnectionOptions: 'Memory connection options.',
        createMemoryHost: 'Create an in-memory instance host.',
        MemoryHost: 'Memory host interface.',
        createFakeBridge: 'Create an observable fake state bridge.',
        FakeBridge: 'Fake state bridge interface.',
      },
      notes: {
        'MemoryConnection.setLocation':
          'Commit a location change manually to simulate native navigation.',
        'MemoryConnection.blockNext': 'Make the next commit return blocked.',
      },
    },
  },
};

const overlayDescriptions = {
  zh: {
    OverlayTheme: 'App 控制的覆盖层层级、遮罩与默认组件外观。',
    OverlayZIndexRange: '默认层级的包含式 min／max 范围。',
    HighlightComponentProps:
      '默认与自定义高亮共用的 width、height、left、top、context 五参数合同。',
    HighlightComponentContext: '目标矩形、页面／高亮／导览状态、overlayRoot 与 next(step = 1)。',
    HighlightRectangle: '测量后的宽高及视口坐标，单位为像素。',
    DefaultHighlightComponentProps: '内置组件参数，在通用五参数之外接收 styles。',
    DefaultHighlightStyles: '仅用于内置高亮和气泡的样式参数，不包含公共层级策略。',
    OverlayAppearanceOptions: '实时可更新的外观、交互与高亮组件注册。',
    OverlayMount: '可调用的清理句柄，通过 update 替换展示配置。',
    DEFAULT_OVERLAY_Z_INDEX: '覆盖层默认高层级 10000，由 App 固定值或范围约束。',
    OverlayHighlightRenderer: '只绘制高亮内容的挂载／更新／清理接口，宽高位置由 Plus 控制。',
    createDefaultHighlightRenderer: '创建接收统一参数和额外样式的默认高亮组件实现。',
    DefaultHighlightRenderer: '内置高亮组件渲染接口及其默认气泡节点。',
  },
  en: {
    OverlayTheme: 'App-owned overlay stacking, mask and built-in component appearance.',
    OverlayZIndexRange: 'Inclusive min/max bounds on the default stacking level.',
    HighlightComponentProps:
      'Shared width, height, left, top and context contract for default/custom highlights.',
    HighlightComponentContext:
      'Target bounds, page/highlight/tour state, overlayRoot and next(step = 1).',
    HighlightRectangle: 'Measured pixel dimensions and viewport position.',
    DefaultHighlightComponentProps: 'Shared component props plus optional built-in styles.',
    DefaultHighlightStyles: 'Built-in highlight/bubble styles, excluding shared stacking policy.',
    OverlayAppearanceOptions: 'Live appearance, interaction and highlight registration options.',
    OverlayMount: 'Callable cleanup handle with update for replacing presentation options.',
    DEFAULT_OVERLAY_Z_INDEX:
      'High default stacking level 10000, constrained by App values or bounds.',
    OverlayHighlightRenderer: 'Content mount/render/destroy port; Plus owns measured geometry.',
    createDefaultHighlightRenderer:
      'Create the built-in highlight using shared props and extra styles.',
    DefaultHighlightRenderer: 'Built-in component renderer and its default bubble node.',
  },
};

function buildPages(locale) {
  return sharedPages.map((page) => {
    const text = strings[locale][page.slug];
    return {
      slug: page.slug,
      modules: page.modules,
      symbols: page.symbols,
      title: text.title,
      lead: text.lead,
      summaries: { ...overlayDescriptions[locale], ...text.summaries },
      notes: Object.assign({}, ...Object.values(strings[locale]).map((section) => section.notes)),
    };
  });
}

export const pages = buildPages('zh');
export const englishPages = buildPages('en');

const pageExamplesChinese = {
  core: `
\`\`\`ts
import { createRouterPlus } from '@jangts/router-plus';
import { createMemoryConnection } from '@jangts/router-plus/testing';

const plus = createRouterPlus({
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

plus.connect(createMemoryConnection({ initial: { pathname: '/alpha' } }));
const result = await plus.navigate({ path: '/beta/42' });
if (!result.ok) console.error(result.reason, result.message);
\`\`\`

### 目标与链接

\`\`\`ts
plus.resolveHref({ page: 'beta', params: { id: '42' }, values: { section: 'details' } });
plus.resolveLink({ action: 'open-settings', payload: { section: 'profile' } });
\`\`\`

页面对象按 id 解析，路径对象可指向未登记的地址。解析目标是同步的，不执行守卫、跳转或 action；只有命令才产生副作用。

### 调试门面

浏览器中默认挂载 \`__ROUTER_PLUS__\`，可读取上下文并执行命令。它只用于调试，不作为授权边界；设置 \`globalKey: false\` 可关闭。
`,
  react: `
\`\`\`tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createReactRouterPlus, RouterPlusLink, RouterPlusRedirect } from '@jangts/router-plus/react';

const plus = createReactRouterPlus({
  router: <BrowserRouter />,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

function App() {
  return (
    <>
      <RouterPlusLink to="/beta/42">打开 Beta</RouterPlusLink>
      <Routes>
        <Route path="/" element={<RouterPlusRedirect to="/alpha" />} />
        <Route path="/alpha" element={<p>Alpha</p>} />
        <Route path="/beta/:id" element={<p>Beta</p>} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <plus.Provider><App /></plus.Provider>,
);
\`\`\`

### 页面内读取状态

\`\`\`tsx
import { useRpState, usePageQuery } from '@jangts/router-plus/react';

function Alpha() {
  const [state, setState] = useRpState({ count: 0 }, 'counter');
  const [section, setSection] = useRpState('summary', { id: 'section', query: true, values: ['summary', 'details'] });
  const [query, setQuery] = usePageQuery();

  return (
    <section>
      <p>{state.count}</p>
      <button onClick={() => setState({ count: state.count + 1 })}>+1</button>
      <button onClick={() => setSection('details')}>{section}</button>
      <button onClick={() => setQuery({ page: '2' })}>{query.get('page') ?? '1'}</button>
    </section>
  );
}
\`\`\`

### Data Router

React Router DOM >=6.4

\`\`\`tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
\`\`\`

Data Router 的页面放在原路由记录里，Provider 不接收 children；loader、重定向与原生路由组织仍由 React Router 负责。原生拦截还要求所传路由具备 blocker API；缺失时仍能检查 Plus 发起的导航。

### 已有来源

\`\`\`tsx
import { useState } from 'react';
import { useReactState } from '@jangts/router-plus/react';
function Counter() {
  const state = useState(0);
  useReactState(state, { id: 'count', query: true });
  useReactState({ get: () => state[0] * 2 }, 'doubled');
  return <button onClick={() => state[1](n => n + 1)}>{state[0]}</button>;
}
\`\`\`
`,
  vue: `
\`\`\`ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory, useRoute } from 'vue-router';
import { createVueRouterPlus, RouterPlusLink, RouterPlusView } from '@jangts/router-plus/vue';

const Page = defineComponent({
  setup() {
    const route = useRoute();
    return () => h('p', route.path);
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/alpha' },
    { path: '/alpha', component: Page },
    { path: '/beta/:id', component: Page },
  ],
});

const plus = createVueRouterPlus({
  router,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

createApp({
  render: () => h('main', [h(RouterPlusLink, { to: '/beta/42' }, () => '打开 Beta'), h(RouterPlusView)]),
}).use(plus).mount('#app');
\`\`\`

### 组合式读取状态

\`\`\`ts
import { useRpRef, usePageQuery } from '@jangts/router-plus/vue';

const state = useRpRef({ count: 0 }, 'counter');
const section = useRpRef('summary', { id: 'section', query: true, values: ['summary', 'details'] });
const { query, setQuery } = usePageQuery();
\`\`\`

\`app.use(plus)\` 同时安装 Vue Router 与 Plus 连接；应用卸载会清理适配层订阅，并销毁工厂创建的 Core。

### 已有来源

\`\`\`ts
import { ref, reactive } from 'vue';
import { useVueState } from '@jangts/router-plus/vue';
// setup() / setup store
const count = ref(0);
const filter = reactive({ category: 'all' });
useVueState(count, 'count');
useVueState(filter, { id: 'filter', query: true });
const applyPatch = async (fields: Record<string, unknown>) => ({ applied: Object.keys(fields), conflicts: [] });
useVueState(applyPatch, 'applyPatch');
const receipt = await plus.callState('applyPatch', { name: 'Summer' });
\`\`\`
`,
  overlay: `
\`\`\`tsx
import { RouterPlusOverlay } from '@jangts/router-plus/react';

<RouterPlusOverlay theme={{ zIndex: { max: 59 }, highlightPadding: 4 }} />
\`\`\`

安装后可使用显式目标：

\`\`\`ts
await plus.highlight({ selector: '#controls' }, { message: '操作区', spotlight: true });
await plus.clearHighlight();

await plus.startTour([
  { target: { selector: '#controls' }, message: '选择一个选项' },
  { target: { selector: '#content' }, message: '查看结果' },
]);
\`\`\`

只安装 DOM 能力而不使用默认覆盖层：

\`\`\`ts
import { installDomRuntime } from '@jangts/router-plus/overlay';

const stop = installDomRuntime(plus, { root: document.getElementById('app') ?? undefined });
\`\`\`

运行时注入的样式与 \`@jangts/router-plus/overlay.css\` 来自同一来源，任选其一即可。自定义组件、五参数接口、气泡位置与 next 步长详见[高亮与导览](../guide/interactions)。
`,
  stores: `
\`\`\`ts
import { createStore } from 'zustand/vanilla';
import { createRouterPlus } from '@jangts/router-plus';
import { createRpZustand } from '@jangts/router-plus/stores/zustand';

const plus = createRouterPlus({ pages: [], globalKey: false });
const create = createRpZustand(plus, createStore);
const counter = create<{ count: number; increment(): void }>()((set) => ({ count: 0, increment: () => set(s => ({ count: s.count + 1 })) }), 'counter');
await plus.setState(2, 'counter/count');
await plus.callState('counter/increment');
await plus.dispose();
\`\`\`

### 已有 Store

\`\`\`ts
import { configureStore } from '@reduxjs/toolkit';
import { registerReduxState } from '@jangts/router-plus/stores/redux';
import { atom, createStore as createAtomStore } from 'jotai/vanilla';
import { registerJotaiState } from '@jangts/router-plus/stores/jotai';
const redux = configureStore({ reducer: (state = 0, action) =>
  action.type === 'restore' ? Number(action.payload) : state });
const stopRedux = registerReduxState(plus, redux, {
  id: 'redux', set: next => { redux.dispatch({ type: 'restore', payload: next }); },
});
const store = createAtomStore();
const count = atom(0);
const stopAtom = registerJotaiState(plus, store, count, {
  id: 'atom', set: next => { store.set(count, next); },
});
stopAtom();
stopRedux();
\`\`\`

已有 Zustand 使用 \`registerZustandState(plus, store, options)\`。三个 register 均返回幂等 stop，RP dispose 兜底。已有 Redux 默认只读并提供 ID/dispatch；已有 Jotai writable atom 默认只有 callState 命令能力。两者完整值赋值／QS 均需显式 set(next)。创建器仅在明确的构造分支准备默认 writer。
`,
  testing: `
\`\`\`ts
import { createMemoryConnection, createMemoryHost } from '@jangts/router-plus/testing';
import { createRouterPlus } from '@jangts/router-plus';

const connection = createMemoryConnection({ initial: { pathname: '/alpha' } });
const plus = createRouterPlus({ pages, globalKey: false });
plus.connect(connection);

const host = createMemoryHost();
const stop = plus.registerHost(host);
await plus.whenReady();

connection.setLocation({ pathname: '/beta/42' });
\`\`\`

\`createFakeBridge(initial)\` 返回可读写的假状态桥，用于验证 delegation、快照和通知行为，不依赖任何状态库。
`,
  types: '',
};

const pageExamplesEnglish = {
  core: `
\`\`\`ts
import { createRouterPlus } from '@jangts/router-plus';
import { createMemoryConnection } from '@jangts/router-plus/testing';

const plus = createRouterPlus({
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

plus.connect(createMemoryConnection({ initial: { pathname: '/alpha' } }));
const result = await plus.navigate({ path: '/beta/42' });
if (!result.ok) console.error(result.reason, result.message);
\`\`\`

### Targets and links

\`\`\`ts
plus.resolveHref({ page: 'beta', params: { id: '42' }, values: { section: 'details' } });
plus.resolveLink({ action: 'open-settings', payload: { section: 'profile' } });
\`\`\`

Page objects resolve by id; path objects may point outside the catalog. Resolution is synchronous and executes no guards, navigation or actions; only commands have side effects.

### Debug facade

Browsers expose \`__ROUTER_PLUS__\` by default for reading context and running commands. It is a debug surface, not an authorization boundary; set \`globalKey: false\` to disable it.
`,
  react: `
\`\`\`tsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createReactRouterPlus, RouterPlusLink, RouterPlusRedirect } from '@jangts/router-plus/react';

const plus = createReactRouterPlus({
  router: <BrowserRouter />,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

function App() {
  return (
    <>
      <RouterPlusLink to="/beta/42">Open Beta</RouterPlusLink>
      <Routes>
        <Route path="/" element={<RouterPlusRedirect to="/alpha" />} />
        <Route path="/alpha" element={<p>Alpha</p>} />
        <Route path="/beta/:id" element={<p>Beta</p>} />
      </Routes>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <plus.Provider><App /></plus.Provider>,
);
\`\`\`

### Reading state inside a page

\`\`\`tsx
import { useRpState, usePageQuery } from '@jangts/router-plus/react';

function Alpha() {
  const [state, setState] = useRpState({ count: 0 }, 'counter');
  const [section, setSection] = useRpState('summary', { id: 'section', query: true, values: ['summary', 'details'] });
  const [query, setQuery] = usePageQuery();

  return (
    <section>
      <p>{state.count}</p>
      <button onClick={() => setState({ count: state.count + 1 })}>+1</button>
      <button onClick={() => setSection('details')}>{section}</button>
      <button onClick={() => setQuery({ page: '2' })}>{query.get('page') ?? '1'}</button>
    </section>
  );
}
\`\`\`

### Data Router

React Router DOM >=6.4

\`\`\`tsx
const router = createBrowserRouter(routes);
const plus = createReactRouterPlus({ router, pages, globalKey: false });
root.render(<plus.Provider />);
\`\`\`

Data Router content belongs in its route records; Provider children are rejected. Loaders, redirects and native route organization remain owned by React Router. Native interception additionally requires blocker APIs; without them, Plus-initiated navigation still runs Plus guards.

### Existing sources

\`\`\`tsx
import { useState } from 'react';
import { useReactState } from '@jangts/router-plus/react';
function Counter() {
  const state = useState(0);
  useReactState(state, { id: 'count', query: true });
  useReactState({ get: () => state[0] * 2 }, 'doubled');
  return <button onClick={() => state[1](n => n + 1)}>{state[0]}</button>;
}
\`\`\`
`,
  vue: `
\`\`\`ts
import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory, useRoute } from 'vue-router';
import { createVueRouterPlus, RouterPlusLink, RouterPlusView } from '@jangts/router-plus/vue';

const Page = defineComponent({
  setup() {
    const route = useRoute();
    return () => h('p', route.path);
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/alpha' },
    { path: '/alpha', component: Page },
    { path: '/beta/:id', component: Page },
  ],
});

const plus = createVueRouterPlus({
  router,
  pages: [
    { path: '/alpha', title: 'Alpha' },
    { id: 'beta', path: '/beta/:id', title: 'Beta', states: { section: { default: 'summary', values: ['summary', 'details'], query: true } } },
  ],
  globalKey: false,
});

createApp({
  render: () => h('main', [h(RouterPlusLink, { to: '/beta/42' }, () => 'Open Beta'), h(RouterPlusView)]),
}).use(plus).mount('#app');
\`\`\`

### Reading state in a composable

\`\`\`ts
import { useRpRef, usePageQuery } from '@jangts/router-plus/vue';

const state = useRpRef({ count: 0 }, 'counter');
const section = useRpRef('summary', { id: 'section', query: true, values: ['summary', 'details'] });
const { query, setQuery } = usePageQuery();
\`\`\`

\`app.use(plus)\` installs both Vue Router and the Plus connection. App unmount removes adapter subscriptions and disposes a factory-created Core.

### Existing sources

\`\`\`ts
import { ref, reactive } from 'vue';
import { useVueState } from '@jangts/router-plus/vue';
// setup() / setup store
const count = ref(0);
const filter = reactive({ category: 'all' });
useVueState(count, 'count');
useVueState(filter, { id: 'filter', query: true });
const applyPatch = async (fields: Record<string, unknown>) => ({ applied: Object.keys(fields), conflicts: [] });
useVueState(applyPatch, 'applyPatch');
const receipt = await plus.callState('applyPatch', { name: 'Summer' });
\`\`\`
`,
  overlay: `
\`\`\`tsx
import { RouterPlusOverlay } from '@jangts/router-plus/react';

<RouterPlusOverlay theme={{ zIndex: { max: 59 }, highlightPadding: 4 }} />
\`\`\`

Then use explicit targets:

\`\`\`ts
await plus.highlight({ selector: '#controls' }, { message: 'Controls', spotlight: true });
await plus.clearHighlight();

await plus.startTour([
  { target: { selector: '#controls' }, message: 'Choose an option' },
  { target: { selector: '#content' }, message: 'Inspect the result' },
]);
\`\`\`

Install only DOM capabilities without the default overlay:

\`\`\`ts
import { installDomRuntime } from '@jangts/router-plus/overlay';

const stop = installDomRuntime(plus, { root: document.getElementById('app') ?? undefined });
\`\`\`

Runtime-injected styles and \`@jangts/router-plus/overlay.css\` share one source; use either. See [highlights and tours](../guide/interactions) for custom components, shared props, bubble placements and signed movement.
`,
  stores: `
\`\`\`ts
import { createStore } from 'zustand/vanilla';
import { createRouterPlus } from '@jangts/router-plus';
import { createRpZustand } from '@jangts/router-plus/stores/zustand';

const plus = createRouterPlus({ pages: [], globalKey: false });
const create = createRpZustand(plus, createStore);
const counter = create<{ count: number; increment(): void }>()((set) => ({ count: 0, increment: () => set(s => ({ count: s.count + 1 })) }), 'counter');
await plus.setState(2, 'counter/count');
await plus.callState('counter/increment');
await plus.dispose();
\`\`\`

### Existing stores

\`\`\`ts
import { configureStore } from '@reduxjs/toolkit';
import { registerReduxState } from '@jangts/router-plus/stores/redux';
import { atom, createStore as createAtomStore } from 'jotai/vanilla';
import { registerJotaiState } from '@jangts/router-plus/stores/jotai';
const redux = configureStore({ reducer: (state = 0, action) =>
  action.type === 'restore' ? Number(action.payload) : state });
const stopRedux = registerReduxState(plus, redux, {
  id: 'redux', set: next => { redux.dispatch({ type: 'restore', payload: next }); },
});
const store = createAtomStore();
const count = atom(0);
const stopAtom = registerJotaiState(plus, store, count, {
  id: 'atom', set: next => { store.set(count, next); },
});
stopAtom();
stopRedux();
\`\`\`

Existing Zustand uses \`registerZustandState(plus, store, options)\`. All three register functions return an idempotent stop, with RP disposal as fallback. Existing Redux defaults to readonly plus ID/dispatch; existing writable Jotai atoms expose callState commands. Complete-value assignment and query restoration require explicit set(next) adapters. Creators prepare default writers only for known construction branches.
`,
  testing: `
\`\`\`ts
import { createMemoryConnection, createMemoryHost } from '@jangts/router-plus/testing';
import { createRouterPlus } from '@jangts/router-plus';

const connection = createMemoryConnection({ initial: { pathname: '/alpha' } });
const plus = createRouterPlus({ pages, globalKey: false });
plus.connect(connection);

const host = createMemoryHost();
const stop = plus.registerHost(host);
await plus.whenReady();

connection.setLocation({ pathname: '/beta/42' });
\`\`\`

\`createFakeBridge(initial)\` returns a writable fake state bridge for verifying delegation, snapshots and notifications without any store library.
`,
  types: '',
};

pageExamplesChinese.core += `
### 查询来源能力

\`\`\`ts
const source = plus.inspectState('filters');
if (source?.capabilities.call) await plus.callState(source.id);
const installed = plus.inspectState();
\`\`\`

只返回当前门面可见的已登记来源元数据，不读取实时值，不执行 getter 或 codec；未知 ID、未挂载声明及任意字段展开返回 null。调试全局门面不暴露此入口。
`;
pageExamplesEnglish.core += `
### Inspect installed capabilities

\`\`\`ts
const source = plus.inspectState('filters');
if (source?.capabilities.call) await plus.callState(source.id);
const installed = plus.inspectState();
\`\`\`

Return metadata for installed sources visible to this facade without reading values or executing getters/codecs. Unknown IDs, unmounted declarations and arbitrary field expansion return null. The console facade does not expose inspection.
`;

pageExamplesChinese.core += `
### 顺序编组与来源生命周期

\`\`\`ts
const result = await plus.execute([
  { kind: 'navigate', target: '/customers/42' },
  { kind: 'state.set', key: 'editPanel', value: true },
  { kind: 'state.patch', key: 'customerForm', value: { name: 'Ivan' } },
  { kind: 'state.call', id: 'submitCustomer' },
], { timeoutMs: 10000 });
const stop = plus.subscribe(event => {
  if (event.type === 'state.registered') console.log(event.source.id);
});
\`\`\`

编组等待目标来源登记／恢复与框架提交；来源注销／替换、离开实例、失败、超时或取消即停止。失败回执保留 failedIndex 和已完成 results，不回滚或自动重试业务操作。subscribe 同时提供 state.unregistered、state.committed 和 disposed。whenReady 不等待未来挂载组件；异步业务初始化仍由应用明确表达。
`;
pageExamplesEnglish.core += `
### Sequential commands and source lifecycle

\`\`\`ts
const result = await plus.execute([
  { kind: 'navigate', target: '/customers/42' },
  { kind: 'state.set', key: 'editPanel', value: true },
  { kind: 'state.patch', key: 'customerForm', value: { name: 'Ivan' } },
  { kind: 'state.call', id: 'submitCustomer' },
], { timeoutMs: 10000 });
const stop = plus.subscribe(event => {
  if (event.type === 'state.registered') console.log(event.source.id);
});
\`\`\`

Groups wait for installed/restored sources and framework publication. Failure, timeout, cancellation, instance departure or active source replacement stops subsequent steps. Failures retain failedIndex and completed results, without rollback or retries. Subscriptions also expose state.unregistered, state.committed and disposed. whenReady does not wait for future components; application initialization remains explicit.
`;

export const pageExamples = {
  zh: pageExamplesChinese,
  en: pageExamplesEnglish,
};
