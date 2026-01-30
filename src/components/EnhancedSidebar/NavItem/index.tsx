'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { BadgeConfig, ExtendedEntity } from '../../../types'

import { Badge } from '../Badge'
import { useBadge } from '../hooks/useBadge'

const baseClass = 'enhanced-sidebar'

export type NavItemProps = {
  badgeConfig?: BadgeConfig
  entity: ExtendedEntity
  href: string
  id: string
  isActive: boolean
  isCurrentPage: boolean
}

export const NavItem: React.FC<NavItemProps> = ({
  badgeConfig,
  entity,
  href,
  id,
  isActive,
  isCurrentPage,
}) => {
  const { i18n } = useTranslation()
  const { value: badgeValue } = useBadge(badgeConfig, entity.slug)

  const Label = (
    <>
      {isActive && <div className={`${baseClass}__link-indicator`} />}
      <span className={`${baseClass}__link-label`}>{getTranslation(entity.label, i18n)}</span>
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
