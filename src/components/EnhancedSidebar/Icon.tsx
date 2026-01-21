'use client'

import { icons } from 'lucide-react'
import React from 'react'

import type { IconName } from '../../types'

export interface IconProps {
  className?: string
  name: IconName
  size?: number
}

export const Icon: React.FC<IconProps> = ({ name, className, size = 20 }) => {
  const LucideIcon = icons[name]

  if (!LucideIcon) {
    return null
  }

  return <LucideIcon className={className} size={size} />
}
