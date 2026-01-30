'use client'

import React, { createContext, useContext, useMemo } from 'react'

import type { BadgeValues } from '../../../types'

type BadgeContextValue = {
  values: BadgeValues
}

const BadgeContext = createContext<BadgeContextValue>({ values: {} })

export type BadgeProviderProps = {
  children: React.ReactNode
  /**
   * Badge values object.
   * Keys are slugs (collection slug, global slug, or custom item slug).
   * Values can be numbers or React nodes.
   *
   * Values are merged with any parent BadgeProvider values.
   * This provider's values take priority over parent values.
   *
   * @example
   * ```tsx
   * <BadgeProvider values={{ orders: 5, notifications: <CustomBadge /> }}>
   *   {children}
   * </BadgeProvider>
   * ```
   */
  values: BadgeValues
}

/**
 * Provider for badge values.
 * Wrap your app with this provider and pass badge values.
 * Values are reactive - changes will update badges automatically.
 *
 * Values are merged with any parent BadgeProvider (e.g., InternalBadgeProvider).
 * This provider's values take priority, allowing you to override internal values.
 *
 * @example
 * ```tsx
 * // In your admin.components.providers
 * import { BadgeProvider } from '@veiag/payload-enhanced-sidebar'
 *
 * export const MyProvider = ({ children }) => {
 *   const [counts, setCounts] = useState({ orders: 0 })
 *
 *   useEffect(() => {
 *     // Fetch counts, subscribe to realtime updates, etc.
 *   }, [])
 *
 *   return (
 *     <BadgeProvider values={counts}>
 *       {children}
 *     </BadgeProvider>
 *   )
 * }
 * ```
 */
export const BadgeProvider: React.FC<BadgeProviderProps> = ({ children, values }) => {
  // Get parent context values (if any)
  const parentContext = useContext(BadgeContext)

  // Merge parent values with this provider's values (this provider wins)
  const mergedValues = useMemo(
    () => ({
      ...parentContext.values,
      ...values,
    }),
    [parentContext.values, values],
  )

  return <BadgeContext.Provider value={{ values: mergedValues }}>{children}</BadgeContext.Provider>
}

/**
 * Hook to access badge values from context.
 * Returns the full values object from BadgeProvider.
 */
export const useBadgeContext = (): BadgeContextValue => {
  return useContext(BadgeContext)
}

/**
 * Hook to get a specific badge value by slug.
 * Returns the value for the given slug, or undefined if not found.
 */
export const useBadgeValue = (slug: string): number | React.ReactNode | undefined => {
  const { values } = useBadgeContext()
  return values[slug]
}
