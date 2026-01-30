'use client'

import React from 'react'

import type { BadgeColor } from '../../../types'

import './index.scss'

const baseClass = 'sidebar-badge'

export type BadgeProps = {
  /**
   * Badge color variant
   * @default 'default'
   */
  color?: BadgeColor
  /**
   * Position modifier
   * - 'absolute': positioned at top-right corner (for icons)
   * - 'inline': inline with margin (for nav items)
   */
  position?: 'absolute' | 'inline'
  /**
   * Badge value - number or React node
   * Numbers > 99 will be displayed as "99+"
   */
  value: number | React.ReactNode
}

/**
 * Format badge value - show up to 2 digits, 99+ for larger numbers
 */
const formatValue = (value: number | React.ReactNode): React.ReactNode => {
  if (typeof value === 'number') {
    return value > 99 ? '99+' : value
  }
  return value
}

export const Badge: React.FC<BadgeProps> = ({ color = 'default', position, value }) => {
  // Don't render if value is 0 or falsy (except for React nodes)
  if (value === 0 || (typeof value !== 'object' && !value)) {
    return null
  }

  const classes = [
    baseClass,
    `${baseClass}--${color}`,
    position && `${baseClass}--${position}`,
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{formatValue(value)}</span>
}
