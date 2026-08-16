# dph-unarchive-sessions

English | [中文](README.zh.md)

A **DPH plugin** for the DeepSeek Harness web surface: restores archived sessions from the workspace browser, grouped strictly by workspace.

DSH's workspace row action menu can archive a session (「归档会话」) but — in the stock harness — has no way back. This plugin closes the loop:

- Adds a 「查看归档会话」 entry to every workspace row's three-dot menu (only when this plugin is loaded).
- Opens a floating panel listing **exactly that workspace's** archived sessions, with checkbox selection, per-group restore, restore-selected, and restore-all actions.
- Restores ride the public `workspace.unarchiveSession` RPC; the changed frame keeps every open browser consistent, and sessions reappear in their original account position without a reload.

## What archiving is (and why restore is safe)

Archiving never touches a session's log or its workspace accounting slot: the archive set is a display filter over the durable account. Restoring removes the id from that set, so the session returns exactly where it was.

## Repository layout

- `src/` — the browser plugin package `@deepseek-ai/dsh-client-ui-unarchive` (panel, locale dictionaries, invariant companion).
- `tests/` — vitest suites: slot registration/teardown and panel scoping/restore behavior.
- `harness-prerequisite.patch` — the **required host-side changes** the plugin depends on.

## Prerequisite: the harness patch

The stock harness has no unarchive API and no panel hole. `harness-prerequisite.patch` adds them to a deepseek-harness checkout:

1. `dsh-workspace`: public `WorkspaceRegistry.unarchiveSession(sessionId)` (idempotent, serialized, pure archive-set write).
2. `dsh-host-apiproxy`: `workspace.unarchiveSession` RPC; the existing `domain/changed` listener already emits `host/archived-sessions-changed`, so no new event plumbing.
3. `dsh-client-runtime`: `unarchiveSession` on the workspaces face.
4. `dsh-client-ui-workspace`: the `sidebar.workspaces.archivedPanel` hole (occupancy-gated) plus the row menu entry.
5. Bundle wiring: the `ui-unarchive` row in the `dsh.client` roster, the `web-app` dependency, and the `tsconfig.base.json` source mapping.

Apply it with `git apply` inside the harness checkout and rebuild (`pnpm install && npm run build:lib:host && npm run build:lib:client && npm run build:web`), then restart `dsh web`.

## Install

Drop this repository in as the plugin package inside the harness workspace:

```sh
cp -r dph-unarchive-sessions <harness>/packages/client/ui-unarchive
cd <harness>
pnpm install
npm run build:lib:client
```

The composition row, dependency, and tsconfig mapping come from `harness-prerequisite.patch` (above). Restart `dsh web` and hard-refresh the browser. The plugin then appears in Settings → 插件 as `ui-unarchive`, and every workspace row menu gains 「查看归档会话」.

## Architecture

- The panel registers into the `sidebar.workspaces.archivedPanel` slot through `slots.inject` (activation order between `ui-workspace` and this package is unconstrained).
- Data comes from the standard `useSessions`/`useWorkspaces` slot props; the single Host action — `unarchiveSession` — arrives through the slot's inject face.
- Restores update the shared `archivedSessionIds` store through the Host changed frame; the panel applies per-session RPC calls in sequence.

## Model Experience

None: this package renders durable session facts for humans and adds no prompt, tool schema, request content, or model-visible result.

## Known Limitations and Deferred Work

- The panel opens strictly scoped to the workspace row whose menu opened it, so archived sessions of other workspaces and of the Ungrouped bucket are not visible from that view; there is no dedicated ungrouped-row entry point.
- Restoring many sessions issues one RPC per session; a bulk endpoint would batch them.

## License

[MIT](LICENSE) © 2026 lgYanami
