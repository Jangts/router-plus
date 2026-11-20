# Router Plus 实施方案

本文是实施计划，不代表能力已经实现。需求来源为[设计提案](../design-plan.md)，用于确定合同收敛、模块实现、依赖顺序与验收范围。实施不包含任何 App 改造、启动、部署或内容操作。

## 1. 实施原则

1. 包中不包含具体业务名称、规则、数据、权限模型、动作语义或 App 目录约定。自定义 handler、元数据与协议内容由调用方提供，核心只消费接口。
2. 不规定 App 如何组织路由、组件、状态与导航入口。手写路由、路由生成器、原生框架导航、自有外壳、自有 store、自定义渲染器均为合法用法。App 不必全面替换原接口才能使用某项能力。
3. 保留提案中的导航、Tab、状态、实例保留、交互、全局门面、插件、SSR、React/Vue、六种 store helper、双格式发布及 conformance 需求，按依赖顺序实施，不以缩减最终能力解决设计问题。
4. 框架固有限制通过可替换端口与能力声明表达。缺少端口只影响依赖它的操作，不能阻止其余模块使用；禁止以成功结果掩盖实际未执行的功能。
5. 公共规则采用声明式清单，具体算法、生命周期和执行顺序保持可读。不得另造一套路由引擎、状态管理框架或业务工作流。

## 2. 能力组合与责任

| 模块 | 持有的责任 | 可单独使用的路径 |
| --- | --- | --- |
| Core | 目录、命令、导航协调、实例身份、状态、交互状态、事件、插件 | 普通对象端口、内存环境、SSR |
| Framework adapters | 框架匹配、导航提交、原生守卫接入、组件生命周期 | React / Vue hooks 与组件，或只连接端口 |
| Instance host | 按实例提供上下文、挂载、隐藏、恢复与卸载 | 内置 Outlet/View、独立 boundary、自定义 host |
| DOM runtime | DOM 目标、等待、测量、聚焦、滚动 | 单独安装，不要求默认覆盖层 |
| Overlay | 高亮与导览的默认呈现、定位和无障碍行为 | 默认渲染器或调用方 renderer |
| State helpers | 将现有 store 的切片映射为状态桥 | 按子入口选择，不要求接管整个 store |
| Route generators | 将页面声明转成框架路由记录 | 可选，不成为公共规则的执行前提 |

Provider 提供便利组合，可关闭默认 DOM runtime 和 overlay，也可分别安装；不自动改写 App 的路由树和 store。实例不连接路由端口时仍可使用独立目录和状态能力，未连接的导航返回 `not-connected`。

页面目录按实例固定；App 可采用完整目录、局部目录或无登记页面的路径导航。目录未命中时上下文的 `pageId / instance` 为 null，不能凭空创建有页面定义语义的状态桶。插件运行期登记与实例目录固定是两种不同生命周期。

## 3. 合同收敛

### 3.1 页面、链接与匹配

- 保留路径字符串、`{ path }`、`{ pathname, search, hash }` 与 `{ page, params, query, tab }`。页面 id 缺省等于模板 path，路径字符串不按 id 猜测。
- 为链接增加显式 `{ action, payload? }` 输入，handler 仍由调用方登记。`PageTarget` 只表示导航目标，`LinkTarget` 为页面目标与动作目标的联合；链接组件接受 `LinkTarget`。
- `LinkResolution` 为 `page / external / action` 联合；`NavigationPlan` 仅包含 `page / external`。`resolveLink` 调用协议解析后进入统一校验，`resolveTarget` 只接受导航结果，`resolveHref` 返回可打开的页面地址。
- `LinkProtocol` 可同步返回 `LinkTarget`，不可在解析期执行副作用。协议重入、循环与解析深度有统一限额；异步返回作为契约错误处理。
- 动作组件和显式动作调用走同一 action handler 分派器，不扩展业务命令种类。动作没有可打开的 href，渲染按钮；链接的 `onClick`、禁用与默认阻止规则在按钮分支同样有效。
- 查询参数保留原始 search 与有序多值查询视图，不能只用 `Record<string, string>` 承诺无损往返。普通 query 允许重复键；配置的深链封装字段及专用 Tab 字段要求唯一。Tab 查询键可配置，名称冲突启动报错。
- URL 结构与危险协议校验由包负责；业务 query 与权限不由包解释。同源绝对 URL、跨源 URL、`//host`、base、hash history、路径编码与相对地址按 URL 和框架语义处理，禁止把协议相对地址误认作站内路径。
- `relative` 由框架适配器利用调用点的路由上下文解析成规范目标；Core 无调用点时只处理有明确 base 的 URL 相对形式，不猜测路由层级。

