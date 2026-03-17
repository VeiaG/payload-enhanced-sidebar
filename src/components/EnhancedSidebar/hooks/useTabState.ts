'use client'

import { useEnhancedSidebar } from '../context'

/**
 * Returns whether a sidebar tab is currently active.
 * Use this inside a custom `NavContent` component to show/hide tab content.
 *
 * @example
 * ```tsx
 * const { isActive } = useTabState('my-tab-id')
 * return <div style={{ display: isActive ? undefined : 'none' }}>{children}</div>
 * ```
 */
export const useTabState = (id: string): { isActive: boolean } => {
  const { activeTabId } = useEnhancedSidebar()
  return { isActive: activeTabId === id }
}
