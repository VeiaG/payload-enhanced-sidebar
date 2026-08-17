'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, Tooltip, useTranslation } from '@payloadcms/ui'
import React, { useState } from 'react'

import type { SidebarTabContent, SidebarTabLink } from '../../../types.js'

import { Badge } from '../Badge/index.js'
import { useBadge } from '../hooks/useBadge.js'
import { Icon } from '../Icon.js'

const tabsBaseClass = 'tabs-bar'

/**
 * True for clicks that land in a new tab/window instead of this one — modifier
 * clicks and middle clicks. Payload's `Link` already swallows these before it
 * calls `onClick`; we re-check so the rule is ours and not inherited.
 */
const opensElsewhere = (e: React.MouseEvent): boolean =>
  e.defaultPrevented || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey

type TabButtonProps = {
  /** Computed href — set only for tabs that declare one; makes the tab render as a link */
  href?: string
  icon?: React.ReactNode
  /** Whether this tab's panel is the open one */
  isActive: boolean
  /** Whether the current route matches `href` (only meaningful for linked tabs) */
  isCurrentPage?: boolean
  onTabChange: (tabId: string) => void
  tab: SidebarTabContent
}

export const TabButton: React.FC<TabButtonProps> = ({
  href,
  icon,
  isActive,
  isCurrentPage,
  onTabChange,
  tab,
}) => {
  const { i18n } = useTranslation()
  const label = getTranslation(tab.label, i18n)
  const { value } = useBadge(tab.badge, tab.id)
  const [hovered, setHovered] = useState(false)

  const className = [
    `${tabsBaseClass}__tab`,
    isActive && `${tabsBaseClass}__tab--active`,
    // Route-match indicator, only ever set on a linked tab
    isCurrentPage && `${tabsBaseClass}__tab--current`,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {icon ?? <Icon name={tab.icon!} size={20} />}
      {value !== undefined && <Badge color={tab.badge?.color} position="absolute" value={value} />}
      <Tooltip alignCaret="left" show={hovered}>
        {label}
      </Tooltip>
    </>
  )

  const hoverHandlers = {
    onBlur: () => setHovered(false),
    onFocus: () => setHovered(true),
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  }

  // A tab with an href navigates *and* opens its panel, so it has to be a real
  // anchor — that keeps middle/modifier clicks, "open in new tab" and link
  // previews working.
  if (href !== undefined) {
    return (
      <Link
        aria-current={isCurrentPage ? 'page' : undefined}
        aria-label={label}
        className={className}
        href={href}
        {...hoverHandlers}
        onClick={(e) => {
          // A click that lands in a new tab/window leaves this one as it was,
          // panel included.
          if (opensElsewhere(e)) {
            return
          }
          onTabChange(tab.id)
        }}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      aria-label={label}
      className={className}
      {...hoverHandlers}
      onClick={() => onTabChange(tab.id)}
      type="button"
    >
      {content}
    </button>
  )
}

type TabLinkProps = {
  href: string
  icon?: React.ReactNode
  isActive: boolean
  link: SidebarTabLink
}

export const TabLink: React.FC<TabLinkProps> = ({ href, icon, isActive, link }) => {
  const { i18n } = useTranslation()
  const label = getTranslation(link.label, i18n)
  const { value } = useBadge(link.badge, link.id)
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      aria-label={label}
      className={`${tabsBaseClass}__link ${isActive ? `${tabsBaseClass}__link--active` : ''}`}
      href={href}
      onBlur={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      rel={link.isExternal ? 'noopener noreferrer' : undefined}
      target={link.isExternal ? '_blank' : undefined}
    >
      {icon ?? <Icon name={link.icon!} size={20} />}
      {value !== undefined && <Badge color={link.badge?.color} position="absolute" value={value} />}
      <Tooltip alignCaret="left" show={hovered}>
        {label}
      </Tooltip>
    </Link>
  )
}