匹配使用统一 `RouteMatcher` 端口，暴露匹配与参数构建能力，保留原始模板交给实现处理。React/Vue adapter 使用各自框架的公开匹配能力；自定义框架可以提供普通对象实现。页面目录查询、导航解析与地址回灌均使用实例绑定的同一 matcher。

共享测试规定两端共有路径语法的结果；框架专属语法由对应 matcher 解释，不能强行裁剪 App 路由能力。生成器使用相同 matcher 规则。手写路由可在回灌中提供真实 matched chain 与页面映射，其结果优先于目录推断；重复映射、无效页面引用作为配置错误报告。

目录投影不含 handler、store、meta、组件与布局引用；`instanceKey` 函数只投影为策略描述，不暴露函数。完整定义留在实例内部，生成器显式接收完整定义或其受控只读访问接口。目录不应被称为安全脱敏器，页面名称与路径的披露仍由调用方决定。

### 3.2 导航端口与真实提交

`connect` 绑定一个连接对象，连接含初始快照、提交方法、已提交地址订阅与能力声明。框架具体 options 由适配层有类型地透传，Core 只解释通用字段；不能为跨框架一致丢掉原生选项。

| 连接能力 | 合同 |
| --- | --- |
| 初始快照 | 连接时同步提供地址、history entry 身份及已有 state；订阅与快照读取不得漏掉中间变化 |
| commit | 接收导航 id、目标、state、选项与 AbortSignal；返回真实提交、阻止、取消、失败或历史无移动的回执 |
| committed subscription | 所有框架已提交地址变化进入同一入口，含来源、entry key、action 与可获得的导航 id |
| transition interception | 可选；接入原生导航前置阻止、放行与重定向；只观察地址不能宣称具备此能力 |
| history traversal | 可选；back/forward/go 也返回提交或无移动回执，不靠等待下一次任意 location 事件猜测完成 |
| raw history observation | 可选；显式安装浏览器 history 桥观察绕过框架的 pushState/replaceState |

原生导航可以继续使用。具备拦截能力的连接将其接入同一守卫管线；只有观察能力时更新上下文，不事后补跑具有“阻止”含义的守卫。直链初始化不执行离开守卫。整页离开与刷新使用单独的浏览器离开提示能力，不能宣称可运行完整异步守卫。

原始 history 桥采用按 window 引用计数的可卸载包装，保留原方法的接收者、返回值和异常；以真实地址修订去重，不以 URL 相等去重。它负责通知及通过连接支持的方式重同步框架，不把不可拦截的原始调用伪装成可取消导航。仅靠 useLocation/afterEach 的连接不声明 raw history observation。

标准导航阶段固定为：

1. 解析目标、校验包合同，生成本次 operation id 与源实例引用。
2. 全局及页面离开守卫、进入守卫依稳定优先级执行；同优先级按登记顺序。原生拦截进入时以 token 防止同一跳转重复守卫。
3. 计算目标实例身份与 history state，交给端口一次提交。保留框架内部 history 字段，不在提交后直接覆盖浏览器 state。
4. 收到真实提交回执后，通过同一 location reducer 更新上下文、实例可见性和事件；订阅先到或回执先到均只提交一次。
5. 执行 `afterEnter`，最后返回结果。`afterEnter` 表示地址提交后；DOM 挂载由实例 host 的 ready 信号独立表示。回调失败保留已经提交的地址，并返回带提交事实的错误结果。

导航采用新目标替换尚未提交目标的缺省策略；可配置串行策略。重定向有次数上限和循环检查。取消只终止尚可终止的阶段；已经提交的事实不能被旧操作的取消覆盖。结果保留 requested、committed、redirected 与失败阶段，不能把“已发起”作为成功。

### 3.3 History、Tab 与恢复

