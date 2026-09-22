// Hooks, providers and default components for your own client components.
// The hooks and providers are also exported from the package root, but importing them
// from there pulls the plugin (and `payload` itself) into the client bundle — import
// from `@veiag/payload-enhanced-sidebar/client` inside `'use client'` files.
// The default components live here only: they import .scss (see src/index.ts).
//
// The default components (Badge, NavItem, NavContentShell, TabButton) are meant to be
// wrapped by your custom components instead of rebuilt. InternalBadgeProvider is
// exported for Payload's component system.
export { Badge } from '../components/EnhancedSidebar/Badge/index.js'
export type { BadgeProps } from '../components/EnhancedSidebar/Badge/index.js'
export {
  BadgeProvider,
  useBadgeContext,
  useBadgeValue,
} from '../components/EnhancedSidebar/BadgeProvider/index.js'
export type { BadgeProviderProps } from '../components/EnhancedSidebar/BadgeProvider/index.js'
export { useEnhancedSidebar } from '../components/EnhancedSidebar/context.js'
export type { EnhancedSidebarContextValue } from '../components/EnhancedSidebar/context.js'
export { useBadge } from '../components/EnhancedSidebar/hooks/useBadge.js'
export { useNavItemState } from '../components/EnhancedSidebar/hooks/useNavItemState.js'
export { useTabState } from '../components/EnhancedSidebar/hooks/useTabState.js'
export { InternalBadgeProvider } from '../components/EnhancedSidebar/InternalBadgeProvider/index.js'
export { NavContentShell } from '../components/EnhancedSidebar/NavContent/index.js'
export type { NavContentShellProps } from '../components/EnhancedSidebar/NavContent/index.js'
export { NavItem } from '../components/EnhancedSidebar/NavItem/index.js'
export type { NavItemProps } from '../components/EnhancedSidebar/NavItem/index.js'
export { TabButton } from '../components/EnhancedSidebar/TabsBar/TabItem.js'
export type { TabButtonProps } from '../components/EnhancedSidebar/TabsBar/TabItem.js'

export type {
  BadgeColor,
  BadgeConfig,
  BadgeValues,
  CustomNavContentProps,
  CustomNavGroupProps,
  CustomNavItemComponentProps,
  CustomNavItemProps,
  CustomTabButtonProps,
  CustomTabContentProps,
  CustomTabIconProps,
  CustomTabsBarComponentProps,
  ExtendedEntity,
  IconName,
} from '../types.js'
