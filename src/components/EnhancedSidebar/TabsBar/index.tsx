'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { EnhancedSidebarConfig, SidebarTabContent, SidebarTabLink } from '../../../types'

import { Icon } from '../Icon'
import { SettingsMenuButton } from '../SettingsMenuButton'
import { TabButton, TabLink } from './TabItem'
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

  const renderTabItem = (item: SidebarTabContent | SidebarTabLink) => {
    if (item.type === 'tab') {
      return (
        <TabButton
          isActive={activeTabId === item.id}
          key={item.id}
          onTabChange={onTabChange}
          tab={item}
        />
      )
    }

    // Check if link is active
    const href = item.isExternal
      ? item.href
      : formatAdminURL({ adminRoute, path: item.href })
    const isActive = pathname === href || (item.href === '/' && pathname === adminRoute)

    return <TabLink href={href} isActive={isActive} key={item.id} link={item} />
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