- history entry key、page id、instance key、state key 分开建模；RouterLocation 补齐 entry key 与 navigation action。相同 URL 的两条历史记录仍可区分。
- `historyStateKey` 为可配置命名空间，结构带版本。调用方 state 与框架 state 分层合并；非对象输入不得静默丢弃，框架适配负责保持其原生 state 语义并写入 Plus 命名空间。
- Tab 来源顺序为：本次显式目标、有效 URL Tab、与路径及实例匹配的 history Tab、页面 defaultTab、第一个 Tab。主动目标含非法 Tab 时拒绝；外部地址与持久记录含非法 Tab 时按恢复规则回退并给出诊断。
- 实例释放不抹掉有效 history Tab；重新进入仍可恢复选项，页面数据按初始化或持久化合同重建。URL 不能表达的 Tab 在新标签页缺省回退，不能承诺仅存在于 history.state 的值可分享。
- 同实例 query/hash/Tab 变化不自动销毁实例。实例键默认基于规范 pathname，可选按 page、参数列表或调用方函数计算；page id 与实例键组合使用无碰撞编码。
- owned 的实例保留复用现有状态；全新实例优先恢复有效持久快照，迁移失败报告并按配置选择拒绝或重新初始化。session 清理由独立持久化策略决定，不随隐藏或解绑盲目删除。

### 3.4 实例 host 与作用域

实例身份由 Core 分配，渲染生命周期由 host 回报。标准 host 接口包含 mount、activate、deactivate、dispose 与 ready；操作可以异步，生命周期幂等，失败归属明确。内置 Outlet/View 与自定义 host 使用同一注册合同。

React 提供实例 boundary 与缓存 host；Activity 为可选保留机制，未采用时可使用缓存实现或仅状态保留。Vue 提供相同 boundary 语义与 KeepAlive host。手写树通过 boundary 绑定实例即可获得作用域，不要求使用生成器或替换整个根路由。

每个实例提供自己的 location、matched chain、params、Tab、状态及 target scope。隐藏实例保留该实例快照，不能因全局 location 更新读到另一实例的数据。嵌套页面按 matched chain 分配层级作用域，子级操作默认定位最近 boundary；独立控制台默认定位当前叶实例。

`retain: { max }` 按页面限制实例总数，当前活动实例计入但不能被淘汰，超限先释放最久未访问的非活动实例；max 必须为正整数。允许自定义保留策略、全局上限与仅状态保留。`release` 活动实例时重建其可用作用域，不能把仍显示的组件留在已销毁状态引用上。

桥、目标与守卫登记绑定显式稳定 scope；hooks 从 boundary 取得 scope，不在异步回调里重新读取当前页。无 boundary 时，调用方可持有实例 scope 手动接入。组件 Effect 清理只解绑该次登记，不等于 Core 释放实例；隐藏、组件卸载与实例销毁分别处理。

### 3.5 状态与 store helpers

- 保留 owned、delegated、external 三种所有权说明。external 不需要登记；App 可继续直接使用任意 store，可选择暴露切片，不要求 store 按包的格式重组。
- 保留默认 owned 桶和命名 bridge，提供作用域绑定的 get/set/patch/reset/subscribe。返回值按 state key 类型映射推断；动态 key 使用 unknown，不能只靠调用方任意填写泛型获得类型保证。
- 同一 scope/key 的异步修改串行执行，不同 key 独立。read-merge-write 回退在该队列内执行，避免包内并发丢更新；与外部 store 的并发协调仍由桥控制。
- 命令捕获 scope 和登记代次。释放或重新登记后，旧任务不得向新实例写事件；已发送给外部 store 的写入不能虚构撤销，保留真实结果并报告作用域失效。
- 桥支持异步 snapshot/restore；恢复完成后再标记实例 ready。未提供快照能力时不虚构组件卸载后的状态恢复；仅 owned 状态保留与组件内部状态保留分别声明。
- 订阅负责外部修改通知；包发起的写入按完成后的读取值与订阅修订去重。selector 可配置比较器，不能固定浅比较而漏掉合法原地更新。暂停隐藏订阅后，激活先重读再恢复通知。
- Pinia、Vuex、Redux、Zustand、Jotai、MobX helper 只映射切片读写、订阅和可选恢复。调用方可以直接提交同一 bridge 接口；不要求使用 helper。
- owned 初始值按实例创建，静态对象不能跨实例共享可变引用。session 持久化使用显式 codec、版本与命名空间；处理序列化失败、存储不可用及配额不足，不把任意对象隐式 JSON 化后声称完整恢复。

