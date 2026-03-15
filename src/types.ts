import type { icons, LucideIcon } from 'lucide-react'
import type { CollectionSlug, GlobalSlug, Where } from 'payload'
import type { ReactNode } from 'react'

export type IconName = keyof typeof icons

export type LocalizedString = { [locale: string]: string } | string

export type InternalIcon = IconName | LucideIcon

// ============================================
// Badge Types
// ============================================

/**
 * Available badge color variants
 */
export type BadgeColor = 'default' | 'error' | 'primary' | 'success' | 'warning'

/**
 * Badge configuration Trr API-based fetching
 */
export interface BadgeConfigApi {
  /**
   * Badge color variant
   * @default 'default'
   */
  color?: BadgeColor
  /**
   * API endpoint to fetch badge data from.
   * Can be relative (to current origin) or absolute URL.
   */
  endpoint: string
  /**
   * HTTP method for the request
   * @default 'GET'
   */
  method?: 'GET' | 'POST'
  /**
   * Key in the response object to extract the count from
   * @default 'count'
   */
  responseKey?: string
  type: 'api'
}

/**
 * Badge configuration for provider-based values.
 * Values are provided via BadgeProvider context.
 */
export interface BadgeConfigProvider {
  /**
   * Badge color variant
   * @default 'default'
   */
  color?: BadgeColor
  /**
   * Slug to look up in the BadgeProvider values.
   * If not specified, defaults to the item's id/slug.
   */
  slug?: string
  type: 'provider'
}

/**
 * Badge configuration for automatic collection document count.
 * Fetches from /api/{collectionSlug}?limit=0 and uses totalDocs.
 */
export interface BadgeConfigCollectionCount {
  /**
   * Collection slug to count documents from.
   * If not specified, defaults to the item's slug.
   */
  collectionSlug?: CollectionSlug
  /**
   * Badge color variant
   * @default 'default'
   */
  color?: BadgeColor
  type: 'collection-count'
  /**
   * Optional where query to filter documents.
   * Will be serialized as query string.
   * @example { status: { equals: 'draft' } }
   */
  where?: Where
}

/**
 * Badge configuration - union of all badge types
 */
export type BadgeConfig = BadgeConfigApi | BadgeConfigCollectionCount | BadgeConfigProvider

/**
 * Badge values provided via BadgeProvider context
 */
export type BadgeValues = Record<string, number | ReactNode>

// ============================================
// Enhanced Sidebar Types
// ============================================

/**
 * Path to a component, either as a plain string or as an object with a path and
 * additional client props to forward to the component. Follows Payload's component format.
 *
 * @example
 * ```typescript
 * // Simple path
 * iconComponent: './components/Icons#TabIcon'
 *
 * // With client props — useful for a single component shared across all tabs
 * iconComponent: {
 *   path: './components/Icons#TabIcon',
 *   clientProps: { icon: 'house' },
 * }
 * ```
 */
export type SidebarComponent =
  | {
      /** Additional props forwarded to the component on the client */
      clientProps?: Record<string, unknown>
      /** Component path in Payload's format: `'./path/to/file#ExportName'` */
      path: string
    }
  | string

/**
 * Mutually exclusive icon config: either a Lucide icon name OR a custom icon component path.
 */
type TabIconConfig =
  | {
      /** Icon name from lucide-react */
      icon: IconName
      iconComponent?: never
    }
  | {
      icon?: never
      /**
       * Path to a custom icon component. Receives `CustomTabIconProps`.
       * Supports a plain string path or `{ path, clientProps }` to forward extra props.
       * Registered automatically in the import map.
       */
      iconComponent: SidebarComponent
    }

/**
 * Sidebar tab that shows content when selected
 */
