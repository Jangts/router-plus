# Router Plus 指南

Router Plus 为 React 与 Vue 应用提供导航、原生状态访问、查询参数同步、保留视图和交互能力。应用持有原生 Router、组件与实时状态；RP 登记访问入口和导航规则。

## 阅读路径

| 任务 | 入口 |
| --- | --- |
| 完整组合仪表盘、异步目录、业务请求、守卫与缓存 | [应用完整接入](application-integration) |
| 安装、连接框架、管理实例与热更新 | [接入与生命周期](getting-started) |
| 定义页面身份、地址状态与保留实例 | [页面与实例](pages-and-instances) |
| 导航、链接、命令与提交回执 | [导航与结果](navigation) |
| 创建或登记原生状态、同步 QS、使用保留视图 | [原生状态与查询参数](state-and-tabs) |
| 从外部读写、调用回调、查询能力与执行命令组 | [状态访问与命令编组](state-access) |
| 创建或登记 Zustand、Redux、Jotai 与 Vue setup store | [状态库接入](stores) |
| 配置守卫、扩展协议与插件 | [守卫与插件](guards-and-plugins) |
| 安装覆盖层、高亮、导览、焦点与滚动 | [高亮与导览](interactions) |
| 隔离服务端请求、恢复地址与测试导航 | [SSR 与测试](state-ssr-and-testing) |
| 查询精确类型、字段与方法 | [API 参考](/zh/api/) |

## 安装前提

Node.js >=22.12.0。React >=18、React DOM >=18、React Router DOM >=6；或 Vue >=3.5、Vue Router >=4.0.16。框架和 Router 是可选 peer，只安装实际使用的组合，应用与 RP 解析到同一份依赖。

```sh
# 已有 React 和 React DOM 的应用
npm install @jangts/router-plus react-router-dom

# 已有 Vue 的应用
npm install @jangts/router-plus vue-router
```

## 三种配置的职责

- `pages` 描述可导航页面；`PageDefinition.states` 让原生来源挂载前也能构造带状态的目标地址。
- `useRp*` 创建原生状态，`useReactState`／`useVueState` 登记已有来源；最后的 ID 或配置可省略。ID 只提供访问入口，不自动把原生状态存入历史。
- `query` 声明同步到地址的参数；保留组件与 DOM 需要页面的 `retain` 和框架渲染宿主。

Tab、Panel 开关与表单字段都使用同一套原生状态接口。业务验证、授权、数据加载和提交仍由应用拥有。
