# 项目协作约定

保留现有修改，不 reset、clean 或覆盖运行数据。本仓库为单一 npm 包，源码 src/、测试 test/、构建脚本 scripts/ 均在根目录；安装只在根目录运行 npm ci，根 package-lock.json 是唯一依赖锁。构建、结构检查与回归分别使用 npm run build、npm run check、npm test。

正式文档遵守 docs/documentation-standard.md，代码检查遵守 docs/code-review-standard.md，接口设计遵守 docs/interface-design-standard.md。代码组织、日志和素材分别遵守 docs/code-organization.md、docs/logging-standard.md、docs/image-assets.md；界面目录规则见 docs/规范/01-工程目录与协作约定.md。本项目的具体实现和检查入口从 docs/README.md 进入。过程记录放 docs/maintenance/ 或所属模块维护目录。临时工具与结果只放 .tmp/。格式化采用根 Prettier 配置。公共包注释使用英文或中英双语。

可枚举能力通过集中清单驱动实际执行；应用持有业务事实和权限，公共包不引入应用实现。

用户负责运行调试与视觉验收；未明确要求时不启动应用、浏览器或截图。检查只针对明确疑问执行最小范围，不默认全量构建、测试或压测。发布 npm、部署服务与公开仓库可见性均按当前用户授权执行。凭据只保存在本机私有配置，不进入源码、文档或日志。

本项目属于 Jangts，拆仓不改变既有 `@jangts/*` 包身份与任务范围内的跨项目协作责任。根 package.json 即 @jangts/router-plus 的发布清单，保留已发布的名称、版本和公开入口，未经明确要求不重命名、不重置版本。文档站位于相邻 pages 项目，并通过该项目的统一源码映射读取本仓库。