export type SidebarTabContent = {
  /**
   * Badge configuration for this tab.
   * Shows a badge on the tab icon in the tabs bar.
   */
  badge?: BadgeConfig
  /**
   * Collections to show in this tab.
   * If not specified, no collections are shown (unless items are specified).
   * Use collection slugs.
   */
  collections?: CollectionSlug[]
  /**
   * Custom items to add to this tab.
   * Items with `group` will be merged into matching collection groups.
   * Items without `group` will be shown at the bottom as a flat list.
   */
  customItems?: SidebarTabItem[]
  /**
   * Globals to show in this tab.
   * If not specified, no globals are shown.
   * Use global slugs.
   */
  globals?: GlobalSlug[]
  /** Unique identifier for the tab */
  id: string
  /** Tooltip/label for the tab */
  label: LocalizedString
  type: 'tab'
} & TabIconConfig

type SidebarTabLinkBase = {
  /**
   * Badge configuration for this link.
   * Shows a badge on the link icon in the tabs bar.
   */
  badge?: BadgeConfig
  /** Unique identifier */
  id: string
  /** Tooltip/label */
  label: LocalizedString
  type: 'link'
} & TabIconConfig
type SidebarTabLinkExternal = {
  /** Link href (absolute URL) */
  href: string
  isExternal: true
} & SidebarTabLinkBase
type SidebarTabLinkInternal = {
  /** Link href (relative to admin route) */
  href: '' | `/${string}`
  isExternal?: false
} & SidebarTabLinkBase
/**
 * Sidebar link that navigates to a URL (not a tab)
 */
export type SidebarTabLink = SidebarTabLinkExternal | SidebarTabLinkInternal
/**
 * A tab or link in the sidebar tabs bar
 */
export type SidebarTab = SidebarTabContent | SidebarTabLink

interface BaseSidebarTabItem {
  /**
   * Group to add this item to.
   * If matches an existing collection group label, item will be merged into that group.
   * If no match found, a new group will be created with this label.
   * If not specified, item will be shown as ungrouped (position controlled by `position`).
   */
  group?: LocalizedString
  /** Display label */
  label: LocalizedString
  /**
   * Where to place this item relative to collection groups in the tab.
   * - `'top'` — appears above all collection/global groups
   * - `'bottom'` — appears below all groups (default)
   *
   * Has no effect on items that are merged into an existing collection group via `group`.
   * For new custom groups (unmatched `group` label), controls whether the group appears
   * at the top or bottom of the nav.
   *
   * @default 'bottom'
   */
  position?: 'bottom' | 'top'
  /** Unique slug for the item */
  slug: string
}
interface ExternalHrefItem extends BaseSidebarTabItem {
  /** Link href (absolute URL or relative to root) */
  href: string
  /** Whether the link is external, without admin route prefix. */
  isExternal: true
}

interface InternalHrefItem extends BaseSidebarTabItem {
  /** Link href (relative to admin route) */
  href: '' | `/${string}`
  /** Whether the link is external, without admin route prefix. */
  isExternal?: false
}
/**
 * Custom item inside a sidebar tab
 */
export type SidebarTabItem = ExternalHrefItem | InternalHrefItem

// ============================================
// Custom Component Types
// ============================================

/**
 * Props received by a custom NavItem component registered via `customComponents.NavItem`.
 *
 * Use the `useNavItemState(href)` hook to get reactive `isActive` / `isCurrentPage` values.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { useNavItemState } from '@veiag/payload-enhanced-sidebar'
 * import type { CustomNavItemProps } from '@veiag/payload-enhanced-sidebar'
 *
 * export const MyNavItem: React.FC<CustomNavItemProps> = ({ entity, href, id, label, badgeConfig }) => {
 *   const { isActive, isCurrentPage } = useNavItemState(href)
 *   return <a href={href}>{label}</a>
 * }
 * ```
 */
export type CustomNavItemProps = {
  /** Badge configuration as defined in the plugin config */
  badgeConfig?: BadgeConfig
  /** The entity (collection, global, or custom item) */
  entity: ExtendedEntity
  /** Computed href with admin route prefix applied */
  href: string
  /** DOM element id */
  id: string
  /** Pre-translated label string */
  label: string
}

