/**
 * `unarchive` namespace dictionaries: the archived-session panel opened from
 * a workspace row's action menu. Runtime failure messages (wire error
 * strings) pass through untranslated by policy.
 */

/** Dictionary namespace owned by this plugin. */
export const NS = 'unarchive'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'title': '已归档会话（{n}）',
  'title.scoped': '“{title}” 的已归档会话（{n}）',
  'group.ungrouped': '未分组',
  'group.count.one': '{n} 个',
  'group.count.other': '{n} 个',
  'restore.group': '恢复本组',
  'restore.selected': '恢复所选（{n}）',
  'restore.all': '全部恢复',
  'close': '关闭',
  'close.aria': '关闭已归档会话面板',
  'row.aria': '恢复会话“{title}”',
  'empty': '没有已归档的会话',
  'empty.hint': '在会话行菜单里归档会话后，会按所属工作区显示在这里。',
  'empty.scoped': '“{title}” 没有已归档的会话',
  'restored.one': '已恢复 {n} 个会话',
  'restored.other': '已恢复 {n} 个会话',
}

/** English dictionary (mirrors the Chinese key set). */
export const en = {
  'title': 'Archived sessions ({n})',
  'title.scoped': 'Archived sessions in “{title}” ({n})',
  'group.ungrouped': 'Ungrouped',
  'group.count.one': '{n} session',
  'group.count.other': '{n} sessions',
  'restore.group': 'Restore group',
  'restore.selected': 'Restore selected ({n})',
  'restore.all': 'Restore all',
  'close': 'Close',
  'close.aria': 'Close archived sessions panel',
  'row.aria': 'Restore session “{title}”',
  'empty': 'No archived sessions',
  'empty.hint': 'Archive sessions from a session row menu and they will appear here, grouped by workspace.',
  'empty.scoped': 'No archived sessions in “{title}”',
  'restored.one': 'Restored {n} session',
  'restored.other': 'Restored {n} sessions',
} satisfies Record<UnarchiveKey, string>

/** Dictionary keys of this namespace (derived from the Chinese source). */
export type UnarchiveKey = keyof typeof zh
