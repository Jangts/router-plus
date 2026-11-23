# 文档规范审校与站点同步记录

日期：2026-11-23。范围：Router Plus SDK、工程与协作规范、维护记录、品牌说明，以及相邻 pages 中 Router Plus 文档站；不涉及其他产品的文档或线上部署。

## 审校依据与结果

按[文档规范](../documentation-standard.md)核对正式合同、历史资料归属、公开包入口、双语顺序、源码／示例一致性、链接及生成来源。检查清单覆盖 SDK 47 篇、站点 46 篇既有 Markdown（不含本记录、依赖和生成构建目录）。历史资料保留当时的版本、路径、命令和证据，检查其归属、可发现性及链接，不将旧记录改写为当前版本承诺。

| 方面 | 处理 |
| --- | --- |
| 正式合同与真实能力 | 补齐 query.patch／patchQuery、页 ID 目标 hash、命令重定向、历史状态保留；校正 Data Router 与原生 blocker 的能力前提、disposal 归属及手动保留／cache 的边界 |
| 真实限制与顺序 | 删除未经源码保证的恢复／host 激活绝对顺序和正式文档中的测试成果句；保留取消、历史、失败及生命周期的合法技术说明 |
| 双语与首次接入 | README 两种语言同步；原生绑定英文段落移回中文之前；补齐 Zustand 普通记录 merge 与原生根值替换规则 |
| 过程资料归属 | 原始 2084 行设计稿完整归档至 original-design-plan.md，只调整移动后的两处相对链接；原 docs/design-plan.md 留历史入口，防止旧地址失效 |
| 工程规范与维护入口 | 本单包目录统一为 src/scripts/test/docs；维护索引收录全部历史资料，检查入口补充当前跨层及动态合同回归；旧文档站仓库链接指向现行归属 |
| 文档站指南 | 中英文同步导航、接线、页面／实例、Store 及交互合同；修正整页／局部更新、守卫、nearest／inline／RTL／offset 说明 |
| API 生成 | 修改 examples.mjs 来源后重新生成，未仅手工修补生成 API 页面；完整应用接入英文原稿与站点镜像逐字一致 |

站点锁定的 0.4.6 是工具清单依赖，浏览器主题和运行代码不导入该包，公开 API 与示例签名按相邻源码映射检查；未擅自升级到尚未由本任务发布的版本。

## 实际验证

- SDK／站点 Markdown 本地文件链接分别 173／42 项，均无缺失（索引补充前的检查快照）；SDK 已引用的 Markdown 锚点检查无缺失。
- 站点检查通过：8 个模块、208 个公开导出、193 条 API 记录、7 类 API 页面、双语 14 条 API 路由。
- VitePress 生产构建退出 0，41 篇内容生成 42 个 HTML，未出现构建警告或错误；实际产物位于 pages/apps/router-plus-docs/dist。
- 对实际 42 个 HTML 检查 2986 个本地 href 与目标锚点，未发现缺失。
- 实际 tarball 消费通过，8 个完整接入配方严格编译及运行验证通过；包指纹 SHA-1：400ca1e56183e590c289c4336f09c33a4f6799ca。文档相对入口与发布白名单同步。
- 两仓库 staged／unstaged diff 检查均通过。

日志：router-plus/.tmp/document-link-audit-final.json、site-rendered-links-audit.json、docs-audit-packed.log；pages/.tmp/router-docs-standard-check.log、router-docs-standard-build.log。

本次没有改 SDK 运行源码，没有重复运行 SDK 全量构建／回归；没有启动应用、浏览器或预览服务，没有发布 npm、部署站点或执行 Git 提交／推送。上述结论为本地文档和生产构建产物验证，不宣称线上站点已经更新。
