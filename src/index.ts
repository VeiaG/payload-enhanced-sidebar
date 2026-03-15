import { type Config, deepMerge } from 'payload'

import type { EnhancedSidebarConfig } from './types'

import { sidebarTranslations } from './translations'
import { resolveSidebarComponent } from './utils'

/**
 * Default configuration for the enhanced sidebar
 */
const defaultConfig: EnhancedSidebarConfig = {
  showLogout: true,
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

    const seenTabIds = new Set<string>()
    for (const tab of sidebarConfig.tabs ?? []) {
      if (seenTabIds.has(tab.id)) {
        throw new Error(
          `[payload-enhanced-sidebar] Duplicate tab id "${tab.id}". Each tab must have a unique id.`,
        )
      }
      seenTabIds.add(tab.id)

      if (tab.iconComponent) {
        const { path } = resolveSidebarComponent(tab.iconComponent)
        config.admin.dependencies[`enhanced-sidebar-icon-${tab.id}`] = {
          type: 'component',
          path,
        }
      }
    }

    // Check if we have any badges to fetch (api or collection-count)
    const hasBadgesToFetch =
      sidebarConfig.badges ||
      sidebarConfig.tabs?.some((tab) => tab.badge && tab.badge.type !== 'provider')

    // Add InternalBadgeProvider if we have badges to fetch
    if (hasBadgesToFetch) {
      if (!config.admin.components.providers) {
        config.admin.components.providers = []
      }

      // Add our internal provider at the beginning (so user providers can override)
      config.admin.components.providers.unshift({
        clientProps: {
          sidebarConfig,
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

export {
  BadgeProvider,
  useBadgeContext,
  useBadgeValue,
} from './components/EnhancedSidebar/BadgeProvider'

export { useEnhancedSidebar } from './components/EnhancedSidebar/context'
export { useNavItemState } from './components/EnhancedSidebar/hooks/useNavItemState'
export { useTabState } from './components/EnhancedSidebar/hooks/useTabState'

export type {
  BadgeColor,
  BadgeConfig,
  BadgeConfigApi,
  BadgeConfigCollectionCount,
  BadgeConfigProvider,
  BadgeValues,
  CustomNavContentProps,
  CustomNavGroupProps,
  CustomNavItemProps,
  CustomTabButtonProps,
  CustomTabIconProps,
  EnhancedSidebarConfig,
  ItemAccessFunction,
  SidebarComponent,
  TabAccessFunction,
} from './types'
