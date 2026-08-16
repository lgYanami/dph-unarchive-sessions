# dph-unarchive-sessions

[English](README.md) | 中文

面向 DeepSeek Harness Web 界面的 **DPH 插件**：从工作区浏览器恢复已归档会话，严格按工作区过滤。

DSH 的工作区行操作菜单可以归档会话（「归档会话」），但原生 harness 没有恢复途径。本插件补上闭环：

- 为每个工作区行的三点菜单增加「查看归档会话」入口（仅在本插件加载时出现）。
- 弹出浮动面板，**只列出该工作区**的归档会话，支持复选框多选、恢复本组、恢复所选与全部恢复。
- 恢复操作走公开的 `workspace.unarchiveSession` RPC；变更帧让每个打开的浏览器保持一致，会话无需刷新即回到原账目位置。

## 归档是什么（以及为什么恢复是安全的）

归档从不改动会话日志或工作区账目槽位：归档集合只是账目之上的显示过滤器。恢复即把 ID 从该集合中移除，会话必然回到原处。

## 仓库结构

- `src/` — 浏览器插件包 `@deepseek-ai/dsh-client-ui-unarchive`（面板、本地化字典、invariant 伴生）。
- `tests/` — vitest 套件：插槽注册/卸载与面板过滤/恢复行为。
- `harness-prerequisite.patch` — 插件依赖的**必需宿主侧改动**。

## 前置条件：harness 补丁

原生 harness 没有取消归档 API，也没有面板洞。`harness-prerequisite.patch` 在 deepseek-harness 检出中补齐：

1. `dsh-workspace`：公开方法 `WorkspaceRegistry.unarchiveSession(sessionId)`（幂等、串行化、纯归档集合写入）。
2. `dsh-host-apiproxy`：`workspace.unarchiveSession` RPC；既有的 `domain/changed` 监听器本就会发出 `host/archived-sessions-changed`，无需新增事件管道。
3. `dsh-client-runtime`：workspaces 面新增 `unarchiveSession`。
4. `dsh-client-ui-workspace`：`sidebar.workspaces.archivedPanel` 洞（按占用门控）加行菜单入口。
5. 组合接线：`dsh.client` 花名册中的 `ui-unarchive` 行、`web-app` 依赖、`tsconfig.base.json` 源码路径映射。

在 harness 检出中执行 `git apply`，然后重建（`pnpm install && npm run build:lib:host && npm run build:lib:client && npm run build:web`），再重启 `dsh web`。

## 安装

把本仓库放进 harness 工作区作为插件包：

```sh
cp -r dph-unarchive-sessions <harness>/packages/client/ui-unarchive
cd <harness>
pnpm install
npm run build:lib:client
```

组合行、依赖与 tsconfig 映射由 `harness-prerequisite.patch` 提供（见上）。重启 `dsh web` 并强制刷新浏览器后，插件出现在 设置 → 插件 中（条目 `ui-unarchive`），每个工作区行菜单新增「查看归档会话」。

## 架构

- 面板经 `slots.inject` 注册进 `sidebar.workspaces.archivedPanel` 插槽（`ui-workspace` 与本包的激活顺序无约束）。
- 数据来自标准的 `useSessions`/`useWorkspaces` 插槽 props；唯一的宿主动作 `unarchiveSession` 经插槽的 inject 面注入。
- 恢复通过宿主变更帧同步共享的 `archivedSessionIds` 状态；面板按会话逐个串行调用 RPC。

## 模型体验

无：该包只渲染面向人类的持久化会话事实，不增加任何提示词、工具 schema、请求内容或模型可见结果。

## 已知限制与后续工作

- 面板严格限定在打开它的工作区行：其他工作区与「未分组」区的归档会话在该视图中不可见，且未分组行没有独立入口。
- 恢复多个会话时逐会话发一次 RPC；批量端点可以把它们合并。

## 许可证

[MIT](LICENSE) © 2026 lgYanami
