'use client'

import { Hamburger, useNav } from '@payloadcms/ui'
import React from 'react'

export const NavHamburger: React.FC<{
  baseClass: string
}> = ({ baseClass }) => {
  const { navOpen, setNavOpen } = useNav()

  return (
    <button
      className={`${baseClass}__mobile-close`}
      onClick={() => setNavOpen(false)}
      tabIndex={navOpen ? undefined : -1}
      type="button"
    >
      <Hamburger isActive />
    </button>
  )
}
