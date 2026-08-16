// @vitest-environment jsdom
/** ArchivedPanel rendering: strict workspace scoping and restore wiring. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import type {
  SessionId, SessionListState, SessionSummary, WorkspaceId, WorkspaceListState, WorkspaceView,
} from '@deepseek-ai/dsh-client-runtime/client'
import { ArchivedPanel, type ArchivedPanelProps } from '../src/client/ArchivedPanel.tsx'
import { zh } from '../src/client/locales.ts'

afterEach(cleanup)

const t = makeTranslate(zh, commonZh)
const sid = (id: string) => id as SessionId
const wid = (id: string) => id as WorkspaceId

const workspace = (id: string, sessionIds: string[]): WorkspaceView => ({
  workspaceId: wid(id), path: `/p/${id}`, title: id,
  sessionIds: sessionIds.map(sid),
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
})

const summary = (id: string): SessionSummary => ({
  id: sid(id), displayTitle: `title-${id}`, running: false, blank: false, updatedAt: 1,
})

const workspaceState = (items: WorkspaceView[], archived: string[]): WorkspaceListState => ({
  items, archivedSessionIds: archived.map(sid), state: 'idle', phase: 'ready', error: null,
  baselinesReady: true, recentWorkspaceId: items[0]?.workspaceId,
})

const sessionState = (ids: string[]): SessionListState => ({
  ids: ids.map(sid),
  byId: Object.fromEntries(ids.map(id => [id, summary(id)])),
  current: undefined, phase: 'ready', subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined,
})

function hook<T>(snapshot: T) {
  return function select<S>(selector: (state: T) => S): S { return selector(snapshot) }
}

function mount(overrides: {
  open?: boolean
  scope?: WorkspaceId | null
  items?: WorkspaceView[]
  archived?: string[]
  unarchiveSession?: ReturnType<typeof vi.fn>
} = {}) {
  const {
    open = true,
    scope = null,
    items = [workspace('alpha', ['a1', 'a2']), workspace('beta', ['b1'])],
    archived = ['a1', 'b1', 'loose'],
    unarchiveSession = vi.fn(async () => {}),
  } = overrides
  const props = {
    open,
    scope,
    onClose: vi.fn(),
    unarchiveSession: unarchiveSession as never,
    useSessions: hook(sessionState([...new Set([...items.flatMap(item => item.sessionIds), ...archived])])),
    useWorkspaces: hook(workspaceState(items, archived)),
    t,
  }
  render(<ArchivedPanel {...props as unknown as ArchivedPanelProps} />)
  return { unarchiveSession, props }
}

describe('ArchivedPanel scoping', () => {
  it('renders nothing while closed', () => {
    mount({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('scoped view shows exactly the target workspace, hiding other workspaces and the Ungrouped bucket', () => {
    mount({ scope: wid('alpha') })
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toContain('alpha')
    expect(screen.getByLabelText('恢复会话“title-a1”')).toBeTruthy()
    expect(screen.queryByLabelText('恢复会话“title-b1”')).toBeNull()
    expect(screen.queryByText('未分组')).toBeNull()
    expect(screen.queryByText('title-loose')).toBeNull()
  })

  it('unscoped view shows every workspace group and the Ungrouped bucket', () => {
    mount()
    expect(screen.getByLabelText('恢复会话“title-a1”')).toBeTruthy()
    expect(screen.getByLabelText('恢复会话“title-b1”')).toBeTruthy()
    expect(screen.getByText('未分组')).toBeTruthy()
    expect(screen.getByLabelText('恢复会话“title-loose”')).toBeTruthy()
  })

  it('restore-all in a scoped view restores only that workspace\'s archived sessions', () => {
    const { unarchiveSession } = mount({ scope: wid('alpha') })
    fireEvent.click(screen.getByRole('button', { name: '全部恢复' }))
    expect(unarchiveSession).toHaveBeenCalledTimes(1)
    expect(unarchiveSession).toHaveBeenCalledWith(sid('a1'))
  })

  it('restore-selected restores exactly the checked rows', async () => {
    const { unarchiveSession } = mount()
    fireEvent.click(screen.getByLabelText('恢复会话“title-b1”'))
    fireEvent.click(screen.getByLabelText('恢复会话“title-loose”'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '恢复所选（2）' }))
    })
    expect(unarchiveSession).toHaveBeenCalledTimes(2)
    expect(unarchiveSession.mock.calls.map(call => call[0])).toEqual([sid('b1'), sid('loose')])
  })

  it('scoped view with no archived sessions shows the workspace-empty message and disables restore-all', () => {
    mount({ scope: wid('beta'), archived: ['a1', 'loose'] })
    expect(screen.getByText(/“beta” 没有已归档的会话/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '全部恢复' }).getAttribute('disabled')).not.toBeNull()
  })

  it('close button asks the owner to close', () => {
    const { props } = mount()
    fireEvent.click(screen.getByRole('button', { name: '关闭已归档会话面板' }))
    expect(props.onClose).toHaveBeenCalledOnce()
  })
})
