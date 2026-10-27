'use client'

import { useNav } from '@payloadcms/ui'
import React from 'react'

import { NavHamburger } from '../NavHamburger/index.js'
import './index.scss'

export const SidebarWrapper: React.FC<{
  /** Set as `data-active-tab` on the root (`storage: 'session'` only). */
  activeTabId?: string
  baseClass: string
  children: React.ReactNode
  /** Rendered as the root's first children — the session-tab script and styles. */
  head?: React.ReactNode
}> = ({ activeTabId, baseClass, children, head }) => {
  const { hydrated, navOpen, navRef, shouldAnimate } = useNav()

  return (
    <aside
      className={[
        baseClass,
        navOpen && `${baseClass}--nav-open`,
        shouldAnimate && `${baseClass}--nav-animate`,
        hydrated && `${baseClass}--nav-hydrated`,
      ]
        .filter(Boolean)
        .join(' ')}
      data-active-tab={activeTabId}
      inert={!navOpen ? true : undefined}
      // The inline script may set `data-active-tab` from sessionStorage before hydration
      suppressHydrationWarning={activeTabId !== undefined ? true : undefined}
    >
      {head}
      <div className={`${baseClass}__header`}>
        <NavHamburger baseClass={baseClass} />
      </div>
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
