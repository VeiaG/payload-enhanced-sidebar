'use client'
import type { NavPreferences } from 'payload'

import { useTranslation } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import type {
  EnhancedSidebarConfig,
  ExtendedGroup,
  SidebarTabContent as SidebarTabContentType,
  SidebarTabItem,
} from '../../types'

import { extractLocalizedValue } from '../../utils'
import { EnhancedSidebarClient } from './index.client'
import { SidebarWrapper } from './SidebarWrapper'
import { TabsBar } from './TabsBar'

const baseClass = 'enhanced-sidebar'

export type SidebarContentProps = {
  afterNavLinks?: React.ReactNode
  beforeNavLinks?: React.ReactNode
  groups: ExtendedGroup[]
  navPreferences: NavPreferences | null
  sidebarConfig: EnhancedSidebarConfig
}

const STORAGE_KEY = 'payload-enhanced-sidebar-active-tab'

export const SidebarContent: React.FC<SidebarContentProps> = ({
  afterNavLinks,
  beforeNavLinks,
  groups,
  navPreferences,
  sidebarConfig,
}) => {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  const tabs = sidebarConfig.tabs?.filter((t): t is SidebarTabContentType => t.type === 'tab') ?? []
  const defaultTabId = tabs[0]?.id ?? 'default'

  // Always start with default to match server render
  const [activeTabId, setActiveTabId] = useState(defaultTabId)

  // Read from localStorage only after hydration
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && tabs.some((t) => t.id === stored)) {
      setActiveTabId(stored)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeTabId)
  }, [activeTabId])

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  // Build groups for the active tab
  const filteredGroups = useMemo(() => {
    if (!activeTab) {
      return groups
    }

    const { collections: tabCollections, customItems, globals: tabGlobals } = activeTab

    // If no specific collections/globals defined, show all
    const showAll = !tabCollections && !tabGlobals
    const allowedSlugs = new Set([...(tabCollections ?? []), ...(tabGlobals ?? [])])

    let result: ExtendedGroup[] = []

    if (showAll) {
      result = groups.map((g) => ({ ...g, entities: [...g.entities] }))
    } else if (allowedSlugs.size > 0) {
      result = groups
        .map((group) => ({
          ...group,
          entities: group.entities.filter((entity) => allowedSlugs.has(entity.slug)),
        }))
        .filter((group) => group.entities.length > 0)
    }

    // Merge custom items into groups
    if (customItems && customItems.length > 0) {
      const ungroupedItems: SidebarTabItem[] = []

      for (const item of customItems) {
        if (item.group) {
          // Get localized group name for comparison
          const itemGroupLabel = extractLocalizedValue(item.group, currentLang)

          // Find existing group by comparing localized labels
          const existingGroup = result.find((g) => {
            const groupLabel = extractLocalizedValue(g.label, currentLang)
            return groupLabel === itemGroupLabel
          })

          if (existingGroup) {
            existingGroup.entities.push({
              slug: item.slug,
              type: 'custom',
              href: item.href,
              label: item.label,
            })
          } else {
            // Create new group
            result.push({
              entities: [
                {
                  slug: item.slug,
                  type: 'custom',
                  href: item.href,
                  label: item.label,
                },
              ],
              label: item.group,
            })
          }
        } else {
          ungroupedItems.push(item)
        }
      }

      // Add ungrouped items at the end
      if (ungroupedItems.length > 0) {
        result.push({
          entities: ungroupedItems.map((item) => ({
            slug: item.slug,
            type: 'custom',
            href: item.href,
            label: item.label,
          })),
          label: '',
        })
      }
    }

    return result
  }, [activeTab, groups, currentLang])

  return (
    <SidebarWrapper baseClass={baseClass}>
      <TabsBar
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        sidebarConfig={sidebarConfig}
      />
      <nav className={`${baseClass}__content`}>
        <div className={`${baseClass}__content-scroll`}>
          {beforeNavLinks}
          <EnhancedSidebarClient groups={filteredGroups} navPreferences={navPreferences} />
          {afterNavLinks}
        </div>
      </nav>
    </SidebarWrapper>
  )
}