### 3.6 DOM 交互与覆盖层

- 核心保留 TargetRef 与可取消的异步目标解析协议。DOM 运行时持有 Element、observer 与测量缓存；公开浏览器入口可导出 DOM 类型，服务端加载不得访问 DOM 全局。
- 按自定义 target resolver、实例注册 id、实例 root 内 data 标记、显式 selector、element 的规则解析。root、页面 scope 与可见性共同过滤，隐藏保留页的同名目标不能被选中。
- 解析器允许加载或滚动等目标准备副作用，但必须发生在命令执行期，接收 signal 与 scope；同步链接解析仍保持纯函数。等待有超时，取消、scope 失效或运行时卸载时移除 observer、事件监听与计时器。
- 支持虚拟列表、ShadowRoot 与第三方组件 resolver；同源 iframe 由文档内运行时处理坐标或映射到覆盖层 root。跨源 iframe 使用调用方消息桥，不直接访问其 DOM。画布可由扩展 resolver 提供矩形锚点，不强制一切目标都是 Element；focus 对不可聚焦锚点返回能力不支持。
- 滚动策略可替换，按登记的匹配条件和优先级选择，默认原生滚动；offset、container、取消和 reduced-motion 由统一合同处理。
- 高亮与导览共享一次覆盖层；显式 highlight 与 tour 的优先级、替换及清理有统一规则，缺省显式 highlight 终止 tour。普通导航只有提交后才结束交互，被阻止的导航保留交互；同实例 query/hash/Tab 更新默认不结束，可配置导航交互策略。
- 导览保留 beforeStep/afterStep、awaitUser、click/manual 推进、键盘与关闭。重复 next/prev 取消旧步骤准备，旧 Promise 完成不能覆盖新步骤。提供焦点恢复、Escape、aria-live、reduced-motion 和每个 root 独立的 overlay 生命周期。
- renderer 可完全替换；默认实现及 CSS 只是可选子入口，不把包的视觉数值注入各 App 的公共样式。

### 3.7 插件、全局与 SSR

- 静态插件按 requires/before 拓扑排序；依赖缺失、循环、重名在安装前拒绝。动态安装不能假称已经重排先前执行的 setup，无法满足顺序时返回明确错误。
- setup 内的登记属于安装事务；失败回滚已登记资源。命令在所需插件未就绪时统一返回 not-ready，不保留“排队或拒绝”的二义性。
- 卸载先处理依赖关系，默认拒绝移除仍被依赖的插件；显式级联才按逆序清理。提供可等待的异步卸载与实例 dispose，取消等待任务、断开连接、清理 DOM、桥和全局挂载。
- command、result、event、extension 均由类型化清单登记，清单直接驱动校验、分派、能力目录与测试。协议未知 kind 返回 unsupported-command，普通扩展字段忽略，不能通过未知字段引入未登记执行行为。
- 保留默认浏览器全局门面，可用 globalKey:false 关闭。挂载冲突拒绝覆盖；卸载只移除本实例拥有的引用。门面不提供插件、桥、host 的安装权限，但页面状态可读写的性质应准确记录；它不构成权限隔离措施。
- SSR 每请求创建独立实例，通过 initialLocation 与显式快照初始化，不挂全局、不安装 DOM。客户端使用相同目录及初始快照 hydration，再连接真实地址；浏览器 history state 的差异在连接后处理，不导致首次服务端与客户端渲染采用不同 Tab。序列化采用显式 codec，DOM 引用、handler 和 store 实例不进入快照。
- 多 root、微前端与 iframe 各自明确实例、scope、root 及全局键；不强制 shell 集中创建唯一实例。选择共享实例时由调用方组合目录与端口；选择独立实例时默认互不影响。

## 4. 代码组织与交付物

沿提案的 core、dom、react、vue、stores、testing 子目录实施。导航目标与交互目标分别命名，不新增平行执行器：

- core：types、catalog、matcher、links、navigation、history、instances、state、interaction、commands、events、plugins、global。
- dom：runtime、targets、anchors、scroll、overlay、styles.css。
- react / vue：连接、Provider/plugin、hooks/composables、Link、Redirect、boundary、host、Outlet/View、routes、overlay。
- stores：六种独立可选 helper，共用状态桥合同，不相互导入。
- testing：memory connection、memory host、fake bridge、conformance fixtures。

