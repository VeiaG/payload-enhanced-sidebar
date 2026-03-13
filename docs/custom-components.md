# Custom Components

The plugin allows replacing every visual piece of the sidebar with your own React components. All custom components are **client components** (`'use client'`) registered automatically in Payload's import map — no extra setup needed.

## Overview

| Slot | Config key | Props type | What it replaces |
|------|-----------|-----------|-----------------|
| Navigation item | `customComponents.NavItem` | `CustomNavItemProps` | Default collection/global/custom link row |
| Navigation group | `customComponents.NavGroup` | `CustomNavGroupProps` | Default collapsible group header |
| Nav content area | `customComponents.NavContent` | `CustomNavContentProps` | Entire `<nav>` scroll area |
| Tab/link button | `customComponents.TabButton` | `CustomTabButtonProps` | Every button in the vertical tabs bar |
| Per-tab icon | `tab.iconComponent` | `CustomTabIconProps` | The icon for one specific tab or link |

All paths follow Payload's component format: `'./path/to/file#ExportName'`.

---

## NavItem

Replaces each individual navigation row (collections, globals, custom items).

```typescript
payloadEnhancedSidebar({
  customComponents: {
    NavItem: './components/MySidebar#MyNavItem',
  },
})
```

**Props (`CustomNavItemProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `entity` | `ExtendedEntity` | Full entity object (slug, type, label, href, isExternal) |
| `href` | `string` | Computed href with admin route prefix applied |
| `id` | `string` | DOM element id (`nav-{slug}`) |
| `label` | `string` | Pre-translated label string |
| `badgeConfig` | `BadgeConfig \| undefined` | Badge config from the `badges` option, if set |

Use the `useNavItemState(href)` hook to get reactive active state:

```tsx
'use client'

import type { CustomNavItemProps } from '@veiag/payload-enhanced-sidebar'
import { useNavItemState } from '@veiag/payload-enhanced-sidebar'
import { Link } from '@payloadcms/ui'

export const MyNavItem: React.FC<CustomNavItemProps> = ({ entity, href, id, label }) => {
  const { isActive, isCurrentPage } = useNavItemState(href)

  if (isCurrentPage) {
    return <div id={id} style={{ fontWeight: 600, padding: '4px 12px' }}>{label}</div>
  }

  return (
    <Link
      href={href}
      id={id}
      rel={entity.isExternal ? 'noopener noreferrer' : undefined}
      target={entity.isExternal ? '_blank' : undefined}
    >
      {label}
    </Link>
  )
}
```

**`useNavItemState(href)`**

```typescript
import { useNavItemState } from '@veiag/payload-enhanced-sidebar'

const { isActive, isCurrentPage } = useNavItemState(href)
// isActive      — true when current path starts with href (e.g. /admin/collections/posts/*)
// isCurrentPage — true when current path exactly matches href
```

---

## NavGroup

Replaces each collapsible group header that wraps navigation items.

```typescript
payloadEnhancedSidebar({
  customComponents: {
    NavGroup: './components/MySidebar#MyNavGroup',
  },
})
```

**Props (`CustomNavGroupProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Translated group label |
| `isOpen` | `boolean \| undefined` | Initial open state from nav preferences |
| `children` | `ReactNode` | The nav items inside the group |

```tsx
'use client'

import type { CustomNavGroupProps } from '@veiag/payload-enhanced-sidebar'
import { useState } from 'react'

export const MyNavGroup: React.FC<CustomNavGroupProps> = ({ label, isOpen, children }) => {
  const [open, setOpen] = useState(isOpen ?? true)

  return (
    <div>
      <button onClick={() => setOpen(!open)}>
        {label} {open ? '▲' : '▼'}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}
```

---

## NavContent

Replaces the entire `<nav>` scroll area — the section below the tabs bar that contains all navigation items.

```typescript
payloadEnhancedSidebar({
  customComponents: {
    NavContent: './components/MySidebar#MyNavContent',
  },
})
```

**Props (`CustomNavContentProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `Array<{ id: string }>` | Tab definitions for mapping |
| `tabsContent` | `Record<string, ReactNode>` | Pre-rendered content per tab id |
| `allContent` | `ReactNode \| undefined` | Content when no tabs are defined |
| `beforeNavLinks` | `ReactNode \| undefined` | Payload's `admin.components.beforeNavLinks` |
| `afterNavLinks` | `ReactNode \| undefined` | Payload's `admin.components.afterNavLinks` |

Use the `useTabState(id)` hook to know which tab is active:

```tsx
'use client'

import type { CustomNavContentProps } from '@veiag/payload-enhanced-sidebar'
import { useTabState } from '@veiag/payload-enhanced-sidebar'

export const MyNavContent: React.FC<CustomNavContentProps> = ({
  tabs,
  tabsContent,
  beforeNavLinks,
  afterNavLinks,
  allContent,
}) => {
  return (
    <nav style={{ flexGrow: 1, overflowY: 'auto' }}>
      {beforeNavLinks}
      {tabs.length > 0
        ? tabs.map((tab) => <TabPanel key={tab.id} id={tab.id} tabsContent={tabsContent} />)
        : allContent}
      {afterNavLinks}
    </nav>
  )
}

const TabPanel = ({ id, tabsContent }) => {
  const { isActive } = useTabState(id)
  return (
    <div style={{ display: isActive ? undefined : 'none' }}>
      {tabsContent[id]}
    </div>
  )
}
```

> **Tip:** Render all tabs and toggle visibility with `display: none`. If you only render the active tab, the group open/close state (tracked locally in each NavGroup) resets on every tab switch — causing a desync with the persisted preferences.

**`useTabState(id)`**

```typescript
import { useTabState } from '@veiag/payload-enhanced-sidebar'

const { isActive } = useTabState('my-tab-id')
// true when this tab is the currently selected one
```

---

## TabButton

Replaces every button/link in the vertical tabs bar — both `tab` and `link` type items. One component handles both.

```typescript
payloadEnhancedSidebar({
  customComponents: {
    TabButton: './components/MySidebar#MyTabButton',
  },
})
```

**Props (`CustomTabButtonProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Tab/link id |
| `type` | `'tab' \| 'link'` | Differentiate rendering and behavior |
| `label` | `string` | Pre-translated label |
| `icon` | `ReactNode` | Pre-rendered icon (from `iconComponent` or default Lucide) |
| `badge` | `BadgeConfig \| undefined` | Badge config |
| `href` | `string \| undefined` | Computed href (only for `link` type) |
| `isExternal` | `boolean \| undefined` | Whether link is external (only for `link` type) |

Use `useTabState` and `useEnhancedSidebar` for state:

```tsx
'use client'

import type { CustomTabButtonProps } from '@veiag/payload-enhanced-sidebar'
import { useEnhancedSidebar, useTabState } from '@veiag/payload-enhanced-sidebar'

export const MyTabButton: React.FC<CustomTabButtonProps> = ({
  id, type, label, icon, href, isExternal,
}) => {
  const { isActive } = useTabState(id)
  const { onTabChange } = useEnhancedSidebar()

  if (type === 'link' && href) {
    return (
      <a
        href={href}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        target={isExternal ? '_blank' : undefined}
        title={label}
        style={{ opacity: isActive ? 1 : 0.5 }}
      >
        {icon}
      </a>
    )
  }

  return (
    <button onClick={() => onTabChange(id)} title={label} type="button">
      {icon}
    </button>
  )
}
```

**`useEnhancedSidebar()`**

```typescript
import { useEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'

const { activeTabId, onTabChange } = useEnhancedSidebar()
// activeTabId  — currently selected tab id
// onTabChange  — call to switch tab and persist to cookie
```

---

## iconComponent (per-tab icon)

Each tab or link can have a custom icon component that replaces the default Lucide icon. This is mutually exclusive with `icon` — use one or the other.

```typescript
payloadEnhancedSidebar({
  tabs: [
    {
      id: 'dashboard',
      type: 'link',
      href: '/',
      // Either icon:
      icon: 'House',
      // OR iconComponent:
      iconComponent: './components/MySidebar#DashboardIcon',
      label: 'Dashboard',
    },
  ],
})
```

> TypeScript enforces the mutual exclusion — you'll get a compile error if you set both `icon` and `iconComponent` on the same tab.

**Props (`CustomTabIconProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Tab/link id |
| `label` | `string` | Pre-translated label |
| `type` | `'tab' \| 'link'` | Item type |

```tsx
'use client'

import type { CustomTabIconProps } from '@veiag/payload-enhanced-sidebar'

export const DashboardIcon: React.FC<CustomTabIconProps> = ({ label }) => (
  <img src="/icons/dashboard.svg" alt={label} width={20} height={20} />
)
```

The rendered icon is passed as the `icon` prop to `TabButton` (default or custom). So if you use both `iconComponent` and `customComponents.TabButton`, your custom tab button receives the pre-rendered custom icon as `icon: ReactNode`.

---

## Combining custom components

All custom component slots work independently — use any combination:

```typescript
payloadEnhancedSidebar({
  customComponents: {
    NavItem: './components/Sidebar#MyNavItem',      // custom items only
    NavGroup: './components/Sidebar#MyNavGroup',    // custom groups only
    // NavContent and TabButton not set — default rendering
  },
  tabs: [
    {
      id: 'shop',
      type: 'tab',
      iconComponent: './components/Sidebar#ShopIcon', // custom icon for this tab
      label: 'Shop',
      collections: ['products', 'orders'],
    },
  ],
})
```

---

## Hooks reference

| Hook | Import | Description |
|------|--------|-------------|
| `useNavItemState(href)` | `@veiag/payload-enhanced-sidebar` | `{ isActive, isCurrentPage }` for a nav item |
| `useTabState(id)` | `@veiag/payload-enhanced-sidebar` | `{ isActive }` for a tab id |
| `useEnhancedSidebar()` | `@veiag/payload-enhanced-sidebar` | `{ activeTabId, onTabChange }` context |
| `useBadgeValue(slug)` | `@veiag/payload-enhanced-sidebar` | Current badge value from BadgeProvider |
