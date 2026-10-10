import { type Config, deepMerge } from 'payload'

import type { EnhancedSidebarConfig } from './types.js'

import { sidebarTranslations } from './translations/index.js'
import {
  getLazyTabSlug,
  NATIVE_TABS_PANEL_PATH,
  resolveLogoConfig,
  resolveNativeTabsConfig,
  resolveSidebarComponent,
  sanitizeSidebarConfig,
} from './utils/index.js'

/**
 * Default configuration for the enhanced sidebar
 */
const defaultConfig: EnhancedSidebarConfig = {
  showLogout: false,
  tabs: [
    {
      id: 'dashboard',
      type: 'link',
      href: '/',
      icon: 'House',
      label: { en: 'Dashboard', uk: 'Головна' },
    },
    {
      id: 'default',
      type: 'tab',
      icon: 'LayoutGrid',
      label: { en: 'Collections', uk: 'Колекції' },
    },
  ],
}

export const payloadEnhancedSidebar =
  (pluginOptions: EnhancedSidebarConfig = {}) =>
  (config: Config): Config => {
    if (pluginOptions.disabled) {
      return config
    }

    const sidebarConfig: EnhancedSidebarConfig = {
      ...defaultConfig,
      ...pluginOptions,
      tabs: pluginOptions.tabs ?? defaultConfig.tabs,
    }

    if (!config.admin) {
      config.admin = {}
    }

    if (!config.admin.components) {
      config.admin.components = {}
    }

    // Always override Nav — user-defined Nav in config should use customComponents instead
    config.admin.components.Nav = {
      path: '@veiag/payload-enhanced-sidebar/rsc#EnhancedSidebar',
      serverProps: {
        sidebarConfig,
      },
    }

    // Register custom components and per-tab icons in the import map
    if (!config.admin.dependencies) {
      config.admin.dependencies = {}
    }

    const customComponentSlots = ['NavContent', 'NavGroup', 'NavItem', 'TabButton'] as const
    for (const slot of customComponentSlots) {
      const component = sidebarConfig.customComponents?.[slot]
      if (component) {
        const { path } = resolveSidebarComponent(component)
        config.admin.dependencies[`enhanced-sidebar-${slot.toLowerCase()}`] = {
          type: 'component',
          path,
        }
      }
    }

    const logoComponent = resolveLogoConfig(sidebarConfig.logo)?.component
    if (logoComponent) {
      const { path } = resolveSidebarComponent(logoComponent)
      config.admin.dependencies['enhanced-sidebar-logo'] = { type: 'component', path }
    }

    const seenTabIds = new Set<string>()
    for (const tab of sidebarConfig.tabs ?? []) {
      if (seenTabIds.has(tab.id)) {
        throw new Error(
          `[payload-enhanced-sidebar] Duplicate tab id "${tab.id}". Each tab must have a unique id.`,
        )
      }
      seenTabIds.add(tab.id)

      if (tab.type === 'custom') {
        const { path } = resolveSidebarComponent(tab.component)
        config.admin.dependencies[`enhanced-sidebar-custom-tab-${tab.id}`] = {
          type: 'component',
          path,
        }
      } else {
        if (tab.iconComponent) {
          const { path } = resolveSidebarComponent(tab.iconComponent)
          config.admin.dependencies[`enhanced-sidebar-icon-${tab.id}`] = {
            type: 'component',
            path,
          }
        }
        if (tab.buttonComponent) {
          const { path } = resolveSidebarComponent(tab.buttonComponent)
          config.admin.dependencies[`enhanced-sidebar-button-${tab.id}`] = {
            type: 'component',
            path,
          }
        }
      }

      if (tab.type === 'tab' && tab.contentComponent) {
        const { path } = resolveSidebarComponent(tab.contentComponent)
        config.admin.dependencies[`enhanced-sidebar-content-${tab.id}`] = {
          type: 'component',
          path,
        }
      }

      // Lazy tabs are registered as (disabled) Payload sidebar tabs: `render-tab` looks a tab
      // up by slug in `admin.components.sidebar.tabs`, and that is the only way to render a
      // server component on demand without asking users to add a server function.
      // `disabled` keeps them out of Payload's own nav, should anything render it.
      if (tab.type === 'tab' && tab.contentComponent && tab.lazy) {
        const { clientProps, path } = resolveSidebarComponent(tab.contentComponent)
        config.admin.components.sidebar ??= {}
        config.admin.components.sidebar.tabs ??= []
        config.admin.components.sidebar.tabs.push({
          slug: getLazyTabSlug(tab.id),
          components: {
            Content: { clientProps: { id: tab.id, ...clientProps }, path },
            // Required by the type, never rendered: the plugin draws its own tab button.
            Icon: '@payloadcms/ui#DocumentIcon',
          },
          disabled: true,
        })
      }

      // Register per-item custom components from a tab's customItems
      if (tab.type === 'tab' && tab.customItems) {
        for (const item of tab.customItems) {
          if ('component' in item && item.component) {
            const { path } = resolveSidebarComponent(item.component)
            config.admin.dependencies[`enhanced-sidebar-custom-item-${tab.id}-${item.slug}`] = {
              type: 'component',
              path,
            }
          }
        }
      }
    }

    // `nativeTabs: 'group'`: one plugin tab holding Payload's own sidebar tabs. Which native
    // tabs exist is only known after sanitization (Payload adds the folder/tag tabs then), so
    // the tab itself is added at render time; here it is registered for lazy rendering through
    // `render-tab`, like any `lazy` tab.
    const nativeTabs = resolveNativeTabsConfig(sidebarConfig.nativeTabs)
    if (nativeTabs?.mode === 'group') {
      if (seenTabIds.has(nativeTabs.id)) {
        throw new Error(
          `[payload-enhanced-sidebar] The native tabs tab id "${nativeTabs.id}" is already used by a tab. Set \`nativeTabs.id\` to another id.`,
        )
      }
      config.admin.components.sidebar ??= {}
      config.admin.components.sidebar.tabs ??= []
      config.admin.components.sidebar.tabs.push({
        slug: getLazyTabSlug(nativeTabs.id),
        components: {
          Content: { clientProps: { id: nativeTabs.id }, path: NATIVE_TABS_PANEL_PATH },
          // Required by the type, never rendered: the plugin draws its own tab button.
          Icon: '@payloadcms/ui#DocumentIcon',
        },
        disabled: true,
      })
      if (nativeTabs.iconComponent) {
        const { path } = resolveSidebarComponent(nativeTabs.iconComponent)
        config.admin.dependencies['enhanced-sidebar-icon-native-tabs'] = {
          type: 'component',
          path,
        }
      }
    }

    // Check if we have any badges to fetch (api or collection-count)
    const hasBadgesToFetch =
      sidebarConfig.badges ||
      sidebarConfig.tabs?.some(
        (tab) => tab.type !== 'custom' && tab.badge && tab.badge.type !== 'provider',
      )

    // Add InternalBadgeProvider if we have badges to fetch
    if (hasBadgesToFetch) {
      if (!config.admin.components.providers) {
        config.admin.components.providers = []
      }

      // Add our internal provider at the beginning (so user providers can override)
      config.admin.components.providers.unshift({
        clientProps: {
          sidebarConfig: sanitizeSidebarConfig(sidebarConfig),
        },
        path: '@veiag/payload-enhanced-sidebar/client#InternalBadgeProvider',
      })
    }

    // Adding translations
    if (!config.i18n) {
      config.i18n = {}
    }
    if (!config.i18n.translations) {
      config.i18n.translations = {}
    }

    config.i18n.translations = deepMerge(config.i18n.translations, sidebarTranslations)

    return config
  }

