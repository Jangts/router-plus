# Router Plus 文档站

基于 VitePress 的纯静态双语文档，浏览器本地全文搜索，不依赖后端。面向使用 `@jangts/router-plus` 接入 React 或 Vue 应用的人：按接入与生命周期、页面实例、导航、原生状态与查询参数、状态访问与编组、状态库、守卫插件、交互及 SSR／测试组织。

线上文档：<https://router-plus-docs.pages.jangts.cafe/>。

## 语言与路径

中文与英文位于同级目录：`/zh/` 与 `/en/`，内页地址始终位于各自语言目录下。根路径 `/` 只是语言入口：按浏览器语言进入 `/zh/` 或 `/en/`，中文区进入中文，其他地区进入英文；入口在 head 内联脚本中立即完成，不渲染可见的等待或选择页面。点击导航栏语言切换会记住选择，后续不再自动跳转。

- 英文页面：`content/en/` 下的手写 Markdown 与生成的 `content/en/api/*.md`。
- 中文页面：`content/zh/` 下的手写 Markdown 与生成的 `content/zh/api/*.md`。
- 根路径入口：`content/index.md`，由生成脚本写入，不承载首页内容。
- 首页与界面文案、API 页面标题与示例集中在 `scripts/locales.mjs` 与 `scripts/examples.mjs`。

## 根目录命令

```sh
npm run docs:router-plus
npm run build:docs:router-plus
npm run preview:docs:router-plus
```

网站源码位于 `apps/router-plus-docs/`，构建产物位于该应用自己的 `dist/`。公开内容放在 `content/`，`docs/` 只保存站点维护资料。

## 内容来源

指南为手写 Markdown，按最终设计讲述正式能力、接口、使用条件、配置和示例。API 页面由 `scripts/extract-api.mjs` 从相邻 `router-plus/` 项目的公开入口与 TypeScript 声明生成，`scripts/examples.mjs` 登记页面分组、标题、摘要与示例。该清单必须覆盖每个公开导出，`npm run check --workspace @jangts/router-plus-docs` 会逐项核对。

修改接口时同步这里的 Markdown、示例与英文译文，并更新生成结果。

浏览器主题与页面展示生成的文档。API 抽取和示例导入检查使用本仓库 `packages/router-plus/` 的当前源码。

## 构建与部署

从仓库根目录使用根 `package-lock.json`，不在文档目录重复安装：

```sh
npm ci
npm run build:docs:router-plus
```

输出目录为 `apps/router-plus-docs/dist/`，可整体复制到任意静态托管平台。基础路径通过 `ROUTER_PLUS_DOCS_BASE` 控制，源站点通过 `ROUTER_PLUS_DOCS_ORIGIN` 控制。部署说明见 [docs/deployment.md](docs/deployment.md)。
