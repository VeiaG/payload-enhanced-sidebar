'use client'

import React from 'react'

import type { CustomNavContentProps } from '../../../types.js'

import { useEnhancedSidebar } from '../context.js'
import { useTabState } from '../hooks/useTabState.js'

const baseClass = 'enhanced-sidebar'

export type NavContentShellProps = {
  children?: React.ReactNode
  /** Extra class for the outer `<nav>` */
  className?: string
  /** Extra class for the inner scroll container */
  scrollClassName?: string
  /**
   * Inline style for the inner scroll container — where the padding lives.
   * Handy for `--enhanced-sidebar-content-padding-inline`.
   */
  style?: React.CSSProperties
}

/**
 * The default nav content area: a `<nav>` with a scroll container inside, laid out
 * and padded like the built-in one. Use it in a tab's `contentComponent` (or a custom
 * `NavContent`) to keep the default look without copying class names.
 */
export const NavContentShell: React.FC<NavContentShellProps> = ({
  children,
  className,
  scrollClassName,
  style,
}) => (
  <nav className={[`${baseClass}__content`, className].filter(Boolean).join(' ')}>
    <div
      className={[`${baseClass}__content-scroll`, scrollClassName].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </div>
  </nav>
)

const TabPanel: React.FC<{ children: React.ReactNode; id: string }> = ({ id, children }) => {
  const { isActive } = useTabState(id)
  return (
    <div aria-hidden={!isActive} style={{ display: isActive ? undefined : 'none' }}>
      {children}
    </div>
  )
}

/**
 * Wraps a tab's `contentComponent`. `display: contents` keeps its `<nav>` a direct
 * flex child of the sidebar while active; it stays mounted (just hidden) otherwise.
 */
const TabView: React.FC<{ children: React.ReactNode; id: string }> = ({ id, children }) => {
  const { isActive } = useTabState(id)
  return (
    <div aria-hidden={!isActive} style={{ display: isActive ? 'contents' : 'none' }}>
      {children}
    </div>
  )
}

export const NavContent: React.FC<CustomNavContentProps> = ({
  afterNav,
  afterNavLinks,
  allContent,
  beforeNav,
  beforeNavLinks,
  tabs,
  tabsContent,
  tabViews,
}) => {
  const { activeTabId } = useEnhancedSidebar()
  const hasTabs = tabs.length > 0
  const defaultTabs = tabs.filter((tab) => !tabViews?.[tab.id])
  const customTabs = tabs.filter((tab) => Boolean(tabViews?.[tab.id]))
  const isDefaultHidden = Boolean(tabViews?.[activeTabId])

  const defaultNav = (
    <NavContentShell>
      {beforeNav}
      {beforeNavLinks}
      {hasTabs
        ? defaultTabs.map((tab) => (
            <TabPanel id={tab.id} key={tab.id}>
              {tabsContent[tab.id]}
            </TabPanel>
          ))
        : allContent}
      {afterNavLinks}
      {afterNav}
    </NavContentShell>
  )

  if (customTabs.length === 0) {
    return defaultNav
  }

  return (
    <>
      {/* Hidden rather than unmounted while a custom view is active, so NavGroup open
          state and the Payload slots survive tab switches. */}
      <div aria-hidden={isDefaultHidden} style={{ display: isDefaultHidden ? 'none' : 'contents' }}>
        {defaultNav}
      </div>
      {customTabs.map((tab) => (
        <TabView id={tab.id} key={tab.id}>
          {tabViews![tab.id]}
        </TabView>
      ))}
    </>
  )
}
