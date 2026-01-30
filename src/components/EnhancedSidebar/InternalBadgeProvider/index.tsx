'use client'

import { useConfig } from '@payloadcms/ui'
import { stringify } from 'qs-esm'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { BadgeConfig, BadgeValues, EnhancedSidebarConfig } from '../../../types'

import { BadgeProvider } from '../BadgeProvider'

type BadgeToFetch = {
  config: BadgeConfig
  slug: string
}

export type InternalBadgeProviderProps = {
  children: React.ReactNode
  /**
   * Sidebar configuration containing badge configs
   */
  sidebarConfig: EnhancedSidebarConfig
}

/**
 * Internal provider that fetches all API-based badges once on mount.
 * This provider is automatically injected by the plugin.
 * Values are stored in context and don't refetch on navigation.
 */
export const InternalBadgeProvider: React.FC<InternalBadgeProviderProps> = ({
  children,
  sidebarConfig,
}) => {
  const [values, setValues] = useState<BadgeValues>({})

  const {
    config: {
      routes: { api: apiRoute },
      serverURL,
    },
  } = useConfig()

  // Collect all badges that need to be fetched (api and collection-count types)
  const badgesToFetch = useMemo(() => {
    const badges: BadgeToFetch[] = []

    // From tabs
    if (sidebarConfig.tabs) {
      for (const tab of sidebarConfig.tabs) {
        if (tab.badge && tab.badge.type !== 'provider') {
          badges.push({ slug: tab.id, config: tab.badge })
        }
      }
    }

    // From badges config
    if (sidebarConfig.badges) {
      for (const [slug, config] of Object.entries(sidebarConfig.badges)) {
        if (config.type !== 'provider') {
          badges.push({ slug, config })
        }
      }
    }

    return badges
  }, [sidebarConfig])

  // Fetch a single badge value
  const fetchBadge = useCallback(
    async (badge: BadgeToFetch): Promise<{ slug: string; value: number | undefined }> => {
      const { slug, config } = badge

      try {
        let url: string
        let responseKey: string

        if (config.type === 'api') {
          url = config.endpoint
          responseKey = config.responseKey ?? 'count'

          // If endpoint is relative, prepend serverURL
          if (!url.startsWith('http')) {
            url = `${serverURL || ''}${url}`
          }
        } else if (config.type === 'collection-count') {
          const collectionSlug = config.collectionSlug ?? slug
          const baseUrl = `${serverURL || ''}${apiRoute}/${collectionSlug}`

          const params = new URLSearchParams({ limit: '0' })

          if (config.where) {
            const whereParams = stringify(config.where)
            url = `${baseUrl}?${params.toString()}&${whereParams}`
          } else {
            url = `${baseUrl}?${params.toString()}`
          }

          responseKey = 'totalDocs'
        } else {
          return { slug, value: undefined }
        }

        const response = await fetch(url, {
          credentials: 'include',
          method: config.type === 'api' ? (config.method ?? 'GET') : 'GET',
        })

        if (response.ok) {
          const data = await response.json()
          // Extract value from nested key (e.g., "data.count")
          const keys = responseKey.split('.')
          let value = data
          for (const key of keys) {
            value = value?.[key]
          }
          return { slug, value: typeof value === 'number' ? value : undefined }
        }
      } catch (error) {
        //eslint-disable-next-line no-console
        console.error(`Failed to fetch badge data for ${slug}:`, error)
      }

      return { slug, value: undefined }
    },
    [apiRoute, serverURL],
  )

  // Fetch all badges on mount
  useEffect(() => {
    if (badgesToFetch.length === 0) {
      return
    }

    const fetchAll = async () => {
      const results = await Promise.all(badgesToFetch.map(fetchBadge))

      const newValues: BadgeValues = {}
      for (const result of results) {
        if (result.value !== undefined) {
          newValues[result.slug] = result.value
        }
      }

      setValues(newValues)
    }

    fetchAll().catch((err) => {
      //eslint-disable-next-line no-console
      console.error('Error fetching badge data:', err)
    })
  }, [badgesToFetch, fetchBadge])

  return <BadgeProvider values={values}>{children}</BadgeProvider>
}
