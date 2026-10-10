# Access Control

You can control visibility of tabs, links, and custom items using an `access` function. It runs **server-side** and receives the current `PayloadRequest`, so you have full access to `req.user`, roles, permissions, etc.

## On tabs and links

```typescript
tabs: [
  {
    id: 'admin-panel',
    type: 'tab',
    icon: 'Shield',
    label: 'Admin',
    collections: ['users', 'tenants'],
    access: ({ req, item }) => {
      return req.user?.role === 'admin'
    },
  },
  {
    id: 'reports',
    type: 'link',
    href: '/reports',
    icon: 'BarChart',
    label: 'Reports',
    access: async ({ req }) => {
      // async is supported
      return Boolean(req.user)
    },
  },
]
```

If `access` returns `false`, the tab button is hidden from the tabs bar and its content is not rendered.

## On custom items

```typescript
customItems: [
  {
    slug: 'admin-tools',
    href: '/admin-tools',
    label: 'Admin Tools',
    access: ({ req }) => req.user?.role === 'admin',
  },
]
```

**Access function signatures:**

```typescript
// For tabs and links
type TabAccessFunction = (args: {
  item: SidebarTab       // full tab/link config
  req: PayloadRequest
}) => boolean | Promise<boolean>

// For custom items
type ItemAccessFunction = (args: {
  item: SidebarTabItem   // full custom item config
  req: PayloadRequest
}) => boolean | Promise<boolean>
```

> Default collections and globals already respect Payload's built-in access control — they are filtered by `visibleEntities` automatically. The `access` function is only needed for tabs, links, and custom items.

## Behavior when `req` is unavailable

Access functions are **fail-closed**: if `req` is not available (e.g. on certain error pages), all items with an `access` function will be hidden. This is a known limitation caused by a [Payload bug](https://github.com/payloadcms/payload/issues) where `req` is not passed to the Nav component on 404 admin pages.

## Custom views and access control

If you have custom admin views, you must pass `req` to `DefaultTemplate` for access control to work correctly. Retrieve it from `props.initPageResult.req`:

```tsx
import type { AdminViewProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'

export async function MyCustomView(props: AdminViewProps) {
  const { initPageResult, params, searchParams } = props
  const { permissions, req, visibleEntities } = initPageResult
  const { i18n, locale, payload, user } = req

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={user ?? undefined}
      visibleEntities={visibleEntities}
    >
      {/* your view content */}
    </DefaultTemplate>
  )
}
```

Without `req={req}`, the sidebar will treat the page as unauthenticated and hide all access-controlled items.
