'use client'

import { useNav } from '@payloadcms/ui'
import React from 'react'

import { NavHamburger } from '../NavHamburger'
import './index.scss'

export const SidebarWrapper: React.FC<{
  baseClass: string
  children: React.ReactNode
}> = ({ baseClass, children }) => {
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
      inert={!navOpen ? true : undefined}
    >
      <div className={`${baseClass}__header`}>
        <NavHamburger baseClass={baseClass} />
      </div>
      <div className={`${baseClass}__scroll`} ref={navRef}>
        {children}
      </div>
    </aside>
  )
}
