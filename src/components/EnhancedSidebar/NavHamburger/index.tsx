'use client'

import { SidebarToggle, useNav, useTranslation } from '@payloadcms/ui'
import React from 'react'

/**
 * Closes the sidebar. In v4 the app header only has the button that opens it (hidden while the
 * nav is open), and closing lives in the nav itself, so a custom nav has to render its own.
 * Mirrors Payload's `NavSidebarToggle`.
 */
export const NavHamburger: React.FC<{
  baseClass: string
}> = ({ baseClass }) => {
  const { navOpen, setNavOpen } = useNav()
  const { t } = useTranslation()

  return (
    <button
      aria-expanded={navOpen}
      aria-label={t('general:hideSidebar')}
      className={`${baseClass}__close`}
      // Second argument persists the closed state to preferences, like the native toggle
      onClick={() => setNavOpen(false, true)}
      tabIndex={navOpen ? undefined : -1}
      type="button"
    >
      <SidebarToggle isActive />
    </button>
  )
}
