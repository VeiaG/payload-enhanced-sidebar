import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { PayloadRequest, ServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { NavGroup } from '@payloadcms/ui'
import { EntityType, groupNavItems } from '@payloadcms/ui/shared'
import { cookies } from 'next/headers'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

const COOKIE_KEY = 'payload-enhanced-sidebar-active-tab'

import type {
  EnhancedSidebarConfig,
  ExtendedEntity,
  ExtendedGroup,
  SidebarTab,
  SidebarTabContent as SidebarTabContentType,
  SidebarTabItem,
} from '../../types'

import { extractLocalizedValue } from '../../utils'
import { getNavPrefs } from './getNavPrefs'
import { Icon } from './Icon'
import { NavItem } from './NavItem'
import { SidebarContent } from './SidebarContent'
import './index.scss'

export type EnhancedSidebarProps = {
  req?: PayloadRequest
  sidebarConfig?: EnhancedSidebarConfig
} & ServerProps

/**
 * Computes filtered and merged groups for a specific tab (server-side).
 */
const computeGroupsForTab = (
  tab: SidebarTabContentType,
  groups: ExtendedGroup[],
  currentLang: string,
): ExtendedGroup[] => {
  const { collections: tabCollections, customItems, globals: tabGlobals } = tab

  const showAll = !tabCollections && !tabGlobals
  const allowedSlugs = new Set([...(tabCollections ?? []), ...(tabGlobals ?? [])])

  let result: ExtendedGroup[] = []

  if (showAll) {
    result = groups.map((g) => ({ ...g, entities: [...g.entities] }))
  } else if (allowedSlugs.size > 0) {
    result = groups
      .map((group) => ({
        ...group,
        entities: group.entities.filter((entity) => allowedSlugs.has(entity.slug)),
      }))
      .filter((group) => group.entities.length > 0)
  }

  if (customItems && customItems.length > 0) {
    const ungroupedItems: SidebarTabItem[] = []

    for (const item of customItems) {
      if (item.group) {
        const itemGroupLabel = extractLocalizedValue(item.group, currentLang)
        const existingGroup = result.find((g) => {
          const groupLabel = extractLocalizedValue(g.label, currentLang)
          return groupLabel === itemGroupLabel
        })

        if (existingGroup) {
          existingGroup.entities.push({
            slug: item.slug,
            type: 'custom',
            href: item.href,
            isExternal: item.isExternal,
            label: item.label,
          } as ExtendedEntity)
        } else {
          result.push({
            entities: [
              {
                slug: item.slug,
                type: 'custom',
                href: item.href,
                isExternal: item.isExternal,
                label: item.label,
              } as ExtendedEntity,
            ],
            label: item.group,
          })
        }
      } else {
        ungroupedItems.push(item)
      }
    }

    if (ungroupedItems.length > 0) {
      result.push({
        entities: ungroupedItems.map((item) => ({
          slug: item.slug,
          type: 'custom',
          href: item.href,
          isExternal: item.isExternal,
          label: item.label,
        })) as ExtendedEntity[],
        label: '',
      })
    }
  }

  return result
}

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
    documentSubViewType,
    viewType,
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

  const clientProps = {
    documentSubViewType,
    viewType,
  }

  const beforeNavLinksRendered = RenderServerComponent({
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps,
    clientProps,
  })

  const afterNavLinksRendered = RenderServerComponent({
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps,
    clientProps,
  })

  const renderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item, index) =>
          RenderServerComponent({
            Component: item,
            importMap: payload.importMap,
            key: `settings-menu-item-${index}`,
            serverProps,
            clientProps,
          }),
        )
      : []

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

  const adminRoute = payload.config.routes.admin
  const currentLang = i18n.language

  /**
   * Renders a single entity as a NavItem (default or custom).
   */
  const renderEntity = (entity: ExtendedEntity, key: string): React.ReactNode => {
    const { slug, type } = entity
    let href: string
    let id: string

    if (type === 'collection') {
      href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })
      id = `nav-${slug}`
    } else if (type === 'global') {
      href = formatAdminURL({ adminRoute, path: `/globals/${slug}` })
      id = `nav-global-${slug}`
    } else if (type === 'custom' && entity.href) {
      id = `nav-custom-${slug}`
      href = entity.isExternal ? entity.href : formatAdminURL({ adminRoute, path: entity.href })
    } else {
      return null
    }

    const badgeConfig = config.badges?.[slug]

    if (config.customComponents?.NavItem) {
      const label = getTranslation(entity.label, i18n)
      return RenderServerComponent({
        Component: config.customComponents.NavItem,
        importMap: payload.importMap,
        key,
        clientProps: { entity, href, id, badgeConfig, label },
      })
    }

    return <NavItem key={key} badgeConfig={badgeConfig} entity={entity} href={href} id={id} />
  }

  /**
   * Renders a group with its entities (default NavGroup or custom).
   */
  const renderGroup = (group: ExtendedGroup, key: string): React.ReactNode => {
    const { entities, label } = group
    const isUngrouped = !label || (typeof label === 'string' && label === '')
    const translatedLabel = getTranslation(label || '', i18n)

    const items = entities.map((entity, i) => renderEntity(entity, `${key}-${i}`))

    if (isUngrouped) {
      return <Fragment key={key}>{items}</Fragment>
    }

    if (config.customComponents?.NavGroup) {
      return RenderServerComponent({
        Component: config.customComponents.NavGroup,
        importMap: payload.importMap,
        key,
        clientProps: {
          label: translatedLabel,
          isOpen: navPreferences?.groups?.[translatedLabel]?.open,
          children: items,
        },
      })
    }

    return (
      <NavGroup
        isOpen={navPreferences?.groups?.[translatedLabel]?.open}
        key={key}
        label={translatedLabel}
      >
        {items}
      </NavGroup>
    )
  }

  // Pre-render content for every tab on the server
  const tabsContent: Record<string, React.ReactNode> = {}
  for (const tab of tabs) {
    const tabGroups = computeGroupsForTab(tab, groups, currentLang)
    tabsContent[tab.id] = (
      <Fragment>{tabGroups.map((group, i) => renderGroup(group, `${tab.id}-${i}`))}</Fragment>
    )
  }

  // For the no-tabs fallback
  const allContent =
    tabs.length === 0 ? (
      <Fragment>{groups.map((group, i) => renderGroup(group, `all-${i}`))}</Fragment>
    ) : undefined

  // Build server-side icon and tab button rendering
  const allTabItems = config.tabs ?? []
  const hasCustomTabButton = !!config.customComponents?.TabButton
  const hasAnyIconComponent = allTabItems.some((t) => t.iconComponent)

  // tabIcons: per-id icon node (only built when no custom TabButton, just iconComponent overrides)
  const tabIcons: Record<string, React.ReactNode> = {}
  // renderedTabItems: fully custom tab button nodes (built when customComponents.TabButton is set)
  const renderedTabItems: React.ReactNode[] = []

  if (hasCustomTabButton || hasAnyIconComponent) {
    for (const item of allTabItems) {
      const label = getTranslation(item.label, i18n)

      // Resolve icon: custom iconComponent > default Lucide
      const iconNode: React.ReactNode = item.iconComponent
        ? RenderServerComponent({
            Component: item.iconComponent,
            importMap: payload.importMap,
            clientProps: { id: item.id, label, type: item.type },
          })
        : <Icon name={item.icon!} size={20} />

      if (hasCustomTabButton) {
        // Compute href for links
        let href: string | undefined
        if (item.type === 'link') {
          href = item.isExternal
            ? item.href
            : formatAdminURL({ adminRoute, path: item.href })
        }

        renderedTabItems.push(
          RenderServerComponent({
            Component: config.customComponents!.TabButton!,
            importMap: payload.importMap,
            key: item.id,
            clientProps: {
              badge: item.badge,
              href,
              icon: iconNode,
              id: item.id,
              isExternal: item.type === 'link' ? item.isExternal : undefined,
              label,
              type: item.type,
            },
          }),
        )
      } else if (item.iconComponent) {
        tabIcons[item.id] = iconNode
      }
    }
  }

  const customNavContent = config.customComponents?.NavContent
    ? RenderServerComponent({
        Component: config.customComponents.NavContent,
        importMap: payload.importMap,
        clientProps: {
          afterNavLinks: afterNavLinksRendered,
          allContent,
          beforeNavLinks: beforeNavLinksRendered,
          tabs: tabs.map((t) => ({ id: t.id })),
          tabsContent,
        },
      })
    : undefined

  return (
    <SidebarContent
      afterNavLinks={afterNavLinksRendered}
      allContent={allContent}
      beforeNavLinks={beforeNavLinksRendered}
      customNavContent={customNavContent}
      initialActiveTabId={initialActiveTabId}
      renderedTabItems={renderedTabItems.length > 0 ? renderedTabItems : undefined}
      settingsMenu={renderedSettingsMenu}
      sidebarConfig={config}
      tabIcons={Object.keys(tabIcons).length > 0 ? tabIcons : undefined}
      tabsContent={tabsContent}
    />
  )
}

export default EnhancedSidebar
