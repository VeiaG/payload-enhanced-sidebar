'use client'

import React, { useCallback, useMemo, useState } from 'react'

import type { EnhancedSidebarConfig } from '../../types.js'

import { EnhancedSidebarContext } from './context.js'
import { NavContent } from './NavContent/index.js'
import { PanelHeader } from './PanelHeader/index.js'
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
  /** Brand icon at the top of the tabs bar */
  logo?: React.ReactNode
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  tabButtons?: Record<string, React.ReactNode>
  tabIcons?: Record<string, React.ReactNode>
  tabsContent: Record<string, React.ReactNode>
  tabViews?: Record<string, React.ReactNode>
  /** Account menu shown at the bottom of the tabs bar */
  userMenu?: React.ReactNode
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
  logo,
  settingsMenu,
  sidebarConfig,
  tabButtons,
  tabIcons,
  tabsContent,
  tabViews,
  userMenu,
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
      <SidebarWrapper baseClass={baseClass} iconStrokeWidth={sidebarConfig.iconStrokeWidth}>
        <TabsBar
          customTabComponents={customTabComponents}
          logo={logo}
          settingsMenu={settingsMenu}
          sidebarConfig={sidebarConfig}
          tabButtons={tabButtons}
          tabIcons={tabIcons}
          userMenu={userMenu}
        />
        <div className={`${baseClass}__panel`}>
          <PanelHeader tabs={sidebarConfig.tabs ?? []} />
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
        </div>
      </SidebarWrapper>
    </EnhancedSidebarContext.Provider>
  )
}
