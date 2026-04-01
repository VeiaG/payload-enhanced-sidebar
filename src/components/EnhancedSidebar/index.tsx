import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { PayloadRequest, ServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { NavGroup } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
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

import { extractLocalizedValue, resolveSidebarComponent, sanitizeSidebarConfig } from '../../utils'
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
const computeGroupsForTab = async (
  tab: SidebarTabContentType,
  groups: ExtendedGroup[],
  currentLang: string,
  req: PayloadRequest | undefined,
): Promise<ExtendedGroup[]> => {
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
    const topAdditions: ExtendedGroup[] = []
    const topUngrouped: SidebarTabItem[] = []
    const bottomUngrouped: SidebarTabItem[] = []

    const toEntity = (item: SidebarTabItem): ExtendedEntity =>
      ({
        slug: item.slug,
        type: 'custom',
        href: item.href,
        isExternal: item.isExternal,
        label: item.label,
      }) as ExtendedEntity

    // Filter custom items by access — fail-closed: missing req or thrown error denies access
    const accessResults = await Promise.all(
      customItems.map((item) =>
        Promise.resolve()
          .then(() => (item.access ? (req ? item.access({ item, req }) : false) : true))
          .catch(() => false),
      ),
    )
    const visibleItems = customItems.filter((_, i) => accessResults[i])

    for (const item of visibleItems) {
      if (item.group) {
        const itemGroupLabel = extractLocalizedValue(item.group, currentLang)
        const existingGroup = result.find((g) => {
          const groupLabel = extractLocalizedValue(g.label, currentLang)
          return groupLabel === itemGroupLabel
        })

        if (existingGroup) {
          // Merged into existing collection group — position has no effect here
          existingGroup.entities.push(toEntity(item))
        } else {
          // New custom group — position controls top vs bottom
          const newGroup: ExtendedGroup = { entities: [toEntity(item)], label: item.group }
          if (item.position === 'top') {
            topAdditions.push(newGroup)
          } else {
            result.push(newGroup)
          }
        }
      } else {
        if (item.position === 'top') {
          topUngrouped.push(item)
        } else {
          bottomUngrouped.push(item)
        }
      }
    }

    if (topUngrouped.length > 0) {
      topAdditions.unshift({ entities: topUngrouped.map(toEntity), label: '' })
    }

    if (bottomUngrouped.length > 0) {
      result.push({ entities: bottomUngrouped.map(toEntity), label: '' })
    }

    result = [...topAdditions, ...result]
  }

  return result
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = async (props) => {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    sidebarConfig,
    user,
    viewType,
    visibleEntities,
  } = props

  if (!payload?.config) {
    return null
  }

  const {
    admin: {
      components: { afterNav, afterNavLinks, beforeNav, beforeNavLinks, settingsMenu },
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

  const beforeNavRendered = RenderServerComponent({
    clientProps,
    Component: beforeNav,
    importMap: payload.importMap,
    serverProps,
  })

  const beforeNavLinksRendered = RenderServerComponent({
    clientProps,
    Component: beforeNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const afterNavLinksRendered = RenderServerComponent({
    clientProps,
    Component: afterNavLinks,
    importMap: payload.importMap,
    serverProps,
  })

  const afterNavRendered = RenderServerComponent({
    clientProps,
    Component: afterNav,
    importMap: payload.importMap,
    serverProps,
  })

  const renderedSettingsMenu =
    settingsMenu && Array.isArray(settingsMenu)
      ? settingsMenu.map((item, index) =>
          RenderServerComponent({
            clientProps,
            Component: item,
            importMap: payload.importMap,
            key: `settings-menu-item-${index}`,
            serverProps,
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

  // Filter all tab bar items by access — fail-closed: missing req denies access
  // Note: req can be undefined on 404 pages due to a Payload bug (NotFound view omits req from props)
  const allConfigTabs = config.tabs ?? []
  const tabAccessResults = await Promise.all(
    allConfigTabs.map((t) =>
      Promise.resolve()
        .then(() => (t.access ? (req ? t.access({ item: t, req }) : false) : true))
        .catch(() => false),
    ),
  )
  const visibleTabItems = allConfigTabs.filter((_, i) => tabAccessResults[i])

  // Read active tab from cookie
  const cookieStore = await cookies()
  const storedTabId = cookieStore.get(COOKIE_KEY)?.value
  const tabs = visibleTabItems.filter((t) => t.type === 'tab') as SidebarTabContentType[]
  const defaultTabId = tabs[0]?.id ?? ''
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

    if (type === EntityType.collection) {
      href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })
      id = `nav-${slug}`
    } else if (type === EntityType.global) {
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
      const { clientProps: extraProps, path } = resolveSidebarComponent(
        config.customComponents.NavItem,
      )
      return RenderServerComponent({
        clientProps: { id, badgeConfig, entity, href, label, ...extraProps },
        Component: path,
        importMap: payload.importMap,
        key,
        serverProps,
      })
    }

    return <NavItem badgeConfig={badgeConfig} entity={entity} href={href} id={id} key={key} />
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
      const { clientProps: extraProps, path } = resolveSidebarComponent(
        config.customComponents.NavGroup,
      )
      return RenderServerComponent({
        clientProps: {
          children: items,
          isOpen: navPreferences?.groups?.[translatedLabel]?.open,
          label: translatedLabel,
          ...extraProps,
        },
        Component: path,
        importMap: payload.importMap,
        key,
        serverProps,
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

  // Pre-render content for every tab on the server (computed in parallel)
  const tabGroupResults = await Promise.all(
    tabs.map((tab) => computeGroupsForTab(tab, groups, currentLang, req)),
  )
  const tabsContent: Record<string, React.ReactNode> = {}
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const tabGroups = tabGroupResults[i]
    tabsContent[tab.id] = (
      <Fragment>{tabGroups.map((group, j) => renderGroup(group, `${tab.id}-${j}`))}</Fragment>
    )
  }

  // For the no-tabs fallback — only show all content when the config has no tab-type items at all.
  // If tabs exist but are all hidden by access control, show nothing instead of the full nav.
  const configuredTabsCount = (config.tabs ?? []).filter((t) => t.type === 'tab').length
  const allContent =
    configuredTabsCount === 0 ? (
      <Fragment>{groups.map((group, i) => renderGroup(group, `all-${i}`))}</Fragment>
    ) : undefined

  // Build server-side icon and tab button rendering
  const allTabItems = visibleTabItems
  const hasCustomTabButton = !!config.customComponents?.TabButton
  const hasAnyIconComponent = allTabItems.some((t) => t.type !== 'custom' && t.iconComponent)

  // tabIcons: per-id icon node (only built when no custom TabButton, just iconComponent overrides)
  const tabIcons: Record<string, React.ReactNode> = {}
  // renderedTabItems: fully custom tab button nodes (built when customComponents.TabButton is set)
  const renderedTabItems: React.ReactNode[] = []
  // customTabComponents: server-rendered components for type:'custom' tab bar slots
  const customTabComponents: Record<string, React.ReactNode> = {}

  // Pre-render all type:'custom' items
  for (const item of allTabItems) {
    if (item.type === 'custom') {
      const { clientProps: extraProps, path } = resolveSidebarComponent(item.component)
      customTabComponents[item.id] = RenderServerComponent({
        clientProps: { id: item.id, ...extraProps },
        Component: path,
        importMap: payload.importMap,
        key: item.id,
        serverProps,
      })
    }
  }

  if (hasCustomTabButton || hasAnyIconComponent) {
    for (const item of allTabItems) {
      if (item.type === 'custom') {
        // Include pre-rendered custom slot in renderedTabItems when using custom TabButton
        if (hasCustomTabButton) {
          renderedTabItems.push(customTabComponents[item.id])
        }
        continue
      }

      const label = getTranslation(item.label, i18n)

      // Resolve icon: custom iconComponent > default Lucide
      let iconNode: React.ReactNode
      if (item.iconComponent) {
        const { clientProps: iconExtraProps, path: iconPath } = resolveSidebarComponent(
          item.iconComponent,
        )
        iconNode = RenderServerComponent({
          clientProps: { id: item.id, type: item.type, label, ...iconExtraProps },
          Component: iconPath,
          importMap: payload.importMap,
          serverProps,
        })
      } else {
        iconNode = item.icon ? <Icon name={item.icon} size={20} /> : null
      }

      if (hasCustomTabButton) {
        // Compute href for links
        let href: string | undefined
        if (item.type === 'link') {
          href = item.isExternal ? item.href : formatAdminURL({ adminRoute, path: item.href })
        }

        const { clientProps: tabBtnExtraProps, path: tabBtnPath } = resolveSidebarComponent(
          config.customComponents!.TabButton!,
        )
        renderedTabItems.push(
          RenderServerComponent({
            clientProps: {
              id: item.id,
              type: item.type,
              badge: item.badge,
              href,
              icon: iconNode,
              isExternal: item.type === 'link' ? item.isExternal : undefined,
              label,
              ...tabBtnExtraProps,
            },
            Component: tabBtnPath,
            importMap: payload.importMap,
            key: item.id,
            serverProps,
          }),
        )
      } else if (item.iconComponent) {
        tabIcons[item.id] = iconNode
      }
    }
  }

  const customNavContent = config.customComponents?.NavContent
    ? (() => {
        const { clientProps: extraProps, path } = resolveSidebarComponent(
          config.customComponents.NavContent,
        )
        return RenderServerComponent({
          clientProps: {
            afterNav: afterNavRendered,
            afterNavLinks: afterNavLinksRendered,
            allContent,
            beforeNav: beforeNavRendered,
            beforeNavLinks: beforeNavLinksRendered,
            tabs: tabs.map((t) => ({ id: t.id })),
            tabsContent,
            ...extraProps,
          },
          Component: path,
          importMap: payload.importMap,
          key: 'enhanced-sidebar-nav-content',
          serverProps,
        })
      })()
    : undefined

  // Strip access functions and use only visible tabs before passing to client component
  const clientSidebarConfig = sanitizeSidebarConfig({ ...config, tabs: visibleTabItems })

  return (
    <SidebarContent
      afterNav={afterNavRendered}
      afterNavLinks={afterNavLinksRendered}
      allContent={allContent}
      beforeNav={beforeNavRendered}
      beforeNavLinks={beforeNavLinksRendered}
      customNavContent={customNavContent}
      customTabComponents={Object.keys(customTabComponents).length > 0 ? customTabComponents : undefined}
      initialActiveTabId={initialActiveTabId}
      renderedTabItems={renderedTabItems.length > 0 ? renderedTabItems : undefined}
      settingsMenu={renderedSettingsMenu}
      sidebarConfig={clientSidebarConfig}
      tabIcons={Object.keys(tabIcons).length > 0 ? tabIcons : undefined}
      tabsContent={tabsContent}
    />
  )
}

export default EnhancedSidebar
