# Router Plus 文档站 0.2.1 部署记录

- 入口：https://router-plus-docs.pages.jangts.cafe/。
- 配置来源：`scripts/deploy.config.json`；连接与 Pages 服务合同见 [Pages 部署](../../../../deploy/pages/README.md)。
- 执行现有 `npm run deploy --workspace @jangts/router-plus-docs`，由当前源码生成 API 文档并构建静态站，中英文 Core API 的版本为 0.2.1。
- 只替换目标目录 `/opt/stacks/nginx-proxy-manager/data/pages/router-plus-docs/`；未修改 NPM、DNS、证书或其他站点，未重启服务。
- 构建成功，发布成功；服务器逐文件 SHA-256 校验通过，共 135 个文件。
- 公网 HTTPS 核对 16 个页面与资源，包含中英文首页、交互指南、Core／Overlay API、语言入口、站点地图、hashmap、品牌图片及实际引用的 JS/CSS。全部返回 200，字节哈希与本地构建一致。
- 缺失路径返回 HTTP 404。未进行浏览器交互或视觉验收。
