'use client'
import type { NavPreferences } from 'payload'

import { useTranslation } from '@payloadcms/ui'
import React, { useMemo, useState } from 'react'

import type {
  EnhancedSidebarConfig,
  ExtendedEntity,
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
  initialActiveTabId: string
  navPreferences: NavPreferences | null
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
}

const COOKIE_KEY = 'payload-enhanced-sidebar-active-tab'

const setTabCookie = (tabId: string) => {
  document.cookie = `${COOKIE_KEY}=${tabId}; path=/; max-age=31536000; SameSite=Lax`
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  afterNavLinks,
  beforeNavLinks,
  groups,
  initialActiveTabId,
  navPreferences,
  settingsMenu,
  sidebarConfig,
}) => {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  const tabs = sidebarConfig.tabs?.filter((t): t is SidebarTabContentType => t.type === 'tab') ?? []

  const [activeTabId, setActiveTabId] = useState(initialActiveTabId)

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId)
    setTabCookie(tabId)
  }

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
              isExternal: item.isExternal,
              label: item.label,
            } as ExtendedEntity)
          } else {
            // Create new group
            result.push({
              entities: [
                {
                  slug: item.slug,
                  type: 'custom',
                  href: item.href,
                  isExternal: item.isExternal,
                  label: item.label,
                } as ExtendedEntity,
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
            isExternal: item.isExternal,
            label: item.label,
          })) as ExtendedEntity[],
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
        onTabChange={handleTabChange}
        settingsMenu={settingsMenu}
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
