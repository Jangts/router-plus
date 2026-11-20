# 仓库结构

本项目位于 Jangts 组织目录的 router-plus/，是单一 npm 包 @jangts/router-plus。源码 src/、测试 test/ 和构建脚本 scripts/ 均直接放在根目录；不使用 npm workspace 或包目录清单。

使用 Node.js >=22.12.0，在本目录运行 npm ci。根 package-lock.json 为唯一依赖锁，不依赖网站的 node_modules。

```sh
npm run build
npm run check
npm test
```

build 清理并生成 ESM、CommonJS、声明和 CSS；check 核对锁文件、源码依赖边界、公开入口与双格式导出。测试按[协作约定](../AGENTS.md)选择执行范围。dist/、node_modules/ 和 .tmp/ 为生成或临时目录，不入库。

包手册和规范归 docs/，过程记录归 docs/maintenance/，品牌原件归 shared/visual-assets/。文档站归相邻 Pages 项目，默认直接读取本目录；非同层检出时由 Pages 的 ROUTER_PLUS_ROOT 指定本仓库位置。

所有子项目仍属于 Jangts。跨项目依赖通过原有 @jangts/* 包名和公开入口声明；源码联调、文档生成和发布版本分别明确来源，目录搬迁不改变既有 npm 身份。规范使用本项目 docs 的完整副本，实际实现和检查范围见[项目检查入口](review-entrypoints.md)。
