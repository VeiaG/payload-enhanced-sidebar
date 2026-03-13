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
 * Sidebar tab that shows content when selected
 */
export interface SidebarTabContent {
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
  /** Icon name from lucide-react */
  icon: IconName
  /** Unique identifier for the tab */
  id: string
  /** Tooltip/label for the tab */
  label: LocalizedString
  type: 'tab'
}

interface SidebarTabLinkBase {
  /**
   * Badge configuration for this link.
   * Shows a badge on the link icon in the tabs bar.
   */
  badge?: BadgeConfig
  /** Icon name from lucide-react */
  icon: IconName
  /** Unique identifier */
  id: string
  /** Tooltip/label */
  label: LocalizedString
  type: 'link'
}
interface SidebarTabLinkExternal extends SidebarTabLinkBase {
  /** Link href (absolute URL) */
  href: string
  isExternal: true
}
interface SidebarTabLinkInternal extends SidebarTabLinkBase {
  /** Link href (relative to admin route) */
  href: '' | `/${string}`
  isExternal?: false
}
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
   * If no match found, a new group will be created.
   * If not specified, item will be shown at the bottom as ungrouped.
   */
  group?: LocalizedString
  /** Display label */
  label: LocalizedString
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
   * Custom components to replace the default NavItem and/or NavGroup rendering.
   * Paths follow Payload's component path format: 'path/to/file#ExportName'.
   * The plugin automatically adds them to the import map.
   *
   * @example
   * ```typescript
   * customComponents: {
   *   NavItem: '@/components/MyNavItem#MyNavItem',
   *   NavGroup: '@/components/MyNavGroup#MyNavGroup',
   * }
   * ```
   */
  customComponents?: {
    /** Path to a custom NavItem component. Receives `CustomNavItemProps`. */
    NavGroup?: string
    /** Path to a custom NavGroup component. Receives `CustomNavGroupProps`. */
    NavItem?: string
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
