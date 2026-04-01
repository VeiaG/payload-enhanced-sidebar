'use client'

import React, { useCallback, useMemo, useState } from 'react'

import type { EnhancedSidebarConfig } from '../../types'

import { EnhancedSidebarContext } from './context'
import { NavContent } from './NavContent'
import { SidebarWrapper } from './SidebarWrapper'
import { TabsBar } from './TabsBar'

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
  renderedTabItems?: React.ReactNode[]
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  tabIcons?: Record<string, React.ReactNode>
  tabsContent: Record<string, React.ReactNode>
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
  renderedTabItems,
  settingsMenu,
  sidebarConfig,
  tabIcons,
  tabsContent,
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
          activeTabId={activeTabId}
          customTabComponents={customTabComponents}
          onTabChange={handleTabChange}
          renderedTabItems={renderedTabItems}
          settingsMenu={settingsMenu}
          sidebarConfig={sidebarConfig}
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
          />
        )}
      </SidebarWrapper>
    </EnhancedSidebarContext.Provider>
  )
}
