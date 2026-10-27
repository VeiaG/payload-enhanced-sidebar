'use client'

import { createContext, useContext } from 'react'

export type EnhancedSidebarContextValue = {
  activeTabId: string
  onTabChange: (tabId: string) => void
  /** The plugin's `storage` option. */
  storage: 'cookie' | 'session'
}

export const EnhancedSidebarContext = createContext<EnhancedSidebarContextValue>({
  activeTabId: '',
  onTabChange: () => {},
  storage: 'cookie',
})

export const useEnhancedSidebar = () => useContext(EnhancedSidebarContext)
