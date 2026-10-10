import { describe, expect, test } from 'vitest'

import type { EnhancedSidebarConfig, ExtendedGroup } from '../src/types.js'

import {
  extractLocalizedValue,
  getLazyTabSlug,
  LAZY_TAB_SLUG_PREFIX,
  resolveLogoConfig,
  resolveNativeTabsConfig,
  sanitizeSidebarConfig,
  sortTabGroups,
} from '../src/utils/index.js'

describe('resolveNativeTabsConfig', () => {
  test('defaults to one Browse tab', () => {
    expect(resolveNativeTabsConfig(undefined)).toEqual({
      icon: 'FolderTree',
      iconComponent: undefined,
      id: 'payload-tabs',
      label: { en: 'Browse', uk: 'Огляд' },
      mode: 'group',
      position: 'top',
    })
    expect(resolveNativeTabsConfig(true)).toEqual(resolveNativeTabsConfig(undefined))
    expect(resolveNativeTabsConfig('group')).toEqual(resolveNativeTabsConfig(undefined))
  })

  test('false turns native tabs off', () => {
    expect(resolveNativeTabsConfig(false)).toBeNull()
  })

  test("'map', as a string or a mode, maps each tab", () => {
    expect(resolveNativeTabsConfig('map')).toEqual({ mode: 'map' })
    expect(resolveNativeTabsConfig({ mode: 'map', id: 'ignored' })).toEqual({ mode: 'map' })
  })

  test('keeps custom options and drops the default icon for an icon component', () => {
    expect(
      resolveNativeTabsConfig({
        id: 'library',
        iconComponent: './Icon#Icon',
        label: 'Library',
        position: 'bottom',
      }),
    ).toEqual({
      icon: undefined,
      iconComponent: './Icon#Icon',
      id: 'library',
      label: 'Library',
      mode: 'group',
      position: 'bottom',
    })
  })
})

describe('resolveLogoConfig', () => {
  test('defaults to the default icon on the inverse tile', () => {
    expect(resolveLogoConfig(undefined)).toEqual({ container: 'inverse' })
    expect(resolveLogoConfig(true)).toEqual({ container: 'inverse' })
  })

  test('false turns the logo off', () => {
    expect(resolveLogoConfig(false)).toBeNull()
  })

  test('a component path or { path, clientProps } is the component, not a LogoConfig', () => {
    expect(resolveLogoConfig('./Logo#Logo')).toEqual({
      component: './Logo#Logo',
      container: 'inverse',
    })
    const withProps = { clientProps: { size: 2 }, path: './Logo#Logo' }
    expect(resolveLogoConfig(withProps)).toEqual({ component: withProps, container: 'inverse' })
  })

  test('a LogoConfig keeps its component and container', () => {
    expect(resolveLogoConfig({ container: 'none' })).toEqual({
      component: undefined,
      container: 'none',
    })
    expect(resolveLogoConfig({ component: './Logo#Logo', container: 'subtle' })).toEqual({
      component: './Logo#Logo',
      container: 'subtle',
    })
  })
})

describe('getLazyTabSlug', () => {
  test('prefixes the tab id, so lazy entries are told apart from native tabs', () => {
    expect(getLazyTabSlug('stats')).toBe(`${LAZY_TAB_SLUG_PREFIX}stats`)
  })
})

describe('sanitizeSidebarConfig', () => {
  test('drops every function before the config reaches the client', () => {
    const config: EnhancedSidebarConfig = {
      sort: { content: { groups: () => 0 } },
      tabs: [
        {
          id: 'content',
          type: 'tab',
          access: () => true,
          customItems: [{ slug: 'drafts', access: () => true, href: '/drafts', label: 'Drafts' }],
          icon: 'FileText',
          label: 'Content',
        },
        { id: 'home', type: 'link', access: () => true, href: '/', icon: 'House', label: 'Home' },
      ],
    }

    const sanitized = sanitizeSidebarConfig(config)

    const hasFunction = (value: unknown): boolean =>
      typeof value === 'function' ||
      (typeof value === 'object' && value !== null && Object.values(value).some(hasFunction))

    expect(hasFunction(sanitized)).toBe(false)
    expect(sanitized.sort).toBeUndefined()
    expect(sanitized.tabs?.map((t) => t.id)).toEqual(['content', 'home'])
  })
})

describe('sortTabGroups', () => {
  const entity = (slug: string) => ({ slug, type: 'collections' as const, label: slug })
  const groups: ExtendedGroup[] = [
    { entities: [entity('b'), entity('a')], label: 'Second' },
    { entities: [entity('x'), entity('y')], label: '' },
    { entities: [entity('c')], label: 'First' },
  ] as unknown as ExtendedGroup[]

  test('returns the input untouched without a sort', () => {
    expect(sortTabGroups(groups, undefined, 'en')).toBe(groups)
    expect(sortTabGroups(groups, {}, 'en')).toBe(groups)
  })

  test('sorts items within groups, keeping the order of equal keys', () => {
    const result = sortTabGroups(groups, { items: (item) => (item.slug === 'a' ? -1 : 0) }, 'en')
    expect(result[0].entities.map((e) => e.slug)).toEqual(['a', 'b'])
    expect(result[1].entities.map((e) => e.slug)).toEqual(['x', 'y'])
  })

  test('splits ungrouped blocks when sorting groups, so their items can move on their own', () => {
    const result = sortTabGroups(
      groups,
      {
        groups: (group) => {
          if (group.label === 'First') {
            return -10
          }
          if (group.isUngrouped && group.entities[0].slug === 'y') {
            return -5
          }
        },
      },
      'en',
    )
    expect(result.map((g) => (g.label ? g.label : g.entities[0].slug))).toEqual([
      'First',
      'y',
      'Second',
      'x',
    ])
  })
})

describe('extractLocalizedValue', () => {
  test('picks the locale, then the first value, then a title from the slug', () => {
    expect(extractLocalizedValue({ en: 'Posts', uk: 'Публікації' }, 'uk')).toBe('Публікації')
    expect(extractLocalizedValue({ en: 'Posts' }, 'de')).toBe('Posts')
    expect(extractLocalizedValue('Posts', 'uk')).toBe('Posts')
    expect(extractLocalizedValue(undefined, 'en', 'site-settings')).toBe('Site Settings')
  })
})
