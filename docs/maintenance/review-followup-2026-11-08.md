# Router Plus 接入复查修正记录

日期：2026-11-08。范围为接入复查指出的五项问题及 React 对应行为；此前的 72 项验证保留在[实施复查记录](implementation-verification-2026-11-08.md)。

## 修正与证据

| 问题 | 修正后的行为 | 回归证据 |
| --- | --- | --- |
| Tab 选择混淆动态实例 | 两端共用 resolveTabPage；具体路径按 page id 和 pathname 判断是否当前实例，跨实例保留完整 href。匹配当前页的 id 继续指代当前实例；非当前必填参数不能凭空推断 | React/Vue 真实挂载：从同一页面定义的 first 跳到 second，保留 query/hash，后续 Tab 仍更新 second |
| scoped 导航使用活动页守卫 | 显式来源传入导航编排，不临时改动根 context；navigate、replace、execute 和 setTab 共用来源合同 | 隐藏来源页的全局/页面守卫按其 context 执行；阻止时活动页保持原址；navigation.from 指向来源 scope |
| 目录类型与投影不符 | 从 PageCatalogEntry 删除 component/layout；PageDefinition 中保留生成器需要的键 | 包构建及 NodeNext 消费者类型检查通过 |
| 全局键冲突静默忽略 | 占用即抛错；自动挂载在初始插件执行前检查；解绑按 attachment 和 facade 的真实引用判定所有权 | 两实例冲突、外部替换、旧 cleanup 对新 attachment、构造冲突无插件副作用测试 |
| Vue 原地对象更新不通知 | 匹配的 state 通知读到同一引用时 triggerRef；不同引用正常赋值，不复制桥状态 | 普通对象 count 原地修改并通知后，真实 Vue 渲染文本由 0 更新为 7 |

## 验证结果

- `npm run build --workspace=@jangts/router-plus`：通过。
- `npm test --workspace=@jangts/router-plus`：77 pass / 0 fail / 0 skipped，包含原有 72 项及新增 5 项。
- 11 对 ESM/CJS 入口、CSS 及 NodeNext 消费者检查包含在包测试中，均通过。
- `git diff --check -- packages/router-plus`：通过。

未启动应用或浏览器，未进行视觉验收、发布或运行内容操作。本轮未重跑完整 Workspace 检查，不改变此前根 lockfile 可选依赖缺失的结论。
