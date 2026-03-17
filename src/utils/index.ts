import type { EnhancedSidebarConfig, LocalizedString, SidebarComponent } from '../types'

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
export const sanitizeSidebarConfig = (config: EnhancedSidebarConfig): EnhancedSidebarConfig => ({
  ...config,
  tabs: config.tabs?.map((tab) => {
    const { access: _, ...tabRest } = tab
    if (tabRest.type === 'tab' && tabRest.customItems) {
      return {
        ...tabRest,
        customItems: tabRest.customItems.map(({ access: __, ...item }) => item),
      }
    }
    return tabRest
  }),
})


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
