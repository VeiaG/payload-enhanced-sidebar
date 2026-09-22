// Server-only on purpose: `icons` is the full Lucide map. Imported from a client
// component it would ship every icon to the browser — render icons on the server
// (see EnhancedSidebar) and pass the nodes down instead.
import { icons } from 'lucide-react'
import React from 'react'

import type { IconName } from '../../types.js'

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
