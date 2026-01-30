'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { EnhancedSidebarConfig, SidebarTabContent, SidebarTabLink } from '../../../types'

import { Icon } from '../Icon'
import { SettingsMenuButton } from '../SettingsMenuButton'
import './index.scss'

const tabsBaseClass = 'tabs-bar'

export type TabsBarProps = {
  activeTabId: string
  onTabChange: (tabId: string) => void
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
}

export const TabsBar: React.FC<TabsBarProps> = ({
  activeTabId,
  onTabChange,
  settingsMenu,
  sidebarConfig,
}) => {
  const { i18n } = useTranslation()
  const pathname = usePathname()

  const {
    config: {
      admin: {
        routes: { browseByFolder: foldersRoute, logout: logoutRoute },
      },
      folders,
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const showLogout = sidebarConfig.showLogout !== false
  const showFolders = folders && folders.browseByFolder

  const folderURL = formatAdminURL({
    adminRoute,
    path: foldersRoute,
  })
  const isFoldersActive = pathname.startsWith(folderURL)

  const renderTab = (tab: SidebarTabContent) => {
    const label = getTranslation(tab.label, i18n)
    const isActive = activeTabId === tab.id

    return (
      <button
        className={`${tabsBaseClass}__tab ${isActive ? `${tabsBaseClass}__tab--active` : ''}`}
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        title={label}
        type="button"
      >
        <Icon name={tab.icon} size={20} />
      </button>
    )
  }

  const renderLink = (link: SidebarTabLink) => {
    const label = getTranslation(link.label, i18n)
    const href = link.isExternal ? link.href : formatAdminURL({ adminRoute, path: link.href })

    // Check if this link is active
    const isActive = pathname === href || (link.href === '/' && pathname === adminRoute)

    return (
      <Link
        className={`${tabsBaseClass}__link ${isActive ? `${tabsBaseClass}__link--active` : ''}`}
        href={href}
        key={link.id}
        target={link.isExternal ? '_blank' : undefined}
        title={label}
      >
        <Icon name={link.icon} size={20} />
      </Link>
    )
  }

  const renderTabItem = (item: SidebarTabContent | SidebarTabLink) => {
    if (item.type === 'tab') {
      return renderTab(item)
    }
    return renderLink(item)
  }

  const tabItems = sidebarConfig.tabs ?? []

  return (
    <div className={tabsBaseClass}>
      <div className={`${tabsBaseClass}__tabs`}>{tabItems.map(renderTabItem)}</div>

      <div className={`${tabsBaseClass}__actions`}>
        {showFolders && (
          <Link
            className={`${tabsBaseClass}__action ${isFoldersActive ? `${tabsBaseClass}__link--active` : ''}`}
            href={folderURL}
            title={getTranslation({ en: 'Browse by Folder', uk: 'Переглянути по папках' }, i18n)}
          >
            <Icon name="Folder" size={20} />
          </Link>
        )}
        <SettingsMenuButton settingsMenu={settingsMenu} />
        {showLogout && (
          <Link
            className={`${tabsBaseClass}__action`}
            href={formatAdminURL({
              adminRoute,
              path: logoutRoute,
            })}
            title={getTranslation({ en: 'Logout', uk: 'Вийти' }, i18n)}
            type="button"
          >
            <Icon name="LogOut" size={20} />
          </Link>
        )}
      </div>
    </div>
  )
}
