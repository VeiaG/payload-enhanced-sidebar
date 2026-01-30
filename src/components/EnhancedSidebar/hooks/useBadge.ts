'use client'

import type { ReactNode } from 'react'

import type { BadgeConfig } from '../../../types'

import { useBadgeValue } from '../BadgeProvider'

type UseBadgeResult = {
  value: number | ReactNode | undefined
}

/**
 * Hook to get badge value based on config.
 * All badge values are read from context (populated by InternalBadgeProvider or BadgeProvider).
 */
export const useBadge = (
  config: BadgeConfig | undefined,
  /**
   * Default slug to use for context lookup if not specified in config
   */
  defaultSlug: string,
): UseBadgeResult => {
  // Determine the slug to look up in context
  let slug = defaultSlug

  if (config?.type === 'provider' && config.slug) {
    slug = config.slug
  } else if (config?.type === 'collection-count' && config.collectionSlug) {
    // For collection-count, the InternalBadgeProvider uses the item slug as key
    // but if collectionSlug is different, we might need to handle this
    // For now, defaultSlug is used (which is the tab/item id)
    slug = defaultSlug
  }

  // Get value from context (populated by InternalBadgeProvider or user's BadgeProvider)
  const contextValue = useBadgeValue(slug)

  if (!config) {
    return { value: undefined }
  }

  return { value: contextValue }
}
