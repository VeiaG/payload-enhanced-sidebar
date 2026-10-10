import type { PayloadRequest, ServerProps } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { SidebarTabsClient } from '@payloadcms/ui'
import { getNavPrefs } from '@payloadcms/ui/elements/Nav/getNavPrefs'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import { LAZY_TAB_SLUG_PREFIX } from '../../../utils/index.js'
import { NavContentShell } from '../NavContent/index.js'

export type NativeTabsPanelProps = {
  /** Plugin tab id, passed as a client prop */
  id?: string
  req?: PayloadRequest
} & Partial<ServerProps>

/**
 * Content of the `nativeTabs: 'group'` tab: Payload's own sidebar tabs (folder/tag trees,
 * project tabs, other plugins' tabs) behind Payload's own tab switcher. Mirrors Payload's
 * server `SidebarTabs`, which isn't exported: it renders the active tab's content and hands the
 * rest to `SidebarTabsClient`, which lazy-loads them through `render-tab` and remembers the
 * active one in preferences — the same preference Payload's nav uses.
 */
export const NativeTabsPanel = async (props: NativeTabsPanelProps) => {
  const { i18n, locale, params, payload, permissions, req, searchParams, user } = props

  if (!payload || !i18n) {
    return null
  }

  // The plugin's own registrations (lazy tabs, this panel) are disabled entries; Payload's
  // collections tab isn't in the config at all — its nav adds it while rendering.
  const tabs = (payload.config.admin.components?.sidebar?.tabs ?? []).filter(
    (tab) => !tab.disabled && !tab.slug.startsWith(LAZY_TAB_SLUG_PREFIX),
  )

  if (tabs.length === 0) {
    return null
  }

  const navPreferences = req ? await getNavPrefs(req) : undefined
  const activeTab =
    tabs.find((tab) => tab.slug === navPreferences?.activeTab) ??
    tabs.find((tab) => tab.isDefaultActive) ??
    tabs[0]

  const serverProps = { i18n, locale, params, payload, permissions, req, searchParams, user }

  return (
    <NavContentShell>
      <SidebarTabsClient
        baseClass="sidebar-tabs"
        initialActiveTabID={activeTab.slug}
        initialTabContents={{
          [activeTab.slug]: RenderServerComponent({
            Component: activeTab.components.Content,
            importMap: payload.importMap,
            serverProps,
          }),
        }}
        tabs={tabs.map((tab) => ({
          slug: tab.slug,
          icon: RenderServerComponent({
            Component: tab.components.Icon,
            importMap: payload.importMap,
            serverProps,
          }),
          isDefaultActive: tab.isDefaultActive,
          label: tab.label ? getTranslation(tab.label, i18n) : tab.slug,
          lazyLoadable: true,
        }))}
      />
    </NavContentShell>
  )
}