集中清单应可直接定位名称、约束及具名 handler。测试读取清单和公开注册结果，不解析源码中 register 调用的文本形式。

正式参考分别维护 API、连接协议、实例与状态、交互及扩展合同；实施步骤留在本计划。原提案作为设计来源保留，形成正式合同后不继续用“原文＋调整”充当并行 API 参考。

## 5. 实施顺序与阶段出口

| 阶段 | 工作 | 阶段出口 |
| --- | --- | --- |
| P0 合同与包骨架 | 收敛公开类型、能力矩阵、命令清单；package、exports、tsconfig、catalog、根 lockfile；确定框架 peer 支持范围 | 类型能表达所有原提案能力，页面/动作、同步/异步和导航/提交无冲突 |
| P1 目录与导航核心 | matcher 端口、URL、协议、链接、history/Tab、提交回执、守卫、取消与事件 | 内存连接覆盖提交顺序、外部变化、重定向和失败恢复 |
| P2 实例与状态 | scope、host、保留策略、owned/bridge、写入队列、持久化和恢复 | 多实例状态隔离，释放与异步写入不串页 |
| P3 React/Vue 适配 | 同步实现两端连接、匹配、hooks、Link、Redirect、实例 boundary/host、生成器及原生导航拦截 | 手写与生成方式消费相同合同，框架原生调用可共存 |
| P4 DOM 与交互 | 运行时、resolver、anchor、scroll、overlay、tour、无障碍与清理 | 交互取消、隐藏目标、异步步骤和 root 隔离有证据 |
| P5 完整扩展 | 六种 store helper、插件事务、动态卸载、全局门面、SSR hydration、多 root | 提案各扩展点均有实现及公开用例，无依赖隐式安装 |
| P6 发布闭合 | API 文档、两端 conformance、入口与双格式检查、能力清单核对 | 全部承诺能力具备双方实现和证据后才发布完整版本 |

阶段可交叉实现独立模块，但导航、实例和交互必须复用已确定的同一合同。实现中发现框架限制时补充端口实现与能力说明，不能把 App 必须更换框架模式作为唯一处理方式。

## 6. 验证与完成标准

具体执行频率遵守仓库 AGENTS.md。实施期间按具体疑问运行最小检查；本计划不授权自动启动 App、浏览器或视觉预览，也不把每阶段全量构建设为固定仪式。发布检查在实际发布任务中执行。

| 验证域 | 必须覆盖的行为 |
| --- | --- |
| 解析与匹配 | 路径/id/对象、别名、嵌套、共有与框架专属语法、base/hash 模式、相对地址、多值 query、危险协议、深链循环、动作链接 |
| 导航与恢复 | 直链、原生导航、Plus 导航、前后退、同 URL 多 entry、无移动、阻止、重定向、提交交错、提交后错误、取消及真实回执 |
| 实例与状态 | 多实例、多 root、嵌套 scope、隐藏 location、LRU、活动 release、初始对象隔离、串行写、桥重登记、订阅去重、session 迁移与失败 |
| 框架接入 | 两端手写/生成路由等效；只接导航、只接状态、自定义 host、自有 renderer；原生 API 共存；React Effect 重建和 Vue 激活/停用 |
| 交互 | 实例 root、隐藏重复 target、异步 resolver、等待超时、取消清理、虚拟目标、ShadowRoot、矩形锚点、导览竞争与键盘行为 |
| 插件与全局 | 依赖排序、部分 setup 失败回滚、动态卸载、异步清理、同 window 多实例与全局键冲突 |
| SSR 与发布 | 每请求隔离、首帧快照一致、无 DOM 导入副作用、CSS sideEffects、可选 peers、所有 exports 的 ESM/CJS/types 解析 |

conformance 比较语义场景、结果与生命周期，不机械比较框架专属类型或导出名。内存/DOM 模拟测试不能替代真实框架与浏览器证据；真实视觉验收由用户负责，未取得的证据明确记录为未验证。

最终交付按原提案全部能力建立覆盖表，每项关联公开入口、实现模块和验证证据；不能以“已有扩展点”代替默认实现，也不能把只完成单端的能力记为双端通过。App 如何采用、采用多少及是否迁移，均不成为包自身完成的前置条件。
