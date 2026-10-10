import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import path from 'path'
import { buildConfig, createFolderField, createTagField } from 'payload'
import { fileURLToPath } from 'url'

import { startMemoryMongo } from './helpers/memoryDb.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

/**
 * The dev config, shared by both dev apps: the Next one here and the TanStack Start one in
 * `dev-tanstack/`. Component paths resolve against this folder either way; each app keeps its
 * own import map file.
 */
export const createDevConfig = async ({ importMapFile }: { importMapFile?: string } = {}) => {
  return buildConfig({
    admin: {
      // A real photo in the account menu (falls back to its alt text if the file is missing)
      avatar: { Component: './components/DevAvatar#DevAvatar' },
      components: {
        // Disabled with the plugin below
        // providers: ['./components/TestBadgeProvider#TestBadgeProvider'],
        settingsMenu: [
          './components/SettingsMenuItem#SettingsMenuItem',
          './components/SettingsMenuItem#AnotherSettingsItem',
        ],
        // Payload's native sidebar tabs (not the plugin's). The hierarchy collections
        // add their own tabs here too, after these.
        sidebar: {
          tabs: [
            {
              slug: 'recent',
              components: {
                Content: './components/NativeSidebarTabs#RecentTab',
                Icon: './components/NativeSidebarTabs#RecentIcon',
              },
              label: { en: 'Recent', uk: 'Нещодавні' },
            },
            {
              slug: 'quick-create',
              components: {
                Content: './components/NativeSidebarTabsClient#QuickCreateTab',
                Icon: '@payloadcms/ui#CirclePlusIcon',
              },
              label: { en: 'Quick create', uk: 'Швидке створення' },
            },
            {
              slug: 'stats',
              components: {
                Content: './components/NativeSidebarTabs#StatsTab',
                Icon: '@payloadcms/ui#GridViewIcon',
              },
              label: { en: 'Stats', uk: 'Статистика' },
            },
            {
              slug: 'notes',
              components: {
                Content: './components/NativeSidebarTabsClient#NotesTab',
                Icon: '@payloadcms/ui#WriteIcon',
              },
              label: { en: 'Notes', uk: 'Нотатки' },
            },
            {
              slug: 'help',
              components: {
                Content: './components/NativeSidebarTabsClient#HelpTab',
                Icon: '@payloadcms/ui#InfoIcon',
              },
              label: { en: 'Help', uk: 'Довідка' },
            },
          ],
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
        importMapFile,
      },
    },
    collections: [
      {
        slug: 'posts',
        admin: {
          group: {
            en: 'Content',
            uk: 'Контент',
          },
          useAsTitle: 'title',
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            label: {
              en: 'Title',
              uk: 'Заголовок',
            },
            required: true,
          },
          {
            name: 'slug',
            type: 'text',
            label: 'Slug',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
              {
                label: 'Draft',
                value: 'draft',
              },
              {
                label: 'Published',
                value: 'published',
              },
            ],
          },
          {
            name: 'category',
            type: 'relationship',
            relationTo: 'categories',
          },
        ],
        labels: {
          plural: {
            en: 'Posts',
            uk: 'Публікації',
          },
          singular: {
            en: 'Post',
            uk: 'Публікація',
          },
        },
      },
      {
        slug: 'pages',
        admin: {
          group: {
            en: 'Content',
            uk: 'Контент',
          },
          useAsTitle: 'title',
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'slug',
            type: 'text',
            required: true,
          },
        ],
        labels: {
          plural: {
            en: 'Pages',
            uk: 'Сторінки',
          },
          singular: {
            en: 'Page',
            uk: 'Сторінка',
          },
        },
      },
      {
        slug: 'categories',
        admin: {
          group: {
            en: 'Content',
            uk: 'Контент',
          },
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'slug',
            type: 'text',
            required: true,
          },
        ],
        labels: {
          plural: {
            en: 'Categories',
            uk: 'Категорії',
          },
          singular: {
            en: 'Category',
            uk: 'Категорія',
          },
        },
      },
      {
        slug: 'products',
        admin: {
          group: 'E-commerce',
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'price',
            type: 'number',
            required: true,
          },
          {
            name: 'sku',
            type: 'text',
            required: true,
          },
          createFolderField({ relationTo: 'product-folders' }),
          createTagField({ relationTo: 'product-tags' }),
        ],
      },
      // A second folders/tags pair, to see how several hierarchy tabs sit side by side
      {
        slug: 'product-folders',
        admin: {
          useAsTitle: 'name',
        },
        fields: [{ name: 'name', type: 'text', required: true }],
        folders: true,
        labels: { plural: 'Product Folders', singular: 'Product Folder' },
      },
      {
        slug: 'product-tags',
        admin: {
          useAsTitle: 'name',
        },
        fields: [{ name: 'name', type: 'text', required: true }],
        labels: { plural: 'Product Tags', singular: 'Product Tag' },
        tags: true,
      },
      {
        slug: 'tenants',
        admin: {
          useAsTitle: 'name',
        },
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
        ],
      },
      {
        slug: 'users',
        admin: {
          useAsTitle: 'email',
        },
        auth: true,
        fields: [
          {
            name: 'name',
            type: 'text',
          },
        ],
      },
      {
        slug: 'media',
        admin: {
          group: 'Media',
        },
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
      // Blog collections
      {
        slug: 'articles',
        admin: {
          group: 'Blog',
          useAsTitle: 'title',
        },
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'richText' },
          createFolderField({ relationTo: 'folders' }),
          createTagField({ relationTo: 'tags' }),
        ],
        labels: { plural: 'Articles', singular: 'Article' },
      },
      // v4 hierarchy: `folders: true` makes this collection the folders themselves.
      // No admin.group, so it only shows as a sidebar tab, not in the nav.
      {
        slug: 'folders',
        admin: {
          useAsTitle: 'name',
        },
        fields: [{ name: 'name', type: 'text', required: true }],
        folders: true,
        labels: { plural: 'Folders', singular: 'Folder' },
      },
      {
        slug: 'authors',
        admin: {
          group: 'Blog',
          useAsTitle: 'name',
        },
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'bio', type: 'textarea' },
        ],
        labels: { plural: 'Authors', singular: 'Author' },
      },
      {
        slug: 'tags',
        admin: {
          group: 'Blog',
          useAsTitle: 'name',
        },
        fields: [{ name: 'name', type: 'text', required: true }],
        labels: { plural: 'Tags', singular: 'Tag' },
        tags: true,
      },
      // E-commerce additional
      {
        slug: 'orders',
        admin: {
          group: 'E-commerce',
        },
        fields: [
          { name: 'orderNumber', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            options: ['pending', 'processing', 'shipped', 'delivered'],
          },
          { name: 'total', type: 'number' },
        ],
        labels: { plural: 'Orders', singular: 'Order' },
      },
      {
        slug: 'customers',
        admin: {
          group: 'E-commerce',
          useAsTitle: 'email',
        },
        fields: [
          { name: 'email', type: 'email', required: true },
          { name: 'firstName', type: 'text' },
          { name: 'lastName', type: 'text' },
        ],
        labels: { plural: 'Customers', singular: 'Customer' },
      },
      {
        slug: 'reviews',
        admin: {
          group: 'E-commerce',
        },
        fields: [
          { name: 'rating', type: 'number', max: 5, min: 1 },
          { name: 'comment', type: 'textarea' },
        ],
        labels: { plural: 'Reviews', singular: 'Review' },
      },
      // Marketing
      {
        slug: 'campaigns',
        admin: {
          group: 'Marketing',
          useAsTitle: 'name',
        },
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'startDate', type: 'date' },
          { name: 'endDate', type: 'date' },
        ],
        labels: { plural: 'Campaigns', singular: 'Campaign' },
      },
      {
        slug: 'newsletters',
        admin: {
          group: 'Marketing',
          useAsTitle: 'subject',
        },
        fields: [
          { name: 'subject', type: 'text', required: true },
          { name: 'body', type: 'richText' },
        ],
        labels: { plural: 'Newsletters', singular: 'Newsletter' },
      },
      {
        slug: 'subscribers',
        admin: {
          group: 'Marketing',
          useAsTitle: 'email',
        },
        fields: [{ name: 'email', type: 'email', required: true }],
        labels: { plural: 'Subscribers', singular: 'Subscriber' },
      },
    ],
    db: mongooseAdapter({
      ensureIndexes: true,
      // Falls back to a throwaway in-memory replica set when no external DB is configured
      url: process.env.DATABASE_URI || (await startMemoryMongo()),
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    globals: [
      {
        slug: 'site-settings',
        fields: [],
      },
      {
        slug: 'footer-settings',
        admin: {
          group: 'Settings',
        },
        fields: [],
      },
    ],
    i18n: {
      fallbackLanguage: 'en',
      supportedLanguages: {
        en,
        uk,
      },
    },
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      multiTenantPlugin({
        collections: {
          pages: {},
          posts: {},
        },
        tenantsSlug: 'tenants',
        userHasAccessToAllTenants(user) {
          return true
        },
      }),
      // Disabled for now to look at the native v4 sidebar
      payloadEnhancedSidebar({
        badges: {
          articles: { type: 'collection-count', color: 'warning' },
          orders: { type: 'provider', color: 'error' },
          posts: { type: 'collection-count', color: 'primary' },
        },
        customComponents: {
          // NavContent: './components/CustomNavComponents#CustomNavContent',
          // NavGroup: './components/CustomNavComponents#CustomNavGroup',
          // NavItem: './components/CustomNavComponents#CustomNavItem',
          // TabButton: './components/CustomNavComponents#CustomTabButton',
        },
        // Demo of the `sort` feature. Comment this whole block out to compare
        // against the default ordering.
        sort: {
          content: {
            // Top-level group order: pin the 'promo' banner to the very top,
            // bring the 'Tools' group up, push 'Blog' to the bottom.
            // Everything else keeps its default position (undefined → 0).
            groups: (group) => {
              if (group.isUngrouped && group.entities.some((e) => e.slug === 'promo')) {
                return -100
              }
              const label = typeof group.label === 'string' ? group.label : group.label.en
              if (label === 'Tools') {
                return -50
              }
              if (label === 'Blog') {
                return 100
              }
            },
            // Inside the 'Content' group: pin the custom component (storage meter)
            // to the top, push 'categories' to the bottom.
            items: (item, group) => {
              const label = typeof group.label === 'string' ? group.label : group.label.en
              if (label === 'Content') {
                if (item.type === 'custom-component') {
                  return -10
                }
                if (item.slug === 'categories') {
                  return 10
                }
              }
            },
          },
        },
        tabs: [
          // Tab + href: clicking it opens the dashboard *and* the tab's own panel,
          // so the shortcuts below stay visible. Cmd/Ctrl-click only navigates.
          {
            id: 'dashboard',
            type: 'tab',
            href: '/',
            // Per-item button: keeps the current URL's search params when navigating
            buttonComponent: './components/CustomNavComponents#KeepQueryTabButton',
            customItems: [
              {
                slug: 'dashboard-new-post',
                group: { en: 'Shortcuts', uk: 'Ярлики' },
                href: '/collections/posts/create',
                label: { en: 'New Post', uk: 'Новий пост' },
              },
              {
                slug: 'dashboard-account',
                group: { en: 'Shortcuts', uk: 'Ярлики' },
                href: '/account',
                label: { en: 'My Account', uk: 'Мій акаунт' },
              },
            ],
            icon: 'House',
            label: { en: 'Dashboard', uk: 'Головна' },
            // access: always granted — tab is visible
            access: ({ req }) => Boolean(req.user),
          },
          {
            id: 'content',
            type: 'tab',
            badge: { type: 'collection-count', collectionSlug: 'posts', color: 'primary' },
            collections: ['posts', 'pages', 'categories', 'articles', 'authors', 'tags'],
            customItems: [
              // Merged into existing 'Content' group (localized match)
              {
                slug: 'drafts',
                group: { en: 'Content', uk: 'Контент' },
                href: '/collections/posts',
                label: { en: 'Drafts', uk: 'Чернетки' },
              },
              // Merged into existing 'Blog' group
              {
                slug: 'rss-feed',
                group: 'Blog',
                href: 'https://example.com/rss',
                isExternal: true,
                label: 'RSS Feed',
              },
              // New custom 'Tools' group
              {
                slug: 'analytics',
                group: { en: 'Tools', uk: 'Інструменти' },
                href: '/analytics',
                label: { en: 'Analytics', uk: 'Аналітика' },
              },
              {
                slug: 'seo',
                group: { en: 'Tools', uk: 'Інструменти' },
                href: '/seo',
                label: 'SEO',
              },
              // Ungrouped — position: 'top' → appears above all collection groups
              {
                slug: 'quick-links',
                href: '/collections/posts?status=draft',
                label: { en: 'Quick Links', uk: 'Швидкі посилання' },
                position: 'top',
              },
              // New 'Shortcuts' group — position: 'top' → group appears at the top
              {
                slug: 'new-post',
                group: { en: 'Shortcuts', uk: 'Ярлики' },
                href: '/collections/posts/create',
                label: { en: 'New Post', uk: 'Новий пост' },
                position: 'top',
              },
              // Ungrouped — appears at the bottom (default)
              {
                slug: 'import-data',
                href: '/import',
                label: { en: 'Import Data', uk: 'Імпорт' },
              },
              // Per-item custom component (ungrouped banner). Rendered server-side via
              // Payload's component system — this one happens to be a client component.
              {
                slug: 'promo',
                component: {
                  clientProps: { variant: 'banner' },
                  path: './components/CustomNavComponents#CustomNavItemComponent',
                },
              },
              // Per-item custom component merged INTO the 'Content' group
              {
                slug: 'storage',
                component: {
                  clientProps: { variant: 'meter' },
                  path: './components/CustomNavComponents#CustomNavItemComponent',
                },
                group: { en: 'Content', uk: 'Контент' },
              },
            ],
            icon: 'FileText',
            label: { en: 'Content', uk: 'Контент' },
          },
          {
            id: 'shop',
            type: 'tab',
            badge: { type: 'provider', color: 'error' },
            collections: ['products', 'orders', 'customers', 'reviews'],
            customItems: [
              // Merged into existing 'E-commerce' group
              {
                slug: 'pending-orders',
                group: 'E-commerce',
                href: '/collections/orders',
                label: { en: 'Pending', uk: 'Очікують' },
              },
              // New 'Integrations' group
              {
                slug: 'stripe',
                group: 'Integrations',
                href: 'https://dashboard.stripe.com',
                isExternal: true,
                label: 'Stripe',
                // access: always hidden — demonstrates item-level access denial
                access: () => false,
              },
              {
                slug: 'shipping',
                group: 'Integrations',
                href: '/shipping',
                label: { en: 'Shipping', uk: 'Доставка' },
                // access: async example — always granted
                access: async ({ req }) => Boolean(req.user),
              },
              // Ungrouped
              {
                slug: 'reports',
                href: '/reports',
                label: { en: 'Reports', uk: 'Звіти' },
                // access: only users whose email includes 'admin'
                access: ({ req }) => Boolean(req.user?.email?.includes('admin')),
              },
            ],
            icon: 'ShoppingCart',
            label: { en: 'Shop', uk: 'Магазин' },
          },
          {
            id: 'marketing',
            type: 'tab',
            // access: only users with 'admin' in their email see this tab
            // change to () => false to always hide, or () => true to always show
            access: ({ req }) => Boolean(req.user?.email?.includes('admin')),
            collections: ['campaigns', 'newsletters', 'subscribers'],
            customItems: [
              // New 'Email' group
              {
                slug: 'email-templates',
                group: 'Email',
                href: '/email-templates',
                label: { en: 'Templates', uk: 'Шаблони' },
              },
              {
                slug: 'email-logs',
                group: 'Email',
                href: '/email-logs',
                label: { en: 'Send Logs', uk: 'Логи' },
              },
              // Ungrouped
              {
                slug: 'social-media',
                href: '/social',
                label: { en: 'Social Media', uk: 'Соцмережі' },
              },
            ],
            icon: 'Megaphone',
            label: { en: 'Marketing', uk: 'Маркетинг' },
          },
          // Tab with its own content component — replaces the whole nav area while
          // active (no Payload before/after slots), e.g. a chat list instead of links
          // Plugin tab rendered lazily through Payload's `render-tab` (same component as the
          // native `stats` tab, to compare the two)
          {
            id: 'lazy-stats',
            type: 'tab',
            contentComponent: './components/NativeSidebarTabs#StatsTab',
            icon: 'ChartColumn',
            label: { en: 'Stats (lazy)', uk: 'Статистика (lazy)' },
            lazy: true,
          },
          {
            id: 'chats',
            type: 'tab',
            contentComponent: {
              clientProps: { title: 'Chats' },
              path: './components/CustomNavComponents#ChatListPanel',
            },
            icon: 'MessagesSquare',
            label: { en: 'Chats', uk: 'Чати' },
          },
          // Payload's own sidebar tabs (folder/tag trees, the tabs above) in one Browse tab, here
          { id: 'browse', type: 'native' },
          // Extra tabs that overflow the rail, to show the scrolling list and its edge fades
          {
            id: 'scroll-test-1',
            type: 'tab',
            collections: ['posts'],
            icon: 'Bell',
            label: 'Scroll test 1',
          },
          {
            id: 'scroll-test-2',
            type: 'tab',
            collections: ['pages'],
            icon: 'Calendar',
            label: 'Scroll test 2',
          },
          {
            id: 'scroll-test-3',
            type: 'tab',
            collections: ['categories'],
            icon: 'Camera',
            label: 'Scroll test 3',
          },
          {
            id: 'scroll-test-4',
            type: 'tab',
            collections: ['products'],
            icon: 'Cloud',
            label: 'Scroll test 4',
          },
          {
            id: 'scroll-test-5',
            type: 'tab',
            collections: ['orders'],
            icon: 'Compass',
            label: 'Scroll test 5',
          },
          {
            id: 'scroll-test-6',
            type: 'tab',
            collections: ['customers'],
            icon: 'Database',
            label: 'Scroll test 6',
          },
          {
            id: 'scroll-test-7',
            type: 'tab',
            collections: ['reviews'],
            icon: 'Flag',
            label: 'Scroll test 7',
          },
          {
            id: 'scroll-test-8',
            type: 'tab',
            collections: ['campaigns'],
            icon: 'Gift',
            label: 'Scroll test 8',
          },
          {
            id: 'scroll-test-9',
            type: 'tab',
            collections: ['newsletters'],
            icon: 'Globe',
            label: 'Scroll test 9',
          },
          {
            id: 'scroll-test-10',
            type: 'tab',
            collections: ['subscribers'],
            icon: 'Heart',
            label: 'Scroll test 10',
          },
          {
            id: 'scroll-test-11',
            type: 'tab',
            collections: ['authors'],
            icon: 'Inbox',
            label: 'Scroll test 11',
          },
          {
            id: 'scroll-test-12',
            type: 'tab',
            collections: ['articles'],
            icon: 'Key',
            label: 'Scroll test 12',
          },
          {
            id: 'scroll-test-13',
            type: 'tab',
            collections: ['posts'],
            icon: 'Leaf',
            label: 'Scroll test 13',
          },
          {
            id: 'scroll-test-14',
            type: 'tab',
            collections: ['posts'],
            icon: 'Lightbulb',
            label: 'Scroll test 14',
          },
          {
            id: 'scroll-test-15',
            type: 'tab',
            collections: ['posts'],
            icon: 'Map',
            label: 'Scroll test 15',
          },
          {
            id: 'scroll-test-16',
            type: 'tab',
            collections: ['posts'],
            icon: 'Mic',
            label: 'Scroll test 16',
          },
          {
            id: 'scroll-test-17',
            type: 'tab',
            collections: ['posts'],
            icon: 'Music',
            label: 'Scroll test 17',
          },
          {
            id: 'scroll-test-18',
            type: 'tab',
            collections: ['posts'],
            icon: 'Package',
            label: 'Scroll test 18',
          },
          {
            id: 'scroll-test-19',
            type: 'tab',
            collections: ['posts'],
            icon: 'Palette',
            label: 'Scroll test 19',
          },
          {
            id: 'scroll-test-20',
            type: 'tab',
            collections: ['posts'],
            icon: 'Phone',
            label: 'Scroll test 20',
          },
          {
            id: 'scroll-test-21',
            type: 'tab',
            collections: ['posts'],
            icon: 'Rocket',
            label: 'Scroll test 21',
          },
          {
            id: 'scroll-test-22',
            type: 'tab',
            collections: ['posts'],
            icon: 'Shield',
            label: 'Scroll test 22',
          },
          {
            id: 'scroll-test-23',
            type: 'tab',
            collections: ['posts'],
            icon: 'Star',
            label: 'Scroll test 23',
          },
          {
            id: 'scroll-test-24',
            type: 'tab',
            collections: ['posts'],
            icon: 'Truck',
            label: 'Scroll test 24',
          },
          // Custom separator — pinned to the bottom, just above the actions
          {
            id: 'separator-1',
            type: 'custom',
            component: './components/CustomNavComponents#TabSeparator',
            position: 'bottom',
          },
          {
            id: 'settings',
            type: 'tab',
            customItems: [
              // Ungrouped
              {
                slug: 'users-settings',
                href: '/collections/users',
                label: { en: 'Users', uk: 'Користувачі' },
              },
              {
                slug: 'tenants-settings',
                href: '/collections/tenants',
                label: { en: 'Tenants', uk: 'Тенанти' },
              },
            ],
            globals: ['site-settings', 'footer-settings'],
            icon: 'Settings',
            label: { en: 'Settings', uk: 'Налаштування' },
            // Render this tab at the bottom of the bar, above folders/settings/logout
            position: 'bottom',
          },
          // Plain link — navigates only, opens no panel
          {
            id: 'docs',
            type: 'link',
            href: 'https://payload.veiag.dev/',
            icon: 'BookOpen',
            isExternal: true,
            label: { en: 'Docs', uk: 'Документація' },
            position: 'bottom',
          },
        ],
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [sharpTransformer()],
    },
  })
}

export default createDevConfig()
