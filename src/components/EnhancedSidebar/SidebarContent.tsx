'use client'
import type { NavPreferences } from 'payload'

import { useTranslation } from '@payloadcms/ui'
import React, { useCallback, useMemo, useState } from 'react'

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

/**
 * Computes filtered groups for a specific tab
 */
const computeGroupsForTab = (
  tab: SidebarTabContentType,
  groups: ExtendedGroup[],
  currentLang: string,
): ExtendedGroup[] => {
  const { collections: tabCollections, customItems, globals: tabGlobals } = tab

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

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setTabCookie(tabId)
  }, [])

  // Build groups for all tabs at once to keep them mounted
  const groupsPerTab = useMemo(() => {
    const result: Record<string, ExtendedGroup[]> = {}
    for (const tab of tabs) {
      result[tab.id] = computeGroupsForTab(tab, groups, currentLang)
    }
    return result
  }, [tabs, groups, currentLang])

  // Fallback: if no tabs defined, show all groups
  const hasTabs = tabs.length > 0

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
          {hasTabs ? (
            // Render all tabs but hide inactive ones to preserve NavGroup state
            tabs.map((tab) => {
              const isActive = activeTabId === tab.id
              return (
                <div
                  aria-hidden={!isActive}
                  key={tab.id}
                  style={{ display: isActive ? undefined : 'none' }}
                >
                  <EnhancedSidebarClient
                    badges={sidebarConfig.badges}
                    groups={groupsPerTab[tab.id] ?? []}
                    navPreferences={navPreferences}
                  />
                </div>
              )
            })
          ) : (
            // No tabs defined - show all groups
            <EnhancedSidebarClient
              badges={sidebarConfig.badges}
              groups={groups}
              navPreferences={navPreferences}
            />
          )}
          {afterNavLinks}
        </div>
      </nav>
    </SidebarWrapper>
  )
}
