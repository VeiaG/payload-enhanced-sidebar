'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { Folder, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { EnhancedSidebarConfig, SidebarTab } from '../../../types.js'

import { SettingsMenuButton } from '../SettingsMenuButton/index.js'
import { TabButton } from './TabItem.js'
import './index.scss'

const tabsBaseClass = 'tabs-bar'

export type TabsBarProps = {
  customTabComponents?: Record<string, React.ReactNode>
  settingsMenu?: React.ReactNode[]
  sidebarConfig: EnhancedSidebarConfig
  /** Server-rendered custom buttons, keyed by item id (buttonComponent or global TabButton) */
  tabButtons?: Record<string, React.ReactNode>
  tabIcons?: Record<string, React.ReactNode>
}

export const TabsBar: React.FC<TabsBarProps> = ({
  customTabComponents,
  settingsMenu,
  sidebarConfig,
  tabButtons,
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

    // `href` is required on links and optional on tabs (a tab with an href both
    // navigates and opens its panel).
    let href: string | undefined
    let isCurrentPage: boolean | undefined
    if (item.href !== undefined) {
      href = item.isExternal ? item.href : formatAdminURL({ adminRoute, path: item.href })
      isCurrentPage = pathname === href || (item.href === '/' && pathname === adminRoute)
    }

    return (
      <TabButton
        badge={item.badge}
        href={href}
        icon={tabIcons?.[item.id]}
        id={item.id}
        isCurrentPage={isCurrentPage}
        isExternal={item.isExternal}
        key={item.id}
        label={getTranslation(item.label, i18n)}
        type={item.type}
      />
    )
  }

  const tabItems = sidebarConfig.tabs ?? []

  // Items with a custom button (per-item `buttonComponent` or global `TabButton`) are
  // rendered server-side into `tabButtons`; everything else gets the default rendering.
  const topNodes: React.ReactNode[] = []
  const bottomNodes: React.ReactNode[] = []
  tabItems.forEach((item) => {
    const node = tabButtons?.[item.id] ?? renderTabItem(item)
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
            <Folder size={20} />
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
            <LogOut size={20} />
          </Link>
        )}
        </div>
      </div>
    </div>
  )
}
