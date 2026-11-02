'use client'

import { useNav } from '@payloadcms/ui'
import React from 'react'

import './index.css'

export const SidebarWrapper: React.FC<{
  /** Set as `data-active-tab` on the root (`storage: 'session'` only). */
  activeTabId?: string
  baseClass: string
  children: React.ReactNode
  /** Rendered as the root's first children — the session-tab script and styles. */
  head?: React.ReactNode
  /** `iconStrokeWidth` option, exposed to the CSS as `--enhanced-sidebar-icon-stroke-width` */
  iconStrokeWidth?: number
}> = ({ activeTabId, baseClass, children, head, iconStrokeWidth }) => {
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
      data-active-tab={activeTabId}
      inert={!navOpen ? true : undefined}
      style={
        iconStrokeWidth !== undefined
          ? ({ '--enhanced-sidebar-icon-stroke-width': iconStrokeWidth } as React.CSSProperties)
          : undefined
      }
      // The inline script may set `data-active-tab` from sessionStorage before hydration
      suppressHydrationWarning={activeTabId !== undefined ? true : undefined}
    >
      {head}
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
