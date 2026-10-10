import type { EntityToGroup } from '@payloadcms/ui/shared'
import type { PayloadRequest, ServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { NavGroup, PayloadIcon } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { groupNavItems } from '@payloadcms/ui/shared'
import { EntityType } from 'payload'
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
} from '../../types.js'

import {
  extractLocalizedValue,
  getLazyTabSlug,
  LAZY_TAB_SLUG_PREFIX,
  NATIVE_TABS_PANEL_PATH,
  resolveLogoConfig,
  resolveNativeTabsConfig,
  resolveSidebarComponent,
  sanitizeSidebarConfig,
  sortTabGroups,
} from '../../utils/index.js'
import { getNavPrefs } from './getNavPrefs.js'
import { Icon } from './Icon.js'
import { LazyTabView } from './LazyTabView/index.js'
import { NavItem } from './NavItem/index.js'
import { RailUserMenu, type RailUserMenuProps } from './RailUserMenu/index.js'
import { SidebarContent } from './SidebarContent.js'
import './index.css'

export type EnhancedSidebarProps = {
  /** Passed by Payload to the Nav: the configured `admin.avatar` component, rendered */
  CustomAvatar?: React.ReactNode
  /** Passed by Payload to the Nav: the configured `admin.components.logout.Button`, rendered */
  CustomLogoutButton?: React.ReactNode
  req?: PayloadRequest
  /** Passed by Payload to the Nav: `admin.components.userMenuSettingsItems`, rendered */
  settingsItemGroups?: RailUserMenuProps['settingsItemGroups']
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

  // A tab with its own contentComponent opts out of the "show everything" fallback —
  // its `content` prop only holds what the tab explicitly lists.
  const showAll = !tabCollections && !tabGlobals && !tab.contentComponent
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

    const toEntity = (item: SidebarTabItem): ExtendedEntity => {
      if ('component' in item && item.component) {
        return {
          slug: item.slug,
          type: 'custom-component',
          component: item.component,
          label: item.label ?? item.slug,
        }
      }
      return {
        slug: item.slug,
        type: 'custom',
        href: item.href,
        isExternal: item.isExternal,
        label: item.label,
      } as ExtendedEntity
    }

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
    CustomAvatar,
    CustomLogoutButton,
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    server,
    settingsItemGroups,
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

  // Brand icon at the top of the rail: the configured component, else the project's
  // `graphics.Icon` (which Payload v4 no longer shows in the admin), else the Payload icon
  const logoConfig = resolveLogoConfig(sidebarConfig?.logo)
  let logo: React.ReactNode
  if (logoConfig) {
    const logoComponent = logoConfig.component
      ? resolveSidebarComponent(logoConfig.component)
      : undefined
    logo = (
      <span
        className={`tabs-bar__logo-tile tabs-bar__logo-tile--${logoConfig.container}`}
      >
        {RenderServerComponent({
          clientProps: logoComponent?.clientProps,
          Component: logoComponent?.path ?? payload.config.admin.components?.graphics?.Icon,
          Fallback: PayloadIcon,
          importMap: payload.importMap,
          serverProps,
        })}
      </span>
    )
  }

  // Payload v4 renders the account menu in its nav; replacing the nav means rendering it here
  const userMenu =
    sidebarConfig?.userMenu === false ? undefined : (
      <RailUserMenu
        CustomAvatar={CustomAvatar}
        CustomLogoutButton={CustomLogoutButton}
        settingsItemGroups={settingsItemGroups}
      />
    )

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

  // Payload's own sidebar tabs (`admin.components.sidebar.tabs`), read from the sanitized config
  // so they include the folder/tag tree tabs Payload adds during sanitization. Skips disabled
  // ones, the entries this plugin registers for its lazy tabs, and slugs that clash with ours.
  const nativeTabsMode = resolveNativeTabsConfig(config.nativeTabs)
  const ownTabIds = new Set((config.tabs ?? []).map((t) => t.id))
  const nativeTabConfigs = nativeTabsMode
    ? (payload.config.admin.components?.sidebar?.tabs ?? []).filter(
        (tab) =>
          !tab.disabled && !tab.slug.startsWith(LAZY_TAB_SLUG_PREFIX) && !ownTabIds.has(tab.slug),
      )
    : []

  // 'map': each native tab is its own item in the tabs bar
  const nativeTabsBySlug = new Map(
    nativeTabsMode?.mode === 'map' ? nativeTabConfigs.map((tab) => [tab.slug, tab]) : [],
  )
  const nativeTabItems = [...nativeTabsBySlug.values()].map(
    (tab) =>
      ({
        id: tab.slug,
        type: 'tab',
        label: getTranslation(tab.label ?? tab.slug, i18n),
      }) as SidebarTabContentType,
  )

  // 'group': one plugin tab holding them all, behind Payload's own switcher. A lazy tab like
  // any other — registered for `render-tab` by the plugin — and only there if there is
  // something to hold.
  if (nativeTabsMode?.mode === 'group' && nativeTabConfigs.length > 0) {
    nativeTabItems.push({
      id: nativeTabsMode.id,
      type: 'tab',
      contentComponent: NATIVE_TABS_PANEL_PATH,
      label: nativeTabsMode.label,
      lazy: true,
      position: nativeTabsMode.position,
      ...(nativeTabsMode.iconComponent
        ? { iconComponent: nativeTabsMode.iconComponent }
        : { icon: nativeTabsMode.icon ?? 'FolderTree' }),
    } as SidebarTabContentType)
  }

  // Filter all tab bar items by access — fail-closed: missing req denies access
  // Note: req can be undefined on 404 pages due to a Payload bug (NotFound view omits req from props)
  const allConfigTabs = [...(config.tabs ?? []), ...nativeTabItems]
  const tabAccessResults = await Promise.all(
    allConfigTabs.map((t) =>
      Promise.resolve()
        .then(() => (t.access ? (req ? t.access({ item: t, req }) : false) : true))
        .catch(() => false),
    ),
  )
  const visibleTabItems = allConfigTabs.filter((_, i) => tabAccessResults[i])

  // Read active tab from cookie, through the v4 framework-agnostic server adapter
  const cookieStore = await (server ?? req?.server)?.getCookies()
  const storedTabId = cookieStore?.get(COOKIE_KEY)?.value
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

    // Per-item custom component — render its own component, bypassing the NavItem override.
    if (type === 'custom-component') {
      const { clientProps: extraProps, path } = resolveSidebarComponent(entity.component)
      return RenderServerComponent({
        clientProps: { slug, ...extraProps },
        Component: path,
        importMap: payload.importMap,
        key,
        serverProps,
      })
    }

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

  // Lazy tabs (native ones, and ours with `lazy`) render through `render-tab` instead
  const isLazyTab = (tab: SidebarTabContentType) =>
    nativeTabsBySlug.has(tab.id) || Boolean(tab.contentComponent && tab.lazy)

  // Pre-render content for every tab on the server (computed in parallel)
  const tabGroupResults = await Promise.all(
    tabs.map((tab) =>
      isLazyTab(tab) ? Promise.resolve([]) : computeGroupsForTab(tab, groups, currentLang, req),
    ),
  )
  const tabsContent: Record<string, React.ReactNode> = {}
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i]
    const tabGroups = sortTabGroups(tabGroupResults[i], config.sort?.[tab.id], currentLang)
    tabsContent[tab.id] = (
      <Fragment>{tabGroups.map((group, j) => renderGroup(group, `${tab.id}-${j}`))}</Fragment>
    )
  }

  // Per-tab contentComponent views — replace the whole nav area while their tab is active
  const tabViews: Record<string, React.ReactNode> = {}
  for (const tab of tabs) {
    const isInitiallyActive = tab.id === initialActiveTabId

    const nativeTab = nativeTabsBySlug.get(tab.id)
    if (nativeTab) {
      tabViews[tab.id] = (
        <LazyTabView
          id={tab.id}
          // Like Payload's own nav: the tab open on load is rendered right away
          initialContent={
            isInitiallyActive
              ? RenderServerComponent({
                  clientProps,
                  Component: nativeTab.components.Content,
                  importMap: payload.importMap,
                  serverProps: { ...serverProps, req },
                })
              : undefined
          }
          key={`tab-view-${tab.id}`}
          renderSlug={tab.id}
          withShell
        />
      )
      continue
    }

    if (!tab.contentComponent) {
      continue
    }
    const { clientProps: extraProps, path } = resolveSidebarComponent(tab.contentComponent)

    if (tab.lazy) {
      tabViews[tab.id] = (
        <LazyTabView
          id={tab.id}
          initialContent={
            isInitiallyActive
              ? RenderServerComponent({
                  clientProps: { id: tab.id, ...extraProps },
                  Component: path,
                  importMap: payload.importMap,
                  serverProps: { ...serverProps, req },
                })
              : undefined
          }
          key={`tab-view-${tab.id}`}
          renderSlug={getLazyTabSlug(tab.id)}
        />
      )
      continue
    }

    tabViews[tab.id] = RenderServerComponent({
      clientProps: { id: tab.id, content: tabsContent[tab.id], ...extraProps },
      Component: path,
      importMap: payload.importMap,
      key: `tab-view-${tab.id}`,
      serverProps,
    })
  }
  const hasTabViews = Object.keys(tabViews).length > 0

  // For the no-tabs fallback — only show all content when the config has no tab-type items at all.
  // If tabs exist but are all hidden by access control, show nothing instead of the full nav.
  const configuredTabsCount = (config.tabs ?? []).filter((t) => t.type === 'tab').length
  const allContent =
    configuredTabsCount === 0 ? (
      <Fragment>{groups.map((group, i) => renderGroup(group, `all-${i}`))}</Fragment>
    ) : undefined

  // Build server-side icon and tab button rendering
  const allTabItems = visibleTabItems
  const globalTabButton = config.customComponents?.TabButton

  // tabIcons: per-id server-rendered icon node for the default buttons
  const tabIcons: Record<string, React.ReactNode> = {}
  // tabButtons: per-id custom button nodes — from an item's buttonComponent or the global TabButton
  const tabButtons: Record<string, React.ReactNode> = {}
  // customTabComponents: server-rendered components for type:'custom' tab bar slots
  const customTabComponents: Record<string, React.ReactNode> = {}

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
      continue
    }

    // Per-item buttonComponent takes precedence over the global TabButton
    const buttonComponent = item.buttonComponent ?? globalTabButton

    const label = getTranslation(item.label, i18n)

    // Resolve icon: custom iconComponent > default Lucide. Always rendered here on the
    // server, so the Lucide icon map never reaches the client bundle — only the SVG does.
    let iconNode: React.ReactNode
    const nativeTab = nativeTabsBySlug.get(item.id)
    if (nativeTab) {
      // Payload's own icon component, rendered as Payload's nav does
      iconNode = RenderServerComponent({
        Component: nativeTab.components.Icon,
        importMap: payload.importMap,
        serverProps,
      })
    } else if (item.iconComponent) {
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

    if (!buttonComponent) {
      tabIcons[item.id] = iconNode
      continue
    }

    // Compute href — required on links, optional on tabs (a tab with an href
    // both navigates and opens its panel).
    let href: string | undefined
    if (item.href !== undefined) {
      href = item.isExternal ? item.href : formatAdminURL({ adminRoute, path: item.href })
    }

    const { clientProps: tabBtnExtraProps, path: tabBtnPath } =
      resolveSidebarComponent(buttonComponent)
    tabButtons[item.id] = RenderServerComponent({
      clientProps: {
        id: item.id,
        type: item.type,
        badge: item.badge,
        href,
        icon: iconNode,
        isExternal: item.isExternal,
        label,
        ...tabBtnExtraProps,
      },
      Component: tabBtnPath,
      importMap: payload.importMap,
      key: item.id,
      serverProps,
    })
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
            tabViews: hasTabViews ? tabViews : undefined,
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
      customTabComponents={
        Object.keys(customTabComponents).length > 0 ? customTabComponents : undefined
      }
      initialActiveTabId={initialActiveTabId}
      logo={logo}
      settingsMenu={renderedSettingsMenu}
      sidebarConfig={clientSidebarConfig}
      tabButtons={Object.keys(tabButtons).length > 0 ? tabButtons : undefined}
      tabIcons={Object.keys(tabIcons).length > 0 ? tabIcons : undefined}
      tabsContent={tabsContent}
      tabViews={hasTabViews ? tabViews : undefined}
      userMenu={userMenu}
    />
  )
}

export default EnhancedSidebar
