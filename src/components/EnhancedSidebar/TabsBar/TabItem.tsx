'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { SidebarTabContent, SidebarTabLink } from '../../../types'

import { Badge } from '../Badge'
import { useBadge } from '../hooks/useBadge'
import { Icon } from '../Icon'

const tabsBaseClass = 'tabs-bar'

type TabButtonProps = {
  isActive: boolean
  onTabChange: (tabId: string) => void
  tab: SidebarTabContent
}

export const TabButton: React.FC<TabButtonProps> = ({ isActive, onTabChange, tab }) => {
  const { i18n } = useTranslation()
  const label = getTranslation(tab.label, i18n)
  const { value } = useBadge(tab.badge, tab.id)

  return (
    <button
      className={`${tabsBaseClass}__tab ${isActive ? `${tabsBaseClass}__tab--active` : ''}`}
      onClick={() => onTabChange(tab.id)}
      title={label}
      type="button"
    >
      <Icon name={tab.icon} size={20} />
      {value !== undefined && <Badge color={tab.badge?.color} position="absolute" value={value} />}
    </button>
  )
}

type TabLinkProps = {
  href: string
  isActive: boolean
  link: SidebarTabLink
}

export const TabLink: React.FC<TabLinkProps> = ({ href, isActive, link }) => {
  const { i18n } = useTranslation()
  const label = getTranslation(link.label, i18n)
  const { value } = useBadge(link.badge, link.id)

  return (
    <Link
      className={`${tabsBaseClass}__link ${isActive ? `${tabsBaseClass}__link--active` : ''}`}
      href={href}
      rel={link.isExternal ? 'noopener noreferrer' : undefined}
      target={link.isExternal ? '_blank' : undefined}
      title={label}
    >
      <Icon name={link.icon} size={20} />
      {value !== undefined && <Badge color={link.badge?.color} position="absolute" value={value} />}
    </Link>
  )
}
