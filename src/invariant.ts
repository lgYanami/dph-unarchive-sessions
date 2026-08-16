/** Package-owned invariant companion for the archived-session restore UI plugin. */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-unarchive'

/** Cordis companion plugin name. */
export const name = 'client-ui-unarchive-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the browser plugin contributes one effect-owned
 * panel registration and dictionary; tests prove their disposal, and the
 * workspace registry owns the durable archive-set invariants.
 */
const install: InvariantInstaller = () => {}

/** Register this package's invariant companion. */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
