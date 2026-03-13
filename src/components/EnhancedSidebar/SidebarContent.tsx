'use client'

import React, { useCallback, useState } from 'react'

import type { EnhancedSidebarConfig } from '../../types'

import { SidebarWrapper } from './SidebarWrapper'
import { TabsBar } from './TabsBar'

const baseClass = 'enhanced-sidebar'

export type SidebarContentProps = {
  afterNavLinks?: React.ReactNode
  allContent?: React.ReactNode
  beforeNavLinks?: React.ReactNode
  initialActiveTabId: string
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  tabsContent: Record<string, React.ReactNode>
}

const COOKIE_KEY = 'payload-enhanced-sidebar-active-tab'

const setTabCookie = (tabId: string) => {
  document.cookie = `${COOKIE_KEY}=${tabId}; path=/; max-age=31536000; SameSite=Lax`
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  afterNavLinks,
  allContent,
  beforeNavLinks,
  initialActiveTabId,
  settingsMenu,
  sidebarConfig,
  tabsContent,
}) => {
  const [activeTabId, setActiveTabId] = useState(initialActiveTabId)

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setTabCookie(tabId)
  }, [])

  const tabs = sidebarConfig.tabs?.filter((t) => t.type === 'tab') ?? []
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
          {hasTabs
            ? tabs.map((tab) => {
                const isActive = activeTabId === tab.id
                return (
                  <div
                    aria-hidden={!isActive}
                    key={tab.id}
                    style={{ display: isActive ? undefined : 'none' }}
                  >
                    {tabsContent[tab.id]}
                  </div>
                )
              })
            : allContent}
          {afterNavLinks}
        </div>
      </nav>
    </SidebarWrapper>
  )
}
