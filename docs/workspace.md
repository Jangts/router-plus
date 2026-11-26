# 仓库结构

`packages/router-plus/` 维护并发布 `@jangts/router-plus`，包含源码、测试、构建脚本、手册和 npm 发布清单。`apps/router-plus-docs/` 从本仓库的 SDK 源码生成双语文档站。品牌原件在 `shared/visual-assets/`，项目规范和维护记录在 `docs/`。

使用 Node.js 22.12 或更高版本，在仓库根目录运行：

```sh
npm ci
npm run build
npm run check
npm run build:docs:router-plus
npm run check:docs:router-plus
```

根 `package-lock.json` 固定 SDK 与文档应用的依赖。构建 SDK 会生成 ESM、CommonJS、类型声明和 CSS，`npm run check` 核对锁文件、源码边界和公开入口。文档站可直接从当前源码生成。站点托管说明见[文档站维护说明](../apps/router-plus-docs/docs/deployment.md)。

发布前从根目录执行 `npm pack --dry-run --workspace @jangts/router-plus` 核对 SDK 包体。构建、测试及发布的授权与范围见[协作约定](../AGENTS.md)和[项目检查入口](review-entrypoints.md)。