/**
 * Props received by a custom NavGroup component registered via `customComponents.NavGroup`.
 *
 * @example
 * ```tsx
 * 'use client'
 * import type { CustomNavGroupProps } from '@veiag/payload-enhanced-sidebar'
 *
 * export const MyNavGroup: React.FC<CustomNavGroupProps> = ({ label, isOpen, children }) => {
 *   return <div><strong>{label}</strong>{children}</div>
 * }
 * ```
 */
export type CustomNavGroupProps = {
  /** Nav items inside the group */
  children: ReactNode
  /** Initial open state from nav preferences */
  isOpen?: boolean
  /** Translated group label */
  label: string
}

/**
 * Props received by a custom tab icon component set via `iconComponent` on a tab or link.
 *
 * @example
 * ```tsx
 * 'use client'
 * import type { CustomTabIconProps } from '@veiag/payload-enhanced-sidebar'
 *
 * export const MyIcon: React.FC<CustomTabIconProps> = ({ id, label }) => (
 *   <img alt={label} src={`/icons/${id}.svg`} width={20} height={20} />
 * )
 * ```
 */
export type CustomTabIconProps = {
  /** Tab/link id */
  id: string
  /** Pre-translated label */
  label: string
  /** Whether this item is a tab or a link */
  type: 'link' | 'tab'
}

/**
 * Props received by a custom TabButton component registered via `customComponents.TabButton`.
 * Used for both `tab` and `link` type items in the tabs bar.
 *
 * Use `useTabState(id)` for tab active state, or `usePathname()` for link active state.
 * Use `useEnhancedSidebar().onTabChange` to trigger tab switches.
 *
 * @example
 * ```tsx
 * 'use client'
 * import type { CustomTabButtonProps } from '@veiag/payload-enhanced-sidebar'
 * import { useTabState, useEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
 *
 * export const MyTabButton: React.FC<CustomTabButtonProps> = ({ id, type, icon, label, href }) => {
 *   const { isActive } = useTabState(id)
 *   const { onTabChange } = useEnhancedSidebar()
 *   if (type === 'link') return <a href={href}>{icon}{label}</a>
 *   return <button onClick={() => onTabChange(id)}>{icon}{label}</button>
 * }
 * ```
 */
export type CustomTabButtonProps = {
  /** Badge configuration as defined in the plugin config */
  badge?: BadgeConfig
  /** Computed href (for link type, with admin route prefix applied) */
  href?: string
  /** Pre-rendered icon — either from `iconComponent` or the default Lucide icon */
  icon: ReactNode
  /** Tab/link id */
  id: string
  /** Whether the link is external (only set for link type) */
  isExternal?: boolean
  /** Pre-translated label */
  label: string
  /** Item type — use to differentiate rendering */
  type: 'link' | 'tab'
}

/**
 * Props received by a custom NavContent component registered via `customComponents.NavContent`.
 *
 * Renders in place of the default `<nav>` content area. Use the `useTabState(id)` hook
 * to determine which tab is active and show/hide content accordingly.
 *
 * @example
 * ```tsx
 * 'use client'
 * import type { CustomNavContentProps } from '@veiag/payload-enhanced-sidebar'
 * import { useTabState } from '@veiag/payload-enhanced-sidebar'
 *
 * const TabPanel = ({ id, content }: { id: string; content: React.ReactNode }) => {
 *   const { isActive } = useTabState(id)
 *   return <div style={{ display: isActive ? undefined : 'none' }}>{content}</div>
 * }
 *
 * export const MyNavContent: React.FC<CustomNavContentProps> = ({
 *   tabs, tabsContent, beforeNavLinks, afterNavLinks,
 * }) => {
 *   return (
 *     <nav>
 *       {beforeNavLinks}
 *       {tabs.map(tab => <TabPanel key={tab.id} id={tab.id} content={tabsContent[tab.id]} />)}
 *       {afterNavLinks}
 *     </nav>
 *   )
 * }
 * ```
 */
