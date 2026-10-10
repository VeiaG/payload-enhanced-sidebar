import type { Config, PluginsMap } from 'payload'

import { describe, expect, test } from 'vitest'

import type { EnhancedSidebarConfig } from '../src/types.js'

import { addSidebarTabs, ENHANCED_SIDEBAR_SLUG, payloadEnhancedSidebar } from '../src/index.js'
import { getLazyTabSlug, NATIVE_TABS_PANEL_PATH } from '../src/utils/index.js'

const run = (options?: EnhancedSidebarConfig, config: Partial<Config> = {}) =>
  payloadEnhancedSidebar(options)({ collections: [], ...config } as Config)

const sidebarTabs = (config: Config) => config.admin?.components?.sidebar?.tabs ?? []

describe('definePlugin metadata', () => {
  test('has a slug, a late order and options, even when called without any', () => {
    const plugin = payloadEnhancedSidebar()
    expect(plugin.slug).toBe(ENHANCED_SIDEBAR_SLUG)
    expect(plugin.order).toBe(100)
    expect(plugin.options).toEqual({})
  })
})

describe('addSidebarTabs', () => {
  const myTab = { id: 'mine', type: 'tab' as const, icon: 'Puzzle' as const, label: 'Mine' }
  const mapWith = (options: object) =>
    ({ [ENHANCED_SIDEBAR_SLUG]: { options } }) as unknown as PluginsMap

  test('adds after the default tabs when the project set none', () => {
    const plugins = mapWith({})
    expect(addSidebarTabs(plugins, [myTab])).toBe(true)
    expect(plugins[ENHANCED_SIDEBAR_SLUG]?.options.tabs?.map((t) => t.id)).toEqual([
      'dashboard',
      'default',
      'mine',
    ])
  })

  test("adds after the project's own tabs", () => {
    const plugins = mapWith({ tabs: [{ ...myTab, id: 'own' }] })
    addSidebarTabs(plugins, [myTab])
    expect(plugins[ENHANCED_SIDEBAR_SLUG]?.options.tabs?.map((t) => t.id)).toEqual(['own', 'mine'])
  })

  test('returns false without the sidebar plugin', () => {
    expect(addSidebarTabs({} as PluginsMap, [myTab])).toBe(false)
  })
})

