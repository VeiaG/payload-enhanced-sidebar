'use client'

import { createContext, useContext } from 'react'

export type EnhancedSidebarContextValue = {
  activeTabId: string
  onTabChange: (tabId: string) => void
}

export const EnhancedSidebarContext = createContext<EnhancedSidebarContextValue>({
  activeTabId: '',
  onTabChange: () => {},
})

export const useEnhancedSidebar = () => useContext(EnhancedSidebarContext)
