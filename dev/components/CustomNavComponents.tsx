'use client'

import { Link } from '@payloadcms/ui'
import React from 'react'

import type { CustomNavGroupProps, CustomNavItemProps } from '@veiag/payload-enhanced-sidebar'
import { useNavItemState } from '@veiag/payload-enhanced-sidebar'

export const CustomNavItem: React.FC<CustomNavItemProps> = ({ entity, href, id, label }) => {
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

export const CustomNavGroup: React.FC<CustomNavGroupProps> = ({ label, children }) => {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        style={{
          color: 'var(--theme-elevation-400)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          padding: '8px 12px 4px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}