describe('payloadEnhancedSidebar', () => {
  test('replaces the nav and passes the sidebar config to it', () => {
    const config = run({ showLogout: true })
    const nav = config.admin?.components?.Nav as {
      path: string
      serverProps: { sidebarConfig: EnhancedSidebarConfig }
    }

    expect(nav.path).toBe('@veiag/payload-enhanced-sidebar/rsc#EnhancedSidebar')
    expect(nav.serverProps.sidebarConfig.showLogout).toBe(true)
    // Defaults fill in what wasn't set
    expect(nav.serverProps.sidebarConfig.tabs?.map((t) => t.id)).toEqual(['dashboard', 'default'])
  })

  test('disabled leaves the config alone', () => {
    const input = { collections: [] } as unknown as Config
    expect(payloadEnhancedSidebar({ disabled: true })(input)).toBe(input)
    expect(input.admin).toBeUndefined()
  })

  test('throws on duplicate tab ids', () => {
    expect(() =>
      run({
        tabs: [
          { id: 'same', type: 'tab', icon: 'House', label: 'A' },
          { id: 'same', type: 'link', href: '/', icon: 'House', label: 'B' },
        ],
      }),
    ).toThrow(/Duplicate tab id "same"/)
  })

  describe('native tabs', () => {
    test("'group' (default) registers the Browse panel for render-tab, disabled", () => {
      const entry = sidebarTabs(run()).find((t) => t.slug === getLazyTabSlug('payload-tabs'))

      expect(entry).toBeDefined()
      expect(entry?.disabled).toBe(true)
      expect(entry?.components.Content).toEqual({
        clientProps: { id: 'payload-tabs' },
        path: NATIVE_TABS_PANEL_PATH,
      })
    })

    test("'map' and false register nothing", () => {
      expect(sidebarTabs(run({ nativeTabs: 'map' }))).toEqual([])
      expect(sidebarTabs(run({ nativeTabs: false }))).toEqual([])
    })

    test('keeps the tabs a project already has', () => {
      const own = { slug: 'own', components: { Content: './Own#Own', Icon: './Own#Icon' } }
      const config = run({}, { admin: { components: { sidebar: { tabs: [own] } } } })
      expect(sidebarTabs(config)[0]).toBe(own)
    })

    test('throws when the Browse tab id clashes with a tab', () => {
      expect(() =>
        run({
          nativeTabs: { id: 'content' },
          tabs: [{ id: 'content', type: 'tab', icon: 'House', label: 'Content' }],
        }),
      ).toThrow(/native tabs tab id "content"/)
    })

    test('a `{ type: native }` item registers the Browse panel under its own id', () => {
      const config = run({
        tabs: [
          { id: 'browse', type: 'native' },
          // Its id would clash with the automatic Browse tab's default id; placed, it can't
          { id: 'payload-tabs', type: 'tab', icon: 'House', label: 'Other' },
        ],
      })
      const slugs = sidebarTabs(config).map((t) => t.slug)
      expect(slugs).toContain(getLazyTabSlug('browse'))
      expect(slugs).not.toContain(getLazyTabSlug('payload-tabs'))
    })

    test('throws on more than one `{ type: native }` item', () => {
      expect(() =>
        run({
          tabs: [
            { id: 'a', type: 'native' },
            { id: 'b', type: 'native' },
          ],
        }),
      ).toThrow(/Only one/)
    })

    test('registers a custom Browse icon in the import map', () => {
      const config = run({ nativeTabs: { iconComponent: './Icon#BrowseIcon' } })
      expect(config.admin?.dependencies?.['enhanced-sidebar-icon-native-tabs']).toEqual({
        type: 'component',
        path: './Icon#BrowseIcon',
      })
    })
  })

  test('registers a lazy tab for render-tab, with its id and clientProps', () => {
    const config = run({
      nativeTabs: false,
      tabs: [
        {
          id: 'stats',
          type: 'tab',
          contentComponent: { clientProps: { range: 7 }, path: './Stats#Stats' },
          icon: 'ChartColumn',
          label: 'Stats',
          lazy: true,
        },
        // Not lazy: stays out of Payload's sidebar tabs
        {
          id: 'chats',
          type: 'tab',
          contentComponent: './Chats#Chats',
          icon: 'MessagesSquare',
          label: 'Chats',
        },
      ],
    })

    expect(sidebarTabs(config)).toEqual([
      {
        slug: getLazyTabSlug('stats'),
        components: {
          Content: { clientProps: { id: 'stats', range: 7 }, path: './Stats#Stats' },
          Icon: '@payloadcms/ui#DocumentIcon',
        },
        disabled: true,
      },
    ])
  })

  test('registers a custom logo component in the import map, and nothing for the default', () => {
    expect(run().admin?.dependencies?.['enhanced-sidebar-logo']).toBeUndefined()
    expect(
      run({ logo: { component: './Logo#Logo', container: 'none' } }).admin?.dependencies?.[
        'enhanced-sidebar-logo'
      ],
    ).toEqual({ type: 'component', path: './Logo#Logo' })
  })

  test('adds the badge provider only when there are badges to fetch', () => {
    const providers = (config: Config) => config.admin?.components?.providers ?? []

    expect(providers(run())).toEqual([])
    expect(
      providers(run({ badges: { posts: { type: 'collection-count', color: 'primary' } } })),
    ).toHaveLength(1)
    // Any `badges` map adds it, provider-only ones included
    expect(providers(run({ badges: { orders: { type: 'provider' } } }))).toHaveLength(1)
  })

  test('merges its translations into the config', () => {
    const config = run({}, { i18n: { translations: { en: { custom: { key: 'value' } } } } })
    const en = config.i18n?.translations?.en as Record<string, unknown>
    expect(en.custom).toEqual({ key: 'value' })
    expect(Object.keys(en).length).toBeGreaterThan(1)
  })
})
