'use client'

import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import type { EnhancedSidebarConfig } from '../../types.js'

import {
  buildSessionTabScript,
  buildSessionTabStyles,
  readSessionTab,
  setTabCookie,
  subscribeSessionTab,
  writeSessionTab,
} from './activeTabStore.js'
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
  /** CSP nonce for the session-tab script */
  nonce?: string
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  tabButtons?: Record<string, React.ReactNode>
  tabIcons?: Record<string, React.ReactNode>
  tabsContent: Record<string, React.ReactNode>
  tabViews?: Record<string, React.ReactNode>
}

const noopSubscribe = () => () => {}

/**
 * True while rendering on the server and hydrating. The session-tab script only matters
 * in the server HTML, and React warns when it has to create a `<script>` on the client.
 */
const useIsServerRender = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  )

export const SidebarContent: React.FC<SidebarContentProps> = ({
  afterNav,
  afterNavLinks,
  allContent,
  beforeNav,
  beforeNavLinks,
  customNavContent,
  customTabComponents,
  initialActiveTabId,
  nonce,
  settingsMenu,
  sidebarConfig,
  tabButtons,
  tabIcons,
  tabsContent,
  tabViews,
}) => {
  const storage = sidebarConfig.storage ?? 'cookie'
  const isSession = storage === 'session'
  const tabs = sidebarConfig.tabs?.filter((t) => t.type === 'tab') ?? []
  const tabIds = tabs.map((t) => t.id)

  // Cookie mode and the fallback when sessionStorage is empty or blocked
  const [stateTabId, setStateTabId] = useState(initialActiveTabId)
  // Server snapshot is null, so hydration matches the server HTML and React switches
  // to the stored tab right after; the script's root attribute covers the gap.
  const sessionTabId = useSyncExternalStore(subscribeSessionTab, readSessionTab, () => null)
  const isServerRender = useIsServerRender()

  const activeTabId =
    isSession && sessionTabId && tabIds.includes(sessionTabId) ? sessionTabId : stateTabId

  const handleTabChange = useCallback(
    (tabId: string) => {
      setStateTabId(tabId)
      // In session mode the cookie seeds the next new browser tab
      setTabCookie(tabId)
      if (isSession) {
        writeSessionTab(tabId)
      }
    },
    [isSession],
  )

  const contextValue = useMemo(
    () => ({ activeTabId, onTabChange: handleTabChange, storage }),
    [activeTabId, handleTabChange, storage],
  )

  const tabViewIds = tabViews ? tabIds.filter((id) => Boolean(tabViews[id])) : []
  const head = isSession ? (
    <>
      {isServerRender && (
        <script
          dangerouslySetInnerHTML={{ __html: buildSessionTabScript(tabIds, initialActiveTabId) }}
          nonce={nonce}
          suppressHydrationWarning
        />
      )}
      <style
        dangerouslySetInnerHTML={{ __html: buildSessionTabStyles(tabIds, tabViewIds) }}
        nonce={nonce}
        suppressHydrationWarning
      />
    </>
  ) : undefined

  return (
    <EnhancedSidebarContext.Provider value={contextValue}>
      <SidebarWrapper
        activeTabId={isSession ? activeTabId : undefined}
        baseClass={baseClass}
        head={head}
      >
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
