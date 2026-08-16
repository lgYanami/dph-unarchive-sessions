/** Archived-panel slot registration and its unarchive injection. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { apply, inject } from '@deepseek-ai/dsh-client-ui-unarchive/client'
import type { ArchivedPanelInjected } from '@deepseek-ai/dsh-client-ui-unarchive/client'

async function bench(declare = true) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const workspaces = { unarchiveSession: vi.fn(async () => {}) }
  ctx.provide('workspaces', workspaces as never)
  ctx.provide('locale', new LocaleRuntime(ctx))
  const slots = ctx.get('slots') as SlotRegistry
  if (declare) {
    slots.register(
      { name: 'root', children: { 'sidebar.workspaces.archivedPanel': { kind: 'single', scope: 'root' } } } as never,
      () => null,
    )
  }
  return { ctx, slots, workspaces }
}

describe('ui-unarchive apply', () => {
  it('declares only the services it uses', () => {
    expect(inject).toEqual(['slots', 'workspaces', 'locale'])
  })

  it('registers the panel and injects the unarchive action', async () => {
    const b = await bench()
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const entries = b.slots.entries('sidebar.workspaces.archivedPanel')
    expect(entries).toHaveLength(1)
    expect(entries[0]!.locale).toBe('unarchive')
    const injected = (entries[0]!.inject as unknown as () => ArchivedPanelInjected)()
    await injected.unarchiveSession('session-x' as never)
    expect(b.workspaces.unarchiveSession).toHaveBeenCalledWith('session-x')
  })

  it('waits without registering while no live owner declares the panel hole', async () => {
    const b = await bench(false)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    // The inject face waits for the declaration (activation order between
    // ui-workspace and this package is unconstrained), so nothing lands.
    expect(b.slots.entries('sidebar.workspaces.archivedPanel')).toHaveLength(0)
  })

  it('removes the entry on teardown', async () => {
    const b = await bench()
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    await fiber.dispose()
    expect(b.slots.entries('sidebar.workspaces.archivedPanel')).toHaveLength(0)
  })
})
