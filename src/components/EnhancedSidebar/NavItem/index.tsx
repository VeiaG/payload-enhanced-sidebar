'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { BadgeConfig, ExtendedEntity } from '../../../types.js'

import { Badge } from '../Badge/index.js'
import { useBadge } from '../hooks/useBadge.js'
import { useNavItemState } from '../hooks/useNavItemState.js'

const baseClass = 'enhanced-sidebar'

export type NavItemProps = {
  /** Badge configuration as defined in the plugin config */
  badgeConfig?: BadgeConfig
  /** The entity (collection, global, or custom item) */
  entity: ExtendedEntity
  /** Computed href with admin route prefix applied */
  href: string
  /** DOM element id */
  id: string
  /** Label to show. Defaults to the translated `entity.label` */
  label?: string
}

/**
 * The default nav row — link, selected state and badge, laid out like a row in Payload's own
 * nav (`.nav__link`). Takes the same props a custom `NavItem` receives, so a custom one can
 * wrap it:
 *
 * ```tsx
 * export const MyNavItem = (props: CustomNavItemProps) => (
 *   <div className="my-row">
 *     <NavItem {...props} />
 *   </div>
 * )
 * ```
 */
export const NavItem: React.FC<NavItemProps> = ({ id, badgeConfig, entity, href, label }) => {
  const { i18n } = useTranslation()
  const { value: badgeValue } = useBadge(badgeConfig, entity.slug)
  const { isActive, isCurrentPage } = useNavItemState(href)

  return (
    <div className={`${baseClass}__link-wrapper`}>
      <Link
        // Same as Payload's nav: the current page is still a link, marked as such
        aria-current={isActive ? (isCurrentPage ? 'page' : 'location') : undefined}
        className={[`${baseClass}__link`, isActive && `${baseClass}__link--selected`]
          .filter(Boolean)
          .join(' ')}
        href={href}
        id={id}
        prefetch={false}
        rel={entity.isExternal ? 'noopener noreferrer' : undefined}
        target={entity.isExternal ? '_blank' : undefined}
      >
        <span className={`${baseClass}__link-label`}>
          {label ?? getTranslation(entity.label, i18n)}
        </span>
        {badgeValue !== undefined && (
          <Badge color={badgeConfig?.color} position="inline" value={badgeValue} />
        )}
      </Link>
    </div>
  )
}
