import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { testEmailAdapter } from './helpers/testEmailAdapter'
import { seed } from './seed'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      components: {
        providers: ['./components/TestBadgeProvider#TestBadgeProvider'],
        settingsMenu: [
          './components/SettingsMenuItem#SettingsMenuItem',
          './components/SettingsMenuItem#AnotherSettingsItem',
        ],
      },
      importMap: {
        baseDir: path.resolve(dirname),
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
        ],
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
        ],
        folders: true,
        labels: { plural: 'Articles', singular: 'Article' },
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
      url: process.env.DATABASE_URI || '',
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
          posts: {},
          pages: {},
        },
        tenantsSlug: 'tenants',
        userHasAccessToAllTenants(user) {
          return true
        },
      }),
      payloadEnhancedSidebar({
        badges: {
          articles: { type: 'collection-count', color: 'warning' },
          orders: { type: 'provider', color: 'error' },
          posts: { type: 'collection-count', color: 'primary' },
        },
        customComponents: {
          NavGroup: './components/CustomNavComponents#CustomNavGroup',
          NavItem: './components/CustomNavComponents#CustomNavItem',
        },
        tabs: [
          {
            id: 'dashboard',
            type: 'link',
            href: '/',
            icon: 'House',
            label: { en: 'Dashboard', uk: 'Головна' },
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
              // Ungrouped — appears at the bottom
              {
                slug: 'import-data',
                href: '/import',
                label: { en: 'Import Data', uk: 'Імпорт' },
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
              },
              {
                slug: 'shipping',
                group: 'Integrations',
                href: '/shipping',
                label: { en: 'Shipping', uk: 'Доставка' },
              },
              // Ungrouped
              {
                slug: 'reports',
                href: '/reports',
                label: { en: 'Reports', uk: 'Звіти' },
              },
            ],
            icon: 'ShoppingCart',
            label: { en: 'Shop', uk: 'Магазин' },
          },
          {
            id: 'marketing',
            type: 'tab',
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
          },
        ],
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
