/**
 * Payload v4 behavior the plugin relies on. These check Payload, not the plugin — they are
 * here so that a Payload upgrade that changes one of them fails loudly instead of quietly
 * breaking the sidebar.
 */
import type { SanitizedConfig } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { renderTabHandler } from '@payloadcms/ui/elements/Nav/SidebarTabs/renderTabServerFn'
import { buildConfig, definePlugin } from 'payload'
import React from 'react'
import { beforeAll, describe, expect, test } from 'vitest'

import type { EnhancedSidebarConfig } from '../src/types.js'

import { addSidebarTabs, payloadEnhancedSidebar } from '../src/index.js'
import { getLazyTabSlug, NATIVE_TABS_PANEL_PATH } from '../src/utils/index.js'

let config: SanitizedConfig

beforeAll(async () => {
  config = await buildConfig({
    collections: [
      {
        slug: 'users',
        auth: true,
        fields: [],
      },
      // A folders collection: Payload adds its sidebar tab during sanitization
      {
        slug: 'folders',
        fields: [{ name: 'name', type: 'text' }],
        folders: true,
      },
      {
        slug: 'stats-source',
        fields: [],
      },
    ],
    // Never connects: sanitizing the config doesn't touch the database
    db: mongooseAdapter({ url: 'mongodb://127.0.0.1:1/never-connected' }),
    plugins: [
      // Listed before the plugin that adds a tab to it: plugins run by `order` (this one 100,
      // the other the default 0), so the tab still makes it in.
      payloadEnhancedSidebar({
        tabs: [
          {
            id: 'stats',
            type: 'tab',
            contentComponent: { clientProps: { range: 7 }, path: './Stats#Stats' },
            icon: 'ChartColumn',
            label: 'Stats',
            lazy: true,
          },
        ],
      }),
      definePlugin({
        slug: 'other-plugin',
        plugin: ({ config: incoming, plugins }) => {
          addSidebarTabs(plugins, [
            { id: 'from-other-plugin', type: 'tab', icon: 'Puzzle', label: 'Other' },
          ])
          return incoming
        },
      })(),
    ],
    secret: 'test-secret',
  })
})

const sidebarTabs = () => config.admin.components?.sidebar?.tabs ?? []

describe('definePlugin', () => {
  test('another plugin adds a tab before the sidebar builds its nav, whatever the list order', () => {
    const nav = config.admin.components?.Nav as unknown as {
      serverProps: { sidebarConfig: EnhancedSidebarConfig }
    }
    expect(nav.serverProps.sidebarConfig.tabs?.map((tab) => tab.id)).toEqual([
      'stats',
      'from-other-plugin',
    ])
  })
})

describe('Payload v4 sidebar tabs', () => {
  test('hierarchy collections get a `hierarchy-<slug>` tab, added after plugins run', () => {
    // The plugin can't see this tab in its own config function — it reads the sanitized
    // config at render time instead. If Payload starts adding it earlier, that still works;
    // if it stops adding it or renames it, the Browse tab loses the folder tree.
    expect(sidebarTabs().map((tab) => tab.slug)).toContain('hierarchy-folders')
  })

  test("the plugin's lazy entries survive sanitization, still disabled", () => {
    const slugs = sidebarTabs()
      .filter((tab) => tab.disabled)
      .map((tab) => tab.slug)
    expect(slugs).toEqual(
      expect.arrayContaining([getLazyTabSlug('stats'), getLazyTabSlug('payload-tabs')]),
    )
  })

  test('a hierarchy collection is hidden from the regular nav', () => {
    const folders = config.collections.find((collection) => collection.slug === 'folders')
    expect(folders?.admin.group).toBe(false)
  })
})

describe('render-tab', () => {
  const render = (tabSlug: string, importMap: Record<string, unknown>) => {
    const req = {
      i18n: {},
      payload: { config, importMap, logger: { error: () => {} } },
      query: {},
      user: { id: 1 },
    }
    return renderTabHandler({ req, tabSlug } as unknown as Parameters<typeof renderTabHandler>[0])
  }

  test('renders a disabled tab, found by slug, with the clientProps set on its Content', async () => {
    const Stats = () => null
    const { component } = await render(getLazyTabSlug('stats'), { './Stats#Stats': Stats })

    expect(React.isValidElement(component)).toBe(true)
    const element = component as React.ReactElement<{ id: string; range: number }>
    expect(element.type).toBe(Stats)
    expect(element.props.id).toBe('stats')
    expect(element.props.range).toBe(7)
  })

  test("renders the Browse panel the plugin registers for `nativeTabs: 'group'`", async () => {
    const Panel = () => null
    const { component } = await render(getLazyTabSlug('payload-tabs'), {
      [NATIVE_TABS_PANEL_PATH]: Panel,
    })

    const element = component as React.ReactElement<{ id: string }>
    expect(element.type).toBe(Panel)
    expect(element.props.id).toBe('payload-tabs')
  })
})