// Hooks and providers. In 'use client' files prefer `@veiag/payload-enhanced-sidebar/client`.
//
// Default components (Badge, NavItem, NavContentShell, TabButton) are exported from
// `/client` only: they import .scss, and the package root is loaded by plain Node
// (payload.config.ts, import map generation), which can't handle stylesheet imports.
export type { BadgeProps } from './components/EnhancedSidebar/Badge/index.js'
export {
  BadgeProvider,
  useBadgeContext,
  useBadgeValue,
} from './components/EnhancedSidebar/BadgeProvider/index.js'
export { useEnhancedSidebar } from './components/EnhancedSidebar/context.js'
export { useBadge } from './components/EnhancedSidebar/hooks/useBadge.js'
export { useNavItemState } from './components/EnhancedSidebar/hooks/useNavItemState.js'
export { useTabState } from './components/EnhancedSidebar/hooks/useTabState.js'
export type { NavContentShellProps } from './components/EnhancedSidebar/NavContent/index.js'
export type { NavItemProps } from './components/EnhancedSidebar/NavItem/index.js'
export type { TabButtonProps } from './components/EnhancedSidebar/TabsBar/TabItem.js'

export type {
  BadgeColor,
  BadgeConfig,
  BadgeConfigApi,
  BadgeConfigCollectionCount,
  BadgeConfigProvider,
  BadgeValues,
  CustomNavContentProps,
  CustomNavGroupProps,
  CustomNavItemComponentProps,
  CustomNavItemProps,
  CustomTabButtonProps,
  CustomTabContentProps,
  CustomTabIconProps,
  CustomTabsBarComponentProps,
  EnhancedSidebarConfig,
  ExtendedEntity,
  ExtendedGroup,
  GroupSortFunction,
  IconName,
  ItemAccessFunction,
  ItemSortFunction,
  SidebarComponent,
  SidebarSortContext,
  SidebarSortKey,
  SidebarTabContent,
  SidebarTabCustom,
  SidebarTabItem,
  SidebarTabLink,
  SortableGroup,
  TabAccessFunction,
  TabIconConfig,
  TabSortConfig,
} from './types.js'
