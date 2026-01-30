import { mongooseAdapter } from '@payloadcms/db-mongodb'
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
      payloadEnhancedSidebar({
        // Badge configurations for sidebar items
        badges: {
          // Collection count - automatically fetches document count
          posts: { type: 'collection-count', color: 'primary' },
          // Provider-based badge - value comes from TestBadgeProvider
          orders: { type: 'provider', color: 'error' },
          // Collection count - total articles
          articles: {
            type: 'collection-count',
            color: 'warning',
          },
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
            id: 'docs',
            type: 'link',
            href: 'https://payloadcms.com/',
            icon: 'BookOpen',
            isExternal: true,
            label: { en: 'Documentation', uk: 'Документація' },
          },
          {
            id: 'content',
            type: 'tab',
            // Badge on tab icon - collection count
            badge: { type: 'collection-count', collectionSlug: 'posts', color: 'primary' },
            collections: ['posts', 'pages', 'categories', 'articles', 'authors', 'tags'],
            icon: 'FileText',
            label: { en: 'Content', uk: 'Контент' },
          },
          {
            id: 'ecommerce',
            type: 'tab',
            // Badge on tab icon - provider-based (value from TestBadgeProvider)
            badge: { slug: 'orders', type: 'provider', color: 'error' },
            collections: ['products', 'orders', 'customers', 'reviews'],
            // Example: custom item merged into existing group
            customItems: [
              {
                slug: 'analytics',
                group: 'E-commerce',
                href: '/analytics',
                label: { en: 'Analytics', uk: 'Аналітика' },
              },
            ],
            icon: 'ShoppingCart',
            label: { en: 'E-commerce', uk: 'E-commerce' },
          },
          {
            id: 'marketing',
            type: 'tab',
            collections: ['campaigns', 'newsletters', 'subscribers'],
            icon: 'Megaphone',
            label: { en: 'Marketing', uk: 'Маркетинг' },
          },
          {
            id: 'media',
            type: 'tab',
            // Badge on tab icon - API-based
            badge: {
              type: 'api',
              color: 'default',
              endpoint: '/api/media?limit=0',
              responseKey: 'totalDocs',
            },
            collections: ['media'],
            icon: 'Image',
            label: { en: 'Media', uk: 'Медіа' },
          },
          {
            id: 'settings',
            type: 'tab',
            collections: ['users'],
            // Example: custom items - one in group, one ungrouped
            customItems: [
              {
                slug: 'account',
                group: 'Settings',
                href: '/account',
                label: { en: 'Account', uk: 'Акаунт' },
              },
              {
                slug: 'api-keys',
                href: '/api-keys',
                label: { en: 'API Keys', uk: 'API Ключі' },
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
