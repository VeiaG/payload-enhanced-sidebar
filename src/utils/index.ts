import type {
  EnhancedSidebarConfig,
  ExtendedGroup,
  IconName,
  LogoConfig,
  LocalizedString,
  SidebarComponent,
  SidebarSortKey,
  SortableGroup,
  TabSortConfig,
} from '../types.js'

/**
 * Prefix for the entries this plugin adds to Payload's `admin.components.sidebar.tabs`, so
 * that `lazy` tabs can be rendered through Payload's `render-tab` server function. Those
 * entries are ours, not native tabs, and are skipped when native tabs are collected.
 */
export const LAZY_TAB_SLUG_PREFIX = 'enhanced-sidebar__'

export const getLazyTabSlug = (tabId: string): string => `${LAZY_TAB_SLUG_PREFIX}${tabId}`

export const convertSlugToTitle = (slug: string): string => {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Payload's own tab switcher panel, rendered in the `nativeTabs: 'group'` tab */
export const NATIVE_TABS_PANEL_PATH = '@veiag/payload-enhanced-sidebar/rsc#NativeTabsPanel'

export type ResolvedNativeTabs =
  | {
      icon?: IconName
      iconComponent?: SidebarComponent
      id: string
      label: LocalizedString
      mode: 'group'
      /** True when a `{ type: 'native' }` item in `tabs` sets where the tab goes */
      placed: boolean
      position: 'bottom' | 'top'
    }
  | { mode: 'map' }

/**
 * Normalizes the `nativeTabs` option. Returns `null` when native tabs are off. A
 * `{ type: 'native' }` item in `tabs` places the Browse tab and its options win.
 */
export const resolveNativeTabsConfig = (
  nativeTabs: EnhancedSidebarConfig['nativeTabs'],
  tabs?: EnhancedSidebarConfig['tabs'],
): null | ResolvedNativeTabs => {
  if (nativeTabs === false) {
    return null
  }
  if (nativeTabs === 'map' || (typeof nativeTabs === 'object' && nativeTabs.mode === 'map')) {
    return { mode: 'map' }
  }
  const options = typeof nativeTabs === 'object' ? nativeTabs : {}
  const placed = tabs?.find((tab) => tab.type === 'native')
  const iconComponent = placed?.icon ? undefined : (placed?.iconComponent ?? options.iconComponent)
  return {
    icon: iconComponent ? undefined : (placed?.icon ?? options.icon ?? 'FolderTree'),
    iconComponent,
    id: placed?.id ?? options.id ?? 'payload-tabs',
    label: placed?.label ?? options.label ?? { en: 'Browse', uk: 'Огляд' },
    mode: 'group',
    placed: Boolean(placed),
    position: placed?.position ?? options.position ?? 'top',
  }
}

/**
 * Normalizes the `logo` option. Returns `null` when the logo is off; `component: undefined`
 * means the default (`graphics.Icon`, then the Payload icon).
 */
export const resolveLogoConfig = (
  logo: EnhancedSidebarConfig['logo'],
): { component?: SidebarComponent; container: NonNullable<LogoConfig['container']> } | null => {
  if (logo === false) {
    return null
  }
  if (logo === undefined || logo === true) {
    return { container: 'inverse' }
  }
  // A component object always has `path`; a LogoConfig never does
  if (typeof logo === 'string' || 'path' in logo) {
    return { component: logo, container: 'inverse' }
  }
  return { component: logo.component, container: logo.container ?? 'inverse' }
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
        entities: stableSortBy(group.entities, (entity) => itemSort(entity, sortableGroup, ctx)),
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
  return (
    value[locale] ||
    Object.values(value)[0] ||
    (fallbackSlug ? convertSlugToTitle(fallbackSlug) : '')
  )
}
