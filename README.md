# Payload Enhanced Sidebar

An enhanced sidebar plugin for [Payload CMS](https://payloadcms.com) that adds a tabbed navigation system to organize collections and globals into logical groups.

> **Note:** This plugin is in early development and has not been extensively tested. Use with caution in production environments.

## Features

- **Tabbed Navigation** - Organize collections into separate tabs for cleaner navigation
- **Vertical Tab Bar** - Icon-based tabs on the left side of the sidebar
- **Link Support** - Add navigation links (like Dashboard) alongside tabs
- **Custom Items** - Add custom navigation items that can be merged into existing groups
- **i18n Support** - Full localization support for labels and groups
- **Lucide Icons** - Use any [Lucide icon](https://lucide.dev/icons) for tabs and links

## Installation

```bash
npm install @veiag/payload-enhanced-sidebar
# or
yarn add @veiag/payload-enhanced-sidebar
# or
pnpm add @veiag/payload-enhanced-sidebar
```

## Quick Start

```typescript
import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import { buildConfig } from 'payload'

export default buildConfig({
  // ... your config
  plugins: [
    payloadEnhancedSidebar({
      // Works with defaults!
    }),
  ],
})
```

This will add:
- A Dashboard link at the top
- A default tab showing all collections and globals
- A logout button at the bottom

## Configuration

### Full Configuration Example

```typescript
import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [
    payloadEnhancedSidebar({
      // Tabs and links in the sidebar
      tabs: [
        // Dashboard link
        {
          id: 'dashboard',
          type: 'link',
          href: '/',
          icon: 'House',
          label: { en: 'Dashboard', uk: 'Головна' },
        },
        // Content tab - shows specific collections
        {
          id: 'content',
          type: 'tab',
          icon: 'FileText',
          label: { en: 'Content', uk: 'Контент' },
          collections: ['posts', 'pages', 'categories'],
        },
        // Link to external documentation
        {
          id: 'docs',
          type: 'link',
          href: 'https://payloadcms.com/',
          icon: 'BookOpen',
          isExternal: true,
          label: { en: 'Documentation', uk: 'Документація' },
        },
        // E-commerce tab with custom items
        {
          id: 'ecommerce',
          type: 'tab',
          icon: 'ShoppingCart',
          label: { en: 'E-commerce', uk: 'E-commerce' },
          collections: ['products', 'orders', 'customers'],
          customItems: [
            {
              slug: 'analytics',
              href: '/analytics',
              label: { en: 'Analytics', uk: 'Аналітика' },
              group: 'E-commerce', // Merge into existing group
            },
          ],
        },
        // Settings tab with globals
        {
          id: 'settings',
          type: 'tab',
          icon: 'Settings',
          label: { en: 'Settings', uk: 'Налаштування' },
          collections: ['users'],
          globals: ['site-settings', 'footer-settings'],
          customItems: [
            {
              slug: 'api-keys',
              href: '/api-keys',
              label: { en: 'API Keys', uk: 'API Ключі' },
              // No group - will appear at the bottom
            },
            {
              slug:'external-link',
              href: 'https://example.com',
              isExternal: true,
              label: { en: 'External Link', uk: 'Зовнішнє Посилання'}
            }
          ],
        },
      ],

      // Show/hide logout button (default: true)
      showLogout: true,

      // Disable the plugin
      disabled: false,
    }),
  ],
})
```

## Configuration Options

### `tabs`

Array of tabs and links to show in the sidebar.

**Tab (`type: 'tab'`)**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier |
| `type` | `'tab'` | Yes | Tab type |
| `icon` | `string` | Yes | Lucide icon name |
| `label` | `LocalizedString` | Yes | Tab tooltip/label |
| `collections` | `CollectionSlug[]` | No | Collections to show in this tab |
| `globals` | `GlobalSlug[]` | No | Globals to show in this tab |
| `customItems` | `SidebarTabItem[]` | No | Custom navigation items |

> If neither `collections` nor `globals` are specified, the tab shows all collections and globals.

**Link (`type: 'link'`)**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier |
| `type` | `'link'` | Yes | Link type |
| `icon` | `string` | Yes | Lucide icon name |
| `label` | `LocalizedString` | Yes | Link tooltip/label |
| `href` | `string` | Yes | URL |
| `isExternal` | `boolean` | No | If true, `href` is absolute URL, if not, `href` is relative to admin route |

### `customItems`

Custom items can be added to any tab:

```typescript
{
  slug: 'unique-slug',           // Required: unique identifier
  href: '/path',                 // Required: URL
  label: { en: 'Label' },        // Required: display label
  group: { en: 'Group Name' },   // Optional: merge into existing group or create new
  isExternal: true,              // Optional: if true, href is absolute URL
}
```

**Group behavior:**
- If `group` matches an existing collection group label, the item is added to that group
- If `group` doesn't match any existing group, a new group is created
- If `group` is not specified, the item appears at the bottom as ungrouped

### `showLogout`

Show/hide the logout button at the bottom of the tabs bar.

- **Type:** `boolean`
- **Default:** `true`

### `disabled`

Completely disable the plugin.

- **Type:** `boolean`
- **Default:** `false`

## Localization

All labels support localized strings:

```typescript
label: 'Simple string'
// or
label: {
  en: 'English',
  uk: 'Українська',
  de: 'Deutsch',
}
```

## TODO

The following features are planned but not yet implemented:

- [ ] **Browse by Folder Button** - Support for the folder view button (requires Payload v3.41.0+)
- [ ] **Settings Menu Items** - Support for Payload's SettingsMenu items (requires Payload v3.60.0+)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/VeiaG/payload-enhanced-sidebar/issues).

## License

MIT © [VeiaG](https://github.com/VeiaG)

## Links

- [GitHub Repository](https://github.com/VeiaG/payload-enhanced-sidebar)
- [Payload CMS](https://payloadcms.com)
- [Lucide Icons](https://lucide.dev/icons)

---

### More plugins and Payload resources at [PayloadCMS Extensions](https://payload.veiag.dev/)
