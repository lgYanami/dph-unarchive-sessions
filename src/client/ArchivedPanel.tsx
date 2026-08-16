/**
 * The archived-session panel: an overlay listing every archived session
 * grouped by its workspace account (plus an Ungrouped bucket), with
 * checkbox selection, per-group restore, restore-selected, and
 * restore-everything actions. Opening from a workspace row menu pins that
 * workspace's group first while the other groups stay reachable below.
 */
import { useState } from 'react'
import {
  IconArchiveOutline20, IconCloseOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  SessionId, SessionListState, WorkspaceId, WorkspaceListState,
} from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { ArchivedPanelOwnerProps } from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './ArchivedPanel.module.css'

/** One panel group: a workspace account with its archived sessions. */
interface ArchivedGroup {
  readonly workspaceId: WorkspaceId | null
  readonly title: string
  readonly ids: readonly SessionId[]
}

/** Injected share: the single Host action the panel drives. */
export interface ArchivedPanelInjected {
  /** Restore one archived session (Host durability plus store echo). */
  unarchiveSession: (sessionId: SessionId) => Promise<void>
}

/** Full panel props: the owner share, standard hooks, injected action, and copy. */
export type ArchivedPanelProps =
  ArchivedPanelOwnerProps
  & ArchivedPanelInjected
  & {
    useSessions: SnapshotSelectorHook<SessionListState>
    useWorkspaces: SnapshotSelectorHook<WorkspaceListState>
  }
  & PropsLocale<'unarchive'>

/** Restore-outcome banner owned by this panel's interaction. */
interface RestoreStatus {
  readonly ok: boolean
  readonly count: number
}

/**
 * Render the archived-session panel.
 * @param props - owner share plus the standard hooks and injected action.
 * @returns the overlay, or null while closed.
 */
export function ArchivedPanel({
  open,
  scope,
  onClose,
  unarchiveSession,
  useSessions,
  useWorkspaces,
  t,
}: ArchivedPanelProps) {
  const byId = useSessions(state => state.byId)
  const items = useWorkspaces(state => state.items)
  const archivedIds = useWorkspaces(state => state.archivedSessionIds)
  const [selected, setSelected] = useState<readonly SessionId[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<RestoreStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const archivedSet = new Set(archivedIds)
  const groups: ArchivedGroup[] = []
  const accounted = new Set<SessionId>()
  for (const item of items) {
    const ids = item.sessionIds.filter(id => archivedSet.has(id))
    for (const id of ids) accounted.add(id)
    if (ids.length > 0) groups.push({ workspaceId: item.workspaceId, title: item.title, ids })
  }
  const ungrouped = [...archivedSet].filter(id => !accounted.has(id))
  // Strict scoping: opening from a workspace row menu shows exactly that
  // workspace's archived sessions — other groups and the Ungrouped bucket
  // stay out of the view (and out of the restore-all action).
  const scopedTitle = scope === null
    ? undefined
    : items.find(item => item.workspaceId === scope)?.title
  const scopedGroup = scope === null
    ? undefined
    : groups.find(group => group.workspaceId === scope)
  const visibleGroups = scope === null
    ? groups
    : (scopedGroup !== undefined ? [scopedGroup] : [])
  const showUngrouped = scope === null && ungrouped.length > 0
  // Scoped to a workspace with no archived sessions, the view is empty —
  // never the global set.
  const visibleCount = scope === null ? archivedSet.size : (scopedGroup?.ids.length ?? 0)
  const restoreAllIds = scope === null ? [...archivedSet] : (scopedGroup?.ids ?? [])
  const selectedSet = new Set(selected)

  const toggle = (id: SessionId): void => {
    setSelected(prev => prev.includes(id) ? prev.filter(existing => existing !== id) : [...prev, id])
  }
  const toggleGroup = (ids: readonly SessionId[], allSelected: boolean): void => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of ids) next.delete(id)
      } else {
        for (const id of ids) next.add(id)
      }
      return [...next]
    })
  }
  const doRestore = async (ids: readonly SessionId[]): Promise<void> => {
    setBusy(true)
    setError(null)
    let restored = 0
    try {
      for (const id of ids) {
        await unarchiveSession(id)
        restored += 1
      }
      const removed = new Set(ids)
      setSelected(prev => prev.filter(id => !removed.has(id)))
      setStatus({ ok: true, count: restored })
    } catch (reason: unknown) {
      setStatus(null)
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const groupBlock = (group: ArchivedGroup, key: string) => {
    const allSelected = group.ids.length > 0 && group.ids.every(id => selectedSet.has(id))
    const countKey = group.ids.length === 1 ? 'group.count.one' : 'group.count.other'
    return (
      <div key={key} className={css.group}>
        <div className={css.groupHeader}>
          <input
            type="checkbox"
            className={css.check}
            checked={allSelected}
            aria-label={group.title}
            onChange={() => { toggleGroup(group.ids, allSelected) }}
          />
          <span className={css.groupTitle}>{group.title}</span>
          <span className={css.groupCount}>{t(countKey, { n: group.ids.length })}</span>
          <button
            type="button"
            className={css.miniButton}
            disabled={busy}
            onClick={() => { void doRestore(group.ids) }}
          >
            {t('restore.group')}
          </button>
        </div>
        {group.ids.map((id) => {
          const summary = byId[id]
          const title = summary?.displayTitle ?? id
          return (
            <label key={id} className={css.row}>
              <input
                type="checkbox"
                className={css.check}
                checked={selectedSet.has(id)}
                aria-label={t('row.aria', { title })}
                onChange={() => { toggle(id) }}
              />
              <span className={css.rowTitle}>{title}</span>
            </label>
          )
        })}
      </div>
    )
  }

  const headerTitle = scopedTitle !== undefined
    ? t('title.scoped', { title: scopedTitle, n: visibleCount })
    : t('title', { n: visibleCount })

  return (
    <div className={css.panel} role="dialog" aria-label={headerTitle}>
      <div className={css.header}>
        <IconArchiveOutline20 className={css.headerIcon} />
        <span className={css.headerTitle}>{headerTitle}</span>
        <button
          type="button"
          className={css.close}
          aria-label={t('close.aria')}
          onClick={onClose}
        >
          <IconCloseOutline16 />
        </button>
      </div>
      {status !== null && (
        <div className={css.status} role="status">
          {t(status.count === 1 ? 'restored.one' : 'restored.other', { n: status.count })}
        </div>
      )}
      {error !== null && (
        <div className={css.error} role="alert">{error}</div>
      )}
      {visibleGroups.map((group, index) => groupBlock(group, `g${index}`))}
      {showUngrouped && groupBlock({ workspaceId: null, title: t('group.ungrouped'), ids: ungrouped }, 'g-ungrouped')}
      {visibleCount === 0 && (
        <div className={css.empty}>
          {scope !== null
            ? t('empty.scoped', { title: scopedTitle ?? '' })
            : (
              <>
                <div>{t('empty')}</div>
                <div>{t('empty.hint')}</div>
              </>
            )}
        </div>
      )}
      <div className={css.bar}>
        <button
          type="button"
          className={css.primaryButton}
          disabled={selected.length === 0 || busy}
          onClick={() => { void doRestore(selected) }}
        >
          {t('restore.selected', { n: selected.length })}
        </button>
        <button
          type="button"
          className={css.button}
          disabled={visibleCount === 0 || busy}
          onClick={() => { void doRestore(restoreAllIds) }}
        >
          {t('restore.all')}
        </button>
        <button type="button" className={css.button} onClick={onClose}>{t('close')}</button>
      </div>
    </div>
  )
}
