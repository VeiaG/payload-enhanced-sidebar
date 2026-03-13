import { type Config, deepMerge } from 'payload'

import type { EnhancedSidebarConfig } from './types'

import { sidebarTranslations } from './translations'

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

    if (!config.admin.components.Nav) {
      config.admin.components.Nav = {
        path: '@veiag/payload-enhanced-sidebar/rsc#EnhancedSidebar',
        serverProps: {
          sidebarConfig,
        },
      }
    }

    // Register custom components in the import map via admin.dependencies
    if (pluginOptions.customComponents?.NavItem) {
      if (!config.admin.dependencies) {
        config.admin.dependencies = {}
      }
      config.admin.dependencies['enhanced-sidebar-nav-item'] = {
        path: pluginOptions.customComponents.NavItem,
        type: 'component',
      }
    }

    if (pluginOptions.customComponents?.NavGroup) {
      if (!config.admin.dependencies) {
        config.admin.dependencies = {}
      }
      config.admin.dependencies['enhanced-sidebar-nav-group'] = {
        path: pluginOptions.customComponents.NavGroup,
        type: 'component',
      }
    }

    if (pluginOptions.customComponents?.NavContent) {
      if (!config.admin.dependencies) {
        config.admin.dependencies = {}
      }
      config.admin.dependencies['enhanced-sidebar-nav-content'] = {
        path: pluginOptions.customComponents.NavContent,
        type: 'component',
      }
    }

    if (pluginOptions.customComponents?.TabButton) {
      if (!config.admin.dependencies) {
        config.admin.dependencies = {}
      }
      config.admin.dependencies['enhanced-sidebar-tab-button'] = {
        path: pluginOptions.customComponents.TabButton,
        type: 'component',
      }
    }

    // Register per-tab iconComponent paths
    if (pluginOptions.tabs) {
      if (!config.admin.dependencies) {
        config.admin.dependencies = {}
      }
      for (const tab of pluginOptions.tabs) {
        if (tab.iconComponent) {
          config.admin.dependencies[`enhanced-sidebar-icon-${tab.id}`] = {
            path: tab.iconComponent,
            type: 'component',
          }
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
} from './types'
