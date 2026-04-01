'use client'

import React from 'react'

import type { CustomNavContentProps } from '../../../types'

import { useTabState } from '../hooks/useTabState'

const baseClass = 'enhanced-sidebar'

const TabPanel: React.FC<{ children: React.ReactNode; id: string }> = ({ id, children }) => {
  const { isActive } = useTabState(id)
  return (
    <div aria-hidden={!isActive} style={{ display: isActive ? undefined : 'none' }}>
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
}) => {
  const hasTabs = tabs.length > 0

  return (
    <nav className={`${baseClass}__content`}>
      <div className={`${baseClass}__content-scroll`}>
        {beforeNav}
        {beforeNavLinks}
        {hasTabs
          ? tabs.map((tab) => (
              <TabPanel id={tab.id} key={tab.id}>
                {tabsContent[tab.id]}
              </TabPanel>
            ))
          : allContent}
        {afterNavLinks}
        {afterNav}
      </div>
    </nav>
  )
}
