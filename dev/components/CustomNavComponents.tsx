'use client'

import type {
  CustomNavContentProps,
  CustomNavGroupProps,
  CustomNavItemProps,
  CustomTabButtonProps,
  CustomTabIconProps,
  CustomTabsBarComponentProps,
} from '@veiag/payload-enhanced-sidebar'

import { Link } from '@payloadcms/ui'
import { useEnhancedSidebar, useNavItemState, useTabState } from '@veiag/payload-enhanced-sidebar'
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
  const { isActive } = useTabState(id)
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
