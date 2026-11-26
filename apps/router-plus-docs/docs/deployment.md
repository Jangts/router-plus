# 构建与静态部署

本文供文档站维护者使用，不属于公开 SDK 使用文档。

默认构建地址为 `https://router-plus-docs.pages.jangts.cafe`，使用域名根路径；换域名可设置 `ROUTER_PLUS_DOCS_ORIGIN=https://your-domain.example`。

## 本站 Pages

公开入口为 <https://router-plus-docs.pages.jangts.cafe/>，使用现有 NPM Pages 通配入口和证书。服务器目录为 `/opt/stacks/nginx-proxy-manager/data/pages/router-plus-docs/`。

从仓库根目录运行 `npm run build:docs:router-plus`，将本应用 `dist/` 的全部成品打包，经 SCP 上传并通过 SSH 校验压缩包及逐文件 SHA-256 后替换该站点目录。更新静态成品无需修改 NPM、DNS、证书或重启服务；保留其他站点和 `.shared/404.html`。

Pages 使用真实静态文件路径，本文档站保留 `cleanUrls: false`，正文路径带 `.html`；不存在的页面使用共享错误页并返回 HTTP 404，不回退到首页。发布后核对 HTTPS 首页、正文、实际 JS/CSS、站点地图和缺失路径；浏览器交互与视觉验收由用户负责。

发布脚本对上传包与全部成品文件执行 SHA-256 校验；公网核对首页、指南页、API 目录、实际引用的 JS/CSS、API 清单与站点地图，内容应与本地成品一致。缺失路径必须返回 HTTP 404。构建、内容校验与浏览器交互／视觉验收分别记录，不能相互替代。

## 在仓库中使用

从本仓库的 Router Plus 源码生成文档。

```sh
npm ci
npm run docs:router-plus
```

开发命令只启动 VitePress 文档服务器。生成可部署的静态站：

```sh
npm run build:docs:router-plus
```

输出目录为：

```text
apps/router-plus-docs/dist/
├── index.html       # 语言入口：按浏览器语言进入 /en/ 或 /zh/
├── en/              # 英文页面
├── zh/              # 中文页面
├── assets/          # 页面脚本、样式、本地搜索索引
├── branding/
├── sitemap.xml
└── 404.html
```

`/` 只承担语言入口：中文浏览器进入 `/zh/`，其他语言进入 `/en/`，由 head 内联脚本立即完成。缺失路径返回 HTTP 404。

本地预览：

```sh
npm run preview:docs:router-plus
```

## 发布到 Jangts Pages

将 [配置样例](../scripts/deploy.config.example.json) 复制到仓库根目录的 `.local/pages/router-plus-docs.json`，填写本机 SSH 连接和密钥路径。
发布入口为 `npm run deploy --workspace @jangts/router-plus-docs`。
