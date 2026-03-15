'use client'

import { usePathname } from 'next/navigation'

/**
 * Hook to get the active state of a nav item based on the current pathname.
 * Use this in your custom NavItem component registered via `customComponents.NavItem`.
 *
 * @example
 * ```tsx
 * 'use client'
 * import { useNavItemState } from '@veiag/payload-enhanced-sidebar'
 *
 * export const MyNavItem = ({ href, label }) => {
 *   const { isActive, isCurrentPage } = useNavItemState(href)
 *   return (
 *     <a href={href} style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
 *       {label}
 *     </a>
 *   )
 * }
 * ```
 */
export const useNavItemState = (href: string): { isActive: boolean; isCurrentPage: boolean } => {
  const pathname = usePathname()
  return {
    isActive: pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length]),
    isCurrentPage: pathname === href,
  }
}
