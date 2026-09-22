'use client'

import React, { useCallback, useMemo, useState } from 'react'

import type { EnhancedSidebarConfig } from '../../types.js'

import { EnhancedSidebarContext } from './context.js'
import { NavContent } from './NavContent/index.js'
import { SidebarWrapper } from './SidebarWrapper/index.js'
import { TabsBar } from './TabsBar/index.js'

const baseClass = 'enhanced-sidebar'

export type SidebarContentProps = {
  afterNav?: React.ReactNode
  afterNavLinks?: React.ReactNode
  allContent?: React.ReactNode
  beforeNav?: React.ReactNode
  beforeNavLinks?: React.ReactNode
  customNavContent?: React.ReactNode
  customTabComponents?: Record<string, React.ReactNode>
  initialActiveTabId: string
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  tabButtons?: Record<string, React.ReactNode>
  tabIcons?: Record<string, React.ReactNode>
  tabsContent: Record<string, React.ReactNode>
  tabViews?: Record<string, React.ReactNode>
}

const COOKIE_KEY = 'payload-enhanced-sidebar-active-tab'

const setTabCookie = (tabId: string) => {
  document.cookie = `${COOKIE_KEY}=${tabId}; path=/; max-age=31536000; SameSite=Lax`
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  afterNav,
  afterNavLinks,
  allContent,
  beforeNav,
  beforeNavLinks,
  customNavContent,
  customTabComponents,
  initialActiveTabId,
  settingsMenu,
  sidebarConfig,
  tabButtons,
  tabIcons,
  tabsContent,
  tabViews,
}) => {
  const [activeTabId, setActiveTabId] = useState(initialActiveTabId)

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setTabCookie(tabId)
  }, [])

  const contextValue = useMemo(
    () => ({ activeTabId, onTabChange: handleTabChange }),
    [activeTabId, handleTabChange],
  )

  const tabs = sidebarConfig.tabs?.filter((t) => t.type === 'tab') ?? []

  return (
    <EnhancedSidebarContext.Provider value={contextValue}>
      <SidebarWrapper baseClass={baseClass}>
        <TabsBar
          customTabComponents={customTabComponents}
          settingsMenu={settingsMenu}
          sidebarConfig={sidebarConfig}
          tabButtons={tabButtons}
          tabIcons={tabIcons}
        />
        {customNavContent ?? (
          <NavContent
            afterNav={afterNav}
            afterNavLinks={afterNavLinks}
            allContent={allContent}
            beforeNav={beforeNav}
            beforeNavLinks={beforeNavLinks}
            tabs={tabs}
            tabsContent={tabsContent}
            tabViews={tabViews}
          />
        )}
      </SidebarWrapper>
    </EnhancedSidebarContext.Provider>
  )
}
