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
 * The default nav row — link, active indicator and badge. Takes the same props a custom
 * `NavItem` receives, so a custom one can wrap it:
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

  const Label = (
    <>
      {isActive && <div className={`${baseClass}__link-indicator`} />}
      <span className={`${baseClass}__link-label`}>{label ?? getTranslation(entity.label, i18n)}</span>
      {badgeValue !== undefined && (
        <Badge color={badgeConfig?.color} position="inline" value={badgeValue} />
      )}
    </>
  )

  if (isCurrentPage) {
    return (
      <div className={`${baseClass}__link`} id={id}>
        {Label}
      </div>
    )
  }

  return (
    <Link
      className={`${baseClass}__link`}
      href={href}
      id={id}
      prefetch={false}
      rel={entity.isExternal ? 'noopener noreferrer' : undefined}
      target={entity.isExternal ? '_blank' : undefined}
    >
      {Label}
    </Link>
  )
}
