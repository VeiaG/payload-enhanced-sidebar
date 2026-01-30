import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { PayloadRequest, ServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { cookies } from 'next/headers'
import React from 'react'

const COOKIE_KEY = 'payload-enhanced-sidebar-active-tab'

import type { EnhancedSidebarConfig, ExtendedGroup } from '../../types'

import { getNavPrefs } from './getNavPrefs'
import { SidebarContent } from './SidebarContent'
import './index.scss'

export type EnhancedSidebarProps = {
  req?: PayloadRequest
  sidebarConfig?: EnhancedSidebarConfig
} & ServerProps

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = async (props) => {
  const {
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    sidebarConfig,
    user,
    visibleEntities,
  } = props

  if (!payload?.config) {
    return null
  }

  const {
    admin: {
      components: { afterNavLinks, beforeNavLinks, settingsMenu },
    },
    collections,
    globals,
  } = payload.config

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => visibleEntities?.collections.includes(slug))
        .map(
          (collection) =>
            ({
              type: EntityType.collection,
              entity: collection,
            }) satisfies EntityToGroup,
        ),
      ...globals
        .filter(({ slug }) => visibleEntities?.globals.includes(slug))
        .map(
          (global) =>
            ({
              type: EntityType.global,
              entity: global,
            }) satisfies EntityToGroup,
        ),
    ],
    permissions || {},
    i18n,
  ) as unknown as ExtendedGroup[]

  const navPreferences = await getNavPrefs(req)

  const serverProps = {
    i18n,
    locale,
    params,
    payload,
    permissions,
    searchParams,
    user,
  }

  const beforeNavLinksRendered = RenderServerComponent({
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const afterNavLinksRendered = RenderServerComponent({
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const renderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item, index) =>
          RenderServerComponent({
            Component: item,
            importMap: payload.importMap,
            key: `settings-menu-item-${index}`,
            serverProps,
          }),
        )
      : []

  // Default config if not provided
  const config: EnhancedSidebarConfig = sidebarConfig ?? {
    tabs: [
      {
        id: 'default',
        type: 'tab',
        icon: 'LayoutGrid',
        label: 'Collections',
      },
    ],
  }

  // Read active tab from cookie
  const cookieStore = await cookies()
  const storedTabId = cookieStore.get(COOKIE_KEY)?.value
  const tabs = config.tabs?.filter((t) => t.type === 'tab') ?? []
  const defaultTabId = tabs[0]?.id ?? 'default'
  const initialActiveTabId =
    storedTabId && tabs.some((t) => t.id === storedTabId) ? storedTabId : defaultTabId

  return (
    <SidebarContent
      afterNavLinks={afterNavLinksRendered}
      beforeNavLinks={beforeNavLinksRendered}
      groups={groups}
      initialActiveTabId={initialActiveTabId}
      navPreferences={navPreferences}
      settingsMenu={renderedSettingsMenu}
      sidebarConfig={config}
    />
  )
}

export default EnhancedSidebar
