'use client'

import { useNav } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

export const SidebarWrapper: React.FC<{
  baseClass: string
  children: React.ReactNode
}> = ({ baseClass, children }) => {
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
    >
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
