# Router Plus 文档站 0.2.0 部署记录

- 公开入口：https://router-plus-docs.pages.jangts.cafe/。
- 使用既有 `npm run deploy --workspace @jangts/router-plus-docs`，构建并上传全部静态成品；配置来源为 `scripts/deploy.config.json`，连接与静态服务合同见 [Pages 部署](../../../../deploy/pages/README.md)。
- 只更新 `/opt/stacks/nginx-proxy-manager/data/pages/router-plus-docs/`；未调整 NPM、DNS、证书或其他站点，未重启服务，未部署 cafe。
- 发布脚本成功，远端压缩包与 135 个文件的 SHA-256 校验通过。
- 最终公网 HTTPS 核对 16 个文件：语言入口、中英文首页、交互指南、Core／Overlay API、hashmap.json、sitemap.xml、两张品牌图片，以及页面实际引用的 JS、CSS 和指南模块。均返回 200，解码后字节的 SHA-256 与本地成品完全一致。
- 缺失页面返回真实 HTTP 404。
- 双语交互指南包含默认气泡正文／关闭按钮同排居中、8px 上下内边距及 4px 操作区间距说明。
- 浏览器交互与视觉外观未验收。气泡布局修复已更新本地公共包构建产物，本轮未补发 npm。
