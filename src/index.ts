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

    // Merge user config with defaults
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

export type { EnhancedSidebarConfig } from './types'
