import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { PayloadRequest, ServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import React from 'react'

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
      components: { afterNavLinks, beforeNavLinks },
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

  return (
    <SidebarContent
      afterNavLinks={afterNavLinksRendered}
      beforeNavLinks={beforeNavLinksRendered}
      groups={groups}
      navPreferences={navPreferences}
      sidebarConfig={config}
    />
  )
}

export default EnhancedSidebar
