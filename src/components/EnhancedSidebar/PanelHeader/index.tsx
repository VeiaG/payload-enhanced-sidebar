'use client'

import { getTranslation } from '@payloadcms/translations'
import { Button, useNav, useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { SidebarTab } from '../../../types.js'

import { useEnhancedSidebar } from '../context.js'

const baseClass = 'enhanced-sidebar'

/** Payload's `SidebarIcon` (16×12), which `@payloadcms/ui` doesn't export */
const SidebarIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    className="icon icon--sidebar"
    fill="none"
    focusable="false"
    height={12}
    viewBox="0 0 16 12"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M14 0C15.1046 0 16 0.895431 16 2V10L15.9893 10.2041C15.887 11.2128 15.0357 12 14 12H2C0.964349 12 0.113005 11.2128 0.0107422 10.2041L0 10V2C1.28853e-07 0.895431 0.895431 0 2 0H14ZM2 1C1.44772 1 1 1.44772 1 2V10C1 10.5523 1.44772 11 2 11H5V1H2ZM14 11C14.5523 11 15 10.5523 15 10V2C15 1.44772 14.5523 1 14 1H6V11H14Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
)

/**
 * Top of the panel: the open tab's name and the button that hides the sidebar. The button is
 * built exactly like the one that opens it in Payload's app header (`Button` ghost +
 * `.app-header__sidebar-toggle` + the sidebar icon), so open and close look the same.
 */
export const PanelHeader: React.FC<{ tabs: SidebarTab[] }> = ({ tabs }) => {
  const { activeTabId } = useEnhancedSidebar()
  const { navOpen, setNavOpen } = useNav()
  const { i18n, t } = useTranslation()

  const activeTab = tabs.find((tab) => tab.type === 'tab' && tab.id === activeTabId)
  const title =
    activeTab && activeTab.type !== 'custom' ? getTranslation(activeTab.label, i18n) : ''

  return (
    <div className={`${baseClass}__panel-header`}>
      <span className={`${baseClass}__panel-title`}>{title}</span>
      <Button
        aria-expanded={navOpen}
        aria-label={t('general:hideSidebar')}
        buttonStyle="ghost"
        className="app-header__sidebar-toggle"
        icon={<SidebarIcon />}
        // Second argument persists the closed state, like Payload's own toggles
        onClick={() => setNavOpen(false, true)}
        type="button"
      />
    </div>
  )
}
