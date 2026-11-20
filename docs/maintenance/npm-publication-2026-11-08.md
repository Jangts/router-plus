# npm 发布记录：0.1.0

- 包：`@jangts/router-plus@0.1.0`，公开访问，标签 `latest`。
- 目标：npm 官方仓库 `https://registry.npmjs.org/`；发布账号 `jangts`。
- 发布命令：`npm publish .tmp/jangts-router-plus-0.1.0.tgz --access public --tag latest --registry=https://registry.npmjs.org`。
- npm 返回退出码 0 及 `+ @jangts/router-plus@0.1.0`，并提示包正在处理。
- 首次发布后的公开查询曾返回 404；后续已从 npm 官方仓库确认版本 `0.1.0` 和 `latest: 0.1.0` 公开可见。

## 发布前验证

- 包构建通过，ESM、CommonJS、类型声明及 CSS 已生成。
- 包测试 83 项通过，0 失败、0 跳过。两处旧 Vue App 测试替身补齐安装流程需要的 `use()`。
- tarball 共 160 个文件，仅包含 dist、正式参考文档、README 与 package.json；维护记录和测试不进入发布包。
- SHA-1：`b1e268186fa0ea454b681514167803a67e5a4c95`。
- 完整性：`sha512-1YMbi+Bw+pM2pTsSTSzlZFdQ0L6eJJvKsCZWAcWdBN8IeDJamz+DHsOSPIZhvSarKfCpAUwALDrxa8NrPNY+Lg==`。

本次只发布公共包，不发布 cafe 应用，不启动服务或执行浏览器预览。

## 0.1.1 发布

- 补齐中英文 README、安装和接入示例、20 个关键词、仓库与问题入口及许可证文件。
- 包清单、运行时版本、cafe 依赖和根锁文件统一为 `0.1.1`。
- README 的四个 React／Vue 完整接入示例通过类型检查；包构建与公开入口检查通过，ESM／CommonJS 导出一致，NodeNext 消费端类型检查通过。
- 直接核对 tarball 内的 README、关键词、许可证和公开入口，共 162 个文件，无白名单以外文件。
- npm 发布返回退出码 0 及 `+ @jangts/router-plus@0.1.1`，请求公开访问和 `latest` 标签。
- npm 官方公开元数据已确认 `latest: 0.1.1`、20 个关键词和中英文 README；远端完整性与本地发布包一致。
- SHA-1：`96914ebe160964dc6b76635613d02f2c6c94e908`。
- 完整性：`sha512-RfS9rs+w0RSZxfgwld57jCVSHxJVBoC0LM2Koj+t3rqqhf/jMCM2BXGXcam3VkHowBMFfALZOpLbgWaHWpDHjQ==`。

## 撤下 0.1.0

按用户要求执行 `npm unpublish @jangts/router-plus@0.1.0`。原发布 token 被 npm 的身份策略拒绝后，使用官方网页登录和本次撤包的单独确认完成认证；撤包返回退出码 0 及 `- @jangts/router-plus@0.1.0`。公开注册表确认版本列表不再包含 `0.1.0`，`latest` 仍为 `0.1.1`；未处理其他版本。
