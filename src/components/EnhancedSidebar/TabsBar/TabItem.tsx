'use client'

import { Link, Tooltip } from '@payloadcms/ui'
import { usePathname } from 'next/navigation.js'
import React, { useState } from 'react'

import type { CustomTabButtonProps } from '../../../types.js'

import { Badge } from '../Badge/index.js'
import { useEnhancedSidebar } from '../context.js'
import { useBadge } from '../hooks/useBadge.js'

const tabsBaseClass = 'tabs-bar'

/**
 * True for clicks that land in a new tab/window instead of this one — modifier
 * clicks and middle clicks. Payload's `Link` already swallows these before it
 * calls `onClick`; we re-check so the rule is ours and not inherited.
 */
const opensElsewhere = (e: React.MouseEvent): boolean =>
  e.defaultPrevented || e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey

/** Path part of an href without a trailing slash, so `/admin/` matches `/admin`. */
const normalizePath = (href: string): string => {
  const path = href.split(/[?#]/)[0] || '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export type TabButtonProps = {
  /**
   * Whether the current route matches `href`. Computed from the pathname when omitted
   * (query string and trailing slash ignored).
   */
  isCurrentPage?: boolean
} & CustomTabButtonProps

/**
 * The default tabs bar button, for both `tab` and `link` items. Takes the same props a
 * custom `TabButton` / `buttonComponent` receives, so a custom one can wrap it and only
 * change what it needs — e.g. pass a different `href`:
 *
 * ```tsx
 * export const MyTabButton = (props: CustomTabButtonProps) => (
 *   <TabButton {...props} href={`${props.href}?tab=1`} />
 * )
 * ```
 */
export const TabButton: React.FC<TabButtonProps> = ({
  id,
  type,
  badge,
  href,
  icon,
  isCurrentPage: isCurrentPageProp,
  isExternal,
  label,
}) => {
  const { activeTabId, onTabChange } = useEnhancedSidebar()
  const pathname = usePathname()
  const { value } = useBadge(badge, id)
  const [hovered, setHovered] = useState(false)

  const isCurrentPage =
    isCurrentPageProp ??
    (href !== undefined && !isExternal && normalizePath(href) === normalizePath(pathname))

  const content = (
    <>
      {icon}
      {value !== undefined && <Badge color={badge?.color} position="absolute" value={value} />}
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

  if (type === 'link') {
    return (
      <Link
        aria-label={label}
        className={`${tabsBaseClass}__link ${isCurrentPage ? `${tabsBaseClass}__link--active` : ''}`}
        href={href ?? ''}
        {...hoverHandlers}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        target={isExternal ? '_blank' : undefined}
      >
        {content}
      </Link>
    )
  }

  const className = [
    `${tabsBaseClass}__tab`,
    activeTabId === id && `${tabsBaseClass}__tab--active`,
    // Route-match indicator, only ever set on a linked tab
    href !== undefined && isCurrentPage && `${tabsBaseClass}__tab--current`,
  ]
    .filter(Boolean)
    .join(' ')

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
          onTabChange(id)
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
      onClick={() => onTabChange(id)}
      type="button"
    >
      {content}
    </button>
  )
}
