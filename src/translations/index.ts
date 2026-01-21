import type { NestedKeysStripped } from '@payloadcms/translations'
import type { enTranslations } from '@payloadcms/translations/languages/en'

//TODO: find suitable translations in Payload core to avoid duplication
// Don't think we need translations at all
export const sidebarTranslations = {
  en: {
    sidebarPlugin: {
      collections: 'Collections',
      dashboard: 'Dashboard',
      logout: 'Logout',
    },
  },
  uk: {
    sidebarPlugin: {
      collections: 'Колекції',
      dashboard: 'Головна',
      logout: 'Вийти',
    },
  },
}

export type AvaibleTranslation = keyof typeof sidebarTranslations.en.sidebarPlugin

export type CustomTranslationsObject = typeof enTranslations & typeof sidebarTranslations.en

export type CustomTranslationsKeys = NestedKeysStripped<CustomTranslationsObject>

export const mergeTranslations = (
  existingTranslations: Record<string, unknown>,
  newTranslations: Record<string, unknown>,
): Record<string, unknown> => {
  return {
    ...existingTranslations,
    ...newTranslations,
    sidebarTranslations: {
      ...(existingTranslations.sidebarTranslations || {}),
      ...(newTranslations.sidebarTranslations || {}),
    },
  }
}
