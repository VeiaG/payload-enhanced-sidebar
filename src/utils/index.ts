import type {
  EnhancedSidebarConfig,
  ExtendedGroup,
  LocalizedString,
  SidebarComponent,
  SidebarSortKey,
  SortableGroup,
  TabSortConfig,
} from '../types.js'

export const convertSlugToTitle = (slug: string): string => {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Extracts path and clientProps from a SidebarComponent (string or object).
 */
export const resolveSidebarComponent = (
  component: SidebarComponent,
): { clientProps: Record<string, unknown>; path: string } => {
  if (typeof component === 'string') {
    return { clientProps: {}, path: component }
  }
  return { clientProps: component.clientProps ?? {}, path: component.path }
}

/**
 * Strips all non-serializable values (functions) from the sidebar config
 * before passing it to client components.
 */
export const sanitizeSidebarConfig = (config: EnhancedSidebarConfig): EnhancedSidebarConfig => {
  // `sort` holds server-side functions — drop it entirely before sending to the client.
  const { sort: _sort, ...rest } = config
  return {
    ...rest,
    tabs: rest.tabs?.map((tab) => {
      const { access: _, ...tabRest } = tab
      if (tabRest.type === 'tab' && tabRest.customItems) {
        return {
          ...tabRest,
          customItems: tabRest.customItems.map(({ access: __, ...item }) => item),
        }
      }
      return tabRest
    }),
  }
}

/**
 * Compares two sort keys. Numbers sort ascending and before strings;
 * strings sort via `localeCompare`. `undefined` is treated as `0`.
 */
const compareSortKeys = (a: SidebarSortKey, b: SidebarSortKey): number => {
  const ka = a ?? 0
  const kb = b ?? 0
  const aIsNum = typeof ka === 'number'
  const bIsNum = typeof kb === 'number'
  if (aIsNum && bIsNum) {
    return ka - kb
  }
  if (aIsNum) {
    return -1
  }
  if (bIsNum) {
    return 1
  }
  return String(ka).localeCompare(String(kb))
}

/**
 * Stable sort by a key function (decorate–sort–undecorate so equal keys keep
 * their original relative order).
 */
const stableSortBy = <T>(arr: T[], keyFn: (item: T) => SidebarSortKey): T[] =>
  arr
    .map((item, index) => ({ index, item, key: keyFn(item) }))
    .sort((a, b) => compareSortKeys(a.key, b.key) || a.index - b.index)
    .map(({ item }) => item)

const isUngroupedGroup = (group: ExtendedGroup): boolean =>
  !group.label || (typeof group.label === 'string' && group.label === '')

const toSortableGroup = (group: ExtendedGroup): SortableGroup => ({
  entities: group.entities,
  isUngrouped: isUngroupedGroup(group),
  label: group.label,
})

/**
 * Applies a tab's sort configuration to its computed groups, as a final pass
 * over the default ordering. Returns the input untouched when no sort is given.
 *
 * - When `groups` is set, multi-item ungrouped blocks are split into individual
 *   single-item units so they can be interleaved between real groups.
 * - `items` sorts entities within each group only.
 */
export const sortTabGroups = (
  groups: ExtendedGroup[],
  sort: TabSortConfig | undefined,
  locale: string,
): ExtendedGroup[] => {
  if (!sort || (!sort.groups && !sort.items)) {
    return groups
  }

  const ctx = { locale }
  let result = groups

  // Split ungrouped blocks into single-item units so each can be ordered independently.
  if (sort.groups) {
    const expanded: ExtendedGroup[] = []
    for (const group of result) {
      if (isUngroupedGroup(group) && group.entities.length > 1) {
        for (const entity of group.entities) {
          expanded.push({ entities: [entity], label: '' })
        }
      } else {
        expanded.push(group)
      }
    }
    result = expanded
  }

  // Sort entities within each group.
  if (sort.items) {
    const itemSort = sort.items
    result = result.map((group) => {
      const sortableGroup = toSortableGroup(group)
      return {
        ...group,
        entities: stableSortBy(group.entities, (entity) =>
          itemSort(entity, sortableGroup, ctx),
        ),
      }
    })
  }

  // Sort the top-level groups.
  if (sort.groups) {
    const groupSort = sort.groups
    result = stableSortBy(result, (group) => groupSort(toSortableGroup(group), ctx))
  }

  return result
}


export const extractLocalizedValue = (
  value: LocalizedString | undefined,
  locale: string,
  fallbackSlug?: string,
): string => {
  if (!value) {
    return fallbackSlug ? convertSlugToTitle(fallbackSlug) : ''
  }
  if (typeof value === 'string') {
    return value
  }
  return value[locale] || Object.values(value)[0] || (fallbackSlug ? convertSlugToTitle(fallbackSlug) : '')
}
