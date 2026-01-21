import type { LocalizedString } from '../types'

export const convertSlugToTitle = (slug: string): string => {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
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
