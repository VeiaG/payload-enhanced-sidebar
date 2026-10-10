'use client'

import { useNav } from '@payloadcms/ui'
import React from 'react'

import './index.css'

export const SidebarWrapper: React.FC<{
  baseClass: string
  children: React.ReactNode
  /** `iconStrokeWidth` option, exposed to the CSS as `--enhanced-sidebar-icon-stroke-width` */
  iconStrokeWidth?: number
}> = ({ baseClass, children, iconStrokeWidth }) => {
  const { hydrated, navOpen, navRef } = useNav()

  return (
    <aside
      className={[
        baseClass,
        navOpen && `${baseClass}--nav-open`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
      inert={!navOpen ? true : undefined}
      style={
        iconStrokeWidth !== undefined
          ? ({ '--enhanced-sidebar-icon-stroke-width': iconStrokeWidth } as React.CSSProperties)
          : undefined
      }
    >
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
