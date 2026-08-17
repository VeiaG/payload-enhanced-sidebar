// Hooks and providers for your own client components.
// Also exported from the package root, but importing them from there pulls the
// plugin (and `payload` itself) into the client bundle — import from
// `@veiag/payload-enhanced-sidebar/client` inside `'use client'` files.
export {
  BadgeProvider,
  useBadgeContext,
  useBadgeValue,
} from '../components/EnhancedSidebar/BadgeProvider/index.js'
export type { BadgeProviderProps } from '../components/EnhancedSidebar/BadgeProvider/index.js'
export { useEnhancedSidebar } from '../components/EnhancedSidebar/context.js'
export type { EnhancedSidebarContextValue } from '../components/EnhancedSidebar/context.js'
export { useNavItemState } from '../components/EnhancedSidebar/hooks/useNavItemState.js'
export { useTabState } from '../components/EnhancedSidebar/hooks/useTabState.js'

// Client components exported for Payload's component system
export { InternalBadgeProvider } from '../components/EnhancedSidebar/InternalBadgeProvider/index.js'

export type {
  BadgeColor,
  BadgeConfig,
  BadgeValues,
  CustomNavContentProps,
  CustomNavGroupProps,
  CustomNavItemComponentProps,
  CustomNavItemProps,
  CustomTabButtonProps,
  CustomTabIconProps,
  CustomTabsBarComponentProps,
  ExtendedEntity,
  IconName,
} from '../types.js'
