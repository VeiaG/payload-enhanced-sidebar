'use client'

import type {
  CustomNavContentProps,
  CustomNavGroupProps,
  CustomNavItemComponentProps,
  CustomNavItemProps,
  CustomTabButtonProps,
  CustomTabContentProps,
  CustomTabIconProps,
  CustomTabsBarComponentProps,
} from '@veiag/payload-enhanced-sidebar'

import { Link } from '@payloadcms/ui'
import {
  NavContentShell,
  TabButton,
  useEnhancedSidebar,
  useNavItemState,
  useTabState,
} from '@veiag/payload-enhanced-sidebar/client'
import { useSearchParams } from 'next/navigation.js'
import React, { useState } from 'react'

export const CustomNavItem: React.FC<CustomNavItemProps> = ({ id, entity, href, label }) => {
  const { isActive, isCurrentPage } = useNavItemState(href)

  const content = (
    <span style={{ alignItems: 'center', display: 'flex', gap: '6px' }}>
      <span
        style={{
          background: isActive ? 'var(--theme-success-500)' : 'transparent',
          borderRadius: '50%',
          flexShrink: 0,
          height: '6px',
          width: '6px',
        }}
      />
      {label}
    </span>
  )

  if (isCurrentPage) {
    return (
      <div
        id={id}
        style={{
          color: 'var(--theme-text)',
          fontWeight: 600,
          opacity: 0.5,
          padding: '4px 12px',
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      id={id}
      prefetch={false}
      rel={entity.isExternal ? 'noopener noreferrer' : undefined}
      style={{ display: 'block', padding: '4px 12px' }}
      target={entity.isExternal ? '_blank' : undefined}
    >
      {content}
    </Link>
  )
}

export const CustomNavContent: React.FC<CustomNavContentProps> = ({
  afterNavLinks,
  allContent,
  beforeNavLinks,
  tabs,
  tabsContent,
}) => {
  const hasTabs = tabs.length > 0

  return (
    <nav
      style={{
        border: '2px solid #e5484d',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        margin: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#e5484d22',
          color: '#e5484d',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          padding: '3px 8px',
          textTransform: 'uppercase',
        }}
      >
        Custom NavContent
      </div>
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '4px 0' }}>
        {beforeNavLinks}
        {hasTabs
          ? tabs.map((tab) => <TabPanel id={tab.id} key={tab.id} tabsContent={tabsContent} />)
          : allContent}
        {afterNavLinks}
      </div>
    </nav>
  )
}

const TabPanel: React.FC<{ id: string; tabsContent: Record<string, React.ReactNode> }> = ({
  id,
  tabsContent,
}) => {
  const { isActive } = useTabState(id)
  return (
    <div aria-hidden={!isActive} style={{ display: isActive ? undefined : 'none' }}>
      {tabsContent[id]}
    </div>
  )
}

export const CustomTabIcon: React.FC<CustomTabIconProps> = ({ id, label }) => {
  // Simple colored square icon — unique per tab id via hue rotation
  const hue = (id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 47) % 360
  return (
    <span
      aria-label={label}
      style={{
        alignItems: 'center',
        background: `hsl(${hue}, 70%, 55%)`,
        border: '2px solid #3b82f6',
        borderRadius: '4px',
        display: 'flex',
        fontSize: '9px',
        fontWeight: 800,
        height: '20px',
        justifyContent: 'center',
        width: '20px',
      }}
      title={label}
    >
      {id[0]?.toUpperCase()}
    </span>
  )
}

export const CustomTabButton: React.FC<CustomTabButtonProps> = ({
  id,
  type,
  badge,
  href,
  icon,
  isExternal,
  label,
}) => {
  const { isActive: isTabActive } = useTabState(id)
  const { isActive: isLinkActive } = useNavItemState(href ?? '')
  const isActive = type === 'link' ? isLinkActive : isTabActive
  const { onTabChange } = useEnhancedSidebar()

  const style: React.CSSProperties = {
    alignItems: 'center',
    border: '2px solid #a855f7',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    justifyContent: 'center',
    margin: '2px',
    opacity: isActive ? 1 : 0.5,
    outline: isActive ? '2px solid #a855f7' : 'none',
    outlineOffset: '1px',
    padding: '6px 4px',
    width: '44px',
  }

  const content = (
    <>
      {icon}
      <span
        style={{
          fontSize: '8px',
          fontWeight: 700,
          maxWidth: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </>
  )

  if (type === 'link' && href) {
    return (
      <a
        href={href}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        style={{ ...style, textDecoration: 'none' }}
        target={isExternal ? '_blank' : undefined}
        title={label}
      >
        {content}
      </a>
    )
  }

  return (
    <button onClick={() => onTabChange(id)} style={style} title={label} type="button">
      {content}
    </button>
  )
}

/**
 * Per-item custom component (`customItems[].component`).
 * A live client component — receives only `{ slug }` plus any `clientProps`.
 * Here we read a custom `variant` prop forwarded via `clientProps`.
 */
export const CustomNavItemComponent: React.FC<
  { variant?: 'banner' | 'meter' } & CustomNavItemComponentProps
> = ({ slug, variant = 'banner' }) => {
  const [count, setCount] = useState(0)

  if (variant === 'meter') {
    return (
      <div
        id={`nav-${slug}`}
        style={{
          background: 'var(--theme-elevation-50)',
          borderRadius: '4px',
          fontSize: '11px',
          margin: '4px 12px',
          padding: '6px 8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Storage ({slug})</span>
          <span>42%</span>
        </div>
        <div style={{ background: 'var(--theme-elevation-150)', borderRadius: 3, height: 4 }}>
          <div style={{ background: '#22c55e', borderRadius: 3, height: 4, width: '42%' }} />
        </div>
      </div>
    )
  }

  return (
    <button
      id={`nav-${slug}`}
      onClick={() => setCount((c) => c + 1)}
      style={{
        background: 'linear-gradient(90deg,#f59e0b22,#ef444422)',
        border: '1px dashed #f59e0b',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'block',
        fontSize: '11px',
        margin: '4px 12px',
        padding: '8px',
        textAlign: 'left',
        width: 'calc(100% - 24px)',
      }}
      type="button"
    >
      <span aria-label="fire" role="img">
        🔥
      </span>{' '}
      Per-item component <strong>{slug}</strong> — clicked {count}×
    </button>
  )
}

export const TabSeparator: React.FC<CustomTabsBarComponentProps> = () => {
  return (
    <div
      style={{
        background: 'var(--theme-elevation-150)',
        borderRadius: '2px',
        height: '1px',
        margin: '4px 8px',
        width: 'calc(100% - 16px)',
      }}
      title="Separator"
    />
  )
}

export const CustomNavGroup: React.FC<CustomNavGroupProps> = ({
  children,
  isOpen = true,
  label,
}) => {
  const [open, setOpen] = useState(isOpen)

  return (
    <div style={{ marginBottom: '8px' }}>
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: 'var(--theme-elevation-400)',
          cursor: 'pointer',
          display: 'flex',
          fontSize: '10px',
          fontWeight: 700,
          gap: '4px',
          justifyContent: 'space-between',
          letterSpacing: '0.08em',
          padding: '8px 12px 4px',
          textTransform: 'uppercase',
          width: '100%',
        }}
        type="button"
      >
        {label}
        <span style={{ fontSize: '8px' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  )
}

/**
 * Per-item `buttonComponent` example: a linked tab that carries the current URL's
 * search params along, so clicking it doesn't drop filters/pagination.
 * Wraps the plugin's default `TabButton` and only changes the href.
 */
export const KeepQueryTabButton: React.FC<CustomTabButtonProps> = (props) => {
  const query = useSearchParams().toString()
  return <TabButton {...props} href={props.href && query ? `${props.href}?${query}` : props.href} />
}

const DEMO_CHATS = [
  { id: '1', name: 'Design review', preview: 'Can we ship the new sidebar?' },
  { id: '2', name: 'Support', preview: 'Customer asks about invoices' },
  { id: '3', name: 'Marketing', preview: 'Newsletter draft is ready' },
]

/**
 * Per-tab `contentComponent` example: a chat list instead of nav links.
 * Replaces the whole nav area while the tab is active — no Payload before/after slots.
 * `NavContentShell` keeps the default layout; the padding is tweaked via the CSS variable.
 */
export const ChatListPanel: React.FC<{ title?: string } & CustomTabContentProps> = ({
  content,
  title,
}) => (
  <NavContentShell
    style={{ '--enhanced-sidebar-content-padding-inline': '8px' } as React.CSSProperties}
  >
    <strong style={{ padding: '0 8px 8px' }}>{title}</strong>
    {DEMO_CHATS.map((chat) => (
      <button
        key={chat.id}
        style={{
          background: 'none',
          border: 0,
          borderRadius: 6,
          color: 'inherit',
          cursor: 'pointer',
          padding: '8px',
          textAlign: 'left',
        }}
        type="button"
      >
        <div style={{ fontWeight: 600 }}>{chat.name}</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{chat.preview}</div>
      </button>
    ))}
    {content}
  </NavContentShell>
)