export type CustomNavContentProps = {
  /** Rendered afterNavLinks from payload config */
  afterNavLinks?: ReactNode
  /** Content to show when no tabs are defined */
  allContent?: ReactNode
  /** Rendered beforeNavLinks from payload config */
  beforeNavLinks?: ReactNode
  /** Tab definitions (id only) for mapping over */
  tabs: Array<{ id: string }>
  /** Pre-rendered content per tab id */
  tabsContent: Record<string, ReactNode>
}

/**
 * Configuration for the enhanced sidebar
 */
export interface EnhancedSidebarConfig {
  /**
   * Badge configurations for sidebar items (collections, globals, custom items).
   * Key is the slug of the item.
   *
   * @example
   * ```typescript
   * badges: {
   *   'posts': { type: 'collection-count', color: 'primary' },
   *   'orders': { type: 'api', endpoint: '/api/orders/pending', responseKey: 'count' },
   *   'notifications': { type: 'provider', color: 'error' },
   * }
   * ```
   */
  badges?: Record<string, BadgeConfig>

  /**
   * Custom components to replace the default NavItem, NavGroup, and/or NavContent rendering.
   * Each field accepts a plain path string or a `SidebarComponent` object `{ path, clientProps }`
   * to forward additional props. The plugin registers them in the import map automatically.
   *
   * @example
   * ```typescript
   * customComponents: {
   *   // Plain path
   *   NavItem: './components/MySidebar#MyNavItem',
   *   // With extra client props forwarded to the component
   *   NavGroup: { path: './components/MySidebar#MyNavGroup', clientProps: { collapsible: true } },
   * }
   * ```
   */
  customComponents?: {
    /**
     * Custom NavContent component. Replaces the default `<nav>` content area.
     * Receives `CustomNavContentProps`. Use `useTabState(id)` to check if a tab is active.
     */
    NavContent?: SidebarComponent
    /** Custom NavGroup component. Receives `CustomNavGroupProps`. */
    NavGroup?: SidebarComponent
    /** Custom NavItem component. Receives `CustomNavItemProps`. */
    NavItem?: SidebarComponent
    /**
     * Custom tab button component. Used for both `tab` and `link` items in the tabs bar.
     * Receives `CustomTabButtonProps`. Use `useTabState(id)` and `useEnhancedSidebar()` for state.
     */
    TabButton?: SidebarComponent
  }

  /**
   * Disable the plugin
   * @default false
   */
  disabled?: boolean

  /**
   * Custom icons for collections and globals in the default tab.
   */
  icons?: {
    collections?: Partial<Record<CollectionSlug, IconName>>
    globals?: Partial<Record<GlobalSlug, IconName>>
  }

  /**
   * Show logout button at the bottom of the tabs bar.
   * @default true
   */
  showLogout?: boolean

  /**
   * Tabs and links to show in the sidebar tabs bar.
   * Order matters - items are rendered top to bottom.
   *
   * @default [{ type: 'tab', id: 'default', icon: 'LayoutGrid', label: 'Collections' }]
   */
  tabs?: SidebarTab[]
}

/**
 * Generic document type for collections, with dynamic keys.
 * We assume values are either string or number for simplicity, useAsTitle is making sure of that.
 */
export type GenericCollectionDocument = {
  [key: string]: number | string
  id: string
}

interface BaseExtendedEntity {
  label: Record<string, string> | string
  slug: string
  type: 'collection' | 'custom' | 'global'
}

interface InternalExtendedEntity extends BaseExtendedEntity {
  href?: '' | `/${string}`
  isExternal?: false
}

interface ExternalExtendedEntity extends BaseExtendedEntity {
  href: string
  isExternal: true
}

export type ExtendedEntity = ExternalExtendedEntity | InternalExtendedEntity

export type ExtendedGroup = {
  entities: ExtendedEntity[]
  label: Record<string, string> | string
}
