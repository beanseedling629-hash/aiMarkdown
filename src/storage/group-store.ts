/**
 * Group Store - manages article groups/folders.
 */

export interface Group {
  id: string
  name: string
  order: number
}

const GROUPS_KEY = 'article_groups'

const DEFAULT_GROUPS: Group[] = [
  { id: 'unread', name: '待读', order: 0 },
  { id: 'tech', name: '技术', order: 1 },
  { id: 'design', name: '设计', order: 2 },
]

/** Get all groups */
export async function getAllGroups(): Promise<Group[]> {
  const result = await chrome.storage.local.get(GROUPS_KEY)
  if (!result[GROUPS_KEY] || result[GROUPS_KEY].length === 0) {
    await chrome.storage.local.set({ [GROUPS_KEY]: DEFAULT_GROUPS })
    return DEFAULT_GROUPS
  }
  return result[GROUPS_KEY]
}

/** Add a new group */
export async function addGroup(name: string): Promise<Group> {
  const groups = await getAllGroups()
  const newGroup: Group = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    order: groups.length,
  }
  groups.push(newGroup)
  await chrome.storage.local.set({ [GROUPS_KEY]: groups })
  return newGroup
}

/** Delete a group (articles in it move to "待读") */
export async function deleteGroup(id: string): Promise<void> {
  if (id === 'unread') return // can't delete default
  const groups = await getAllGroups()
  const filtered = groups.filter(g => g.id !== id)
  await chrome.storage.local.set({ [GROUPS_KEY]: filtered })
}

/** Rename a group */
export async function renameGroup(id: string, name: string): Promise<void> {
  const groups = await getAllGroups()
  const group = groups.find(g => g.id === id)
  if (group) {
    group.name = name
    await chrome.storage.local.set({ [GROUPS_KEY]: groups })
  }
}

/** Reorder groups */
export async function reorderGroups(orderedIds: string[]): Promise<void> {
  const groups = await getAllGroups()
  const reordered = orderedIds
    .map((id, i) => {
      const g = groups.find(g => g.id === id)
      if (g) return { ...g, order: i }
      return null
    })
    .filter(Boolean) as Group[]
  await chrome.storage.local.set({ [GROUPS_KEY]: reordered })
}
