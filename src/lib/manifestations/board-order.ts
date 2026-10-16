type OrderedItem = {
  id: string
  sort_order?: number | null
  created_at: string
  isMine?: boolean
}

/** Lower sort_order is first. Ties keep the newest creation in front. */
export function compareBoardOrder(a: OrderedItem, b: OrderedItem): number {
  const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER
  const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER
  if (aOrder !== bOrder) return aOrder - bOrder
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

/**
 * Apply a new visible order without shuffling items that are filtered out.
 * Own items are renumbered 0..n-1 so the saved order matches the board.
 */
export function reorderOwnedItems<T extends OrderedItem>(items: T[], orderedVisibleIds: string[]): T[] {
  const owned = items.filter((item) => item.isMine !== false).sort(compareBoardOrder)
  const ownedIds = new Set(owned.map((item) => item.id))
  const visibleSet = new Set(orderedVisibleIds.filter((id) => ownedIds.has(id)))
  const queue = orderedVisibleIds.filter((id) => visibleSet.has(id))
  const rebuilt = owned.map((item) => {
    if (!visibleSet.has(item.id)) return item.id
    return queue.shift() ?? item.id
  })
  const order = new Map(rebuilt.map((id, index) => [id, index]))
  return items.map((item) => {
    const sortOrder = order.get(item.id)
    return sortOrder === undefined ? item : { ...item, sort_order: sortOrder }
  })
}

/** Place a newly created manifestation at the front of the owner's board. */
export async function nextManifestationSortOrder(
  supabase: { from: (table: string) => any },
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from('manifestations')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()
  const current = typeof data?.sort_order === 'number' ? data.sort_order : 0
  return current - 1
}
