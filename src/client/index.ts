/**
 * Browser plugin for restoring archived sessions. One registration: the
 * archived-panel hole the workspace browser declares (`sidebar.workspaces.archivedPanel`),
 * whose occupancy also gates the workspace row menu's "查看归档会话" entry.
 * The panel reads the standard useSessions/useWorkspaces hooks, drives the
 * Host through the injected `unarchiveSession` action, and rides the
 * frame-wide overlay layer through the browser's renderSlot seat.
 * Export discipline: packages/client/AGENTS.md.
 */
import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { ArchivedPanel, type ArchivedPanelInjected } from './ArchivedPanel.tsx'
import { en, NS, type UnarchiveKey, zh } from './locales.ts'

export type { ArchivedPanelInjected, ArchivedPanelProps } from './ArchivedPanel.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The archived-session restore panel copy. */
    unarchive: UnarchiveKey
  }
}

/** Required services: the slot system, the workspaces face, and copy. */
export const inject = ['slots', 'workspaces', 'locale']

/**
 * Register the panel once the workspace browser declares its hole. Slot
 * injection follows the owner and declaration lifetimes, so a browser
 * without the hole (or unloaded) leaves this registration waiting.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-unarchive: dictionaries')
  ctx.slots.inject('sidebar.workspaces.archivedPanel', () => ctx.slots.register(
    {
      name: 'sidebar.workspaces.archivedPanel',
      locale: NS,
      inject: (): ArchivedPanelInjected => ({
        unarchiveSession: async (sessionId: SessionId) => {
          await ctx.workspaces.unarchiveSession(sessionId)
        },
      }),
    },
    ArchivedPanel,
  ))
}
