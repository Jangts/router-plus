# 组织拆分落实记录

日期：2026-11-20。本项目保持 Jangts 组织归属，Git 记录和依赖安装独立管理。既有 npm 名称、版本、公开入口和调用方 import 不变；没有发布 npm 或部署站点。

Router Plus 使用普通单包结构，原 packages/router-plus 的源码、测试、编译脚本、README、许可和文档收平到根目录，删除 workspace 容器、包清单及拓扑构建封装。根 package.json 保持 @jangts/router-plus@0.4.6 的发布身份，保留 9 个公开入口；69 份源码内容未变。Pages 的源码映射和跨项目文档链接同步调整。类型测试显式忽略根 tsconfig，继续检查独立消费者的 ESM／CJS 类型。

共用规范使用 docs 中的本地副本；产品手册与维护记录随所属代码保留。组织目录提供 jangts.code-workspace，在一个编辑器窗口中管理四个仓库；组织目录及 .external 不建立仓库。

本项目已初始化 main 分支并连接私有远端 Jangts/router-plus，采用拆分内容的初始快照，不复制网站的完整 Git 历史。临时结果、依赖、编译产物和本机配置不纳入初始快照。

独立 npm ci、包构建、依赖边界／锁文件／双格式入口检查通过；打包和公开类型测试共 5 项通过，实际 tarball 在当前 peer 组合下的类型与运行时消费通过。未执行最低 peer 组合、完整行为回归、浏览器预览或视觉验收。

## 仓库开源

按用户确认，Jangts/router-plus 已设为公开仓库，并通过 GitHub 匿名接口核对可访问。Router Plus 保留 Apache-2.0 许可和原有 NOTICE。已发布 npm 包的名称、版本与公开入口保持；本次不发布 npm 或部署站点。文档仓库 Jangts/jangts-lib-docs 与网站主仓库 Jangts/jangts 保持私有。
