'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { EnhancedSidebarConfig, SidebarTab } from '../../../types.js'

import { Icon } from '../Icon.js'
import { SettingsMenuButton } from '../SettingsMenuButton/index.js'
import { TabButton, TabLink } from './TabItem.js'
import './index.scss'

const tabsBaseClass = 'tabs-bar'

export type TabsBarProps = {
  activeTabId: string
  customTabComponents?: Record<string, React.ReactNode>
  onTabChange: (tabId: string) => void
  renderedTabItems?: React.ReactNode[]
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  tabIcons?: Record<string, React.ReactNode>
}

export const TabsBar: React.FC<TabsBarProps> = ({
  activeTabId,
  customTabComponents,
  onTabChange,
  renderedTabItems,
  settingsMenu,
  sidebarConfig,
  tabIcons,
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

  const renderTabItem = (item: SidebarTab) => {
    if (item.type === 'custom') {
      return customTabComponents?.[item.id] ?? null
    }

    if (item.type === 'tab') {
      return (
        <TabButton
          icon={tabIcons?.[item.id]}
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

    return <TabLink href={href} icon={tabIcons?.[item.id]} isActive={isActive} key={item.id} link={item} />
  }

  const tabItems = sidebarConfig.tabs ?? []

  // `renderedTabItems` (set when a custom TabButton is used) is built server-side in the
  // same order as `tabItems`, so we can zip by index. Otherwise we render the default item.
  const topNodes: React.ReactNode[] = []
  const bottomNodes: React.ReactNode[] = []
  tabItems.forEach((item, index) => {
    const node = renderedTabItems ? renderedTabItems[index] : renderTabItem(item)
    const wrapped = <React.Fragment key={item.id}>{node}</React.Fragment>
    if (item.position === 'bottom') {
      bottomNodes.push(wrapped)
    } else {
      topNodes.push(wrapped)
    }
  })

  return (
    <div className={tabsBaseClass}>
      <div className={`${tabsBaseClass}__tabs`}>{topNodes}</div>

      <div className={`${tabsBaseClass}__bottom`}>
        {bottomNodes.length > 0 && (
          <div className={`${tabsBaseClass}__tabs-bottom`}>{bottomNodes}</div>
        )}

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
    </div>
  )
}
