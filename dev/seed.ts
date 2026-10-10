import type { Payload } from 'payload'

export const seed = async (payload: Payload) => {
  // Check if data already exists
  const { totalDocs: existingUsers } = await payload.count({
    collection: 'users',
    overrideAccess: true,
  })

  if (existingUsers > 0) {
    payload.logger.info('Database already seeded, skipping...')
    return
  }

  payload.logger.info('Seeding database...')

  // Create admin user
  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'password',
    },
    overrideAccess: true,
  })

  // Seed Tenants — posts and pages are tenant-scoped, so they need one assigned
  const tenants = await Promise.all(
    ['Main Site', 'Blog Network', 'Online Shop'].map((name) =>
      payload.create({ collection: 'tenants', data: { name }, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${tenants.length} tenants`)

  // One editor per tenant, assigned through the field the multi-tenant plugin adds to users
  const editors = await Promise.all(
    tenants.map((tenant, i) =>
      payload.create({
        collection: 'users',
        data: {
          name: `${tenant.name} Editor`,
          email: `editor${i + 1}@payloadcms.com`,
          password: 'password',
          tenants: [{ tenant: tenant.id }],
        },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${editors.length} tenant editors`)

  // Seed Categories
  const categories = [
    { name: 'Technology', slug: 'technology' },
    { name: 'Design', slug: 'design' },
    { name: 'Business', slug: 'business' },
    { name: 'Lifestyle', slug: 'lifestyle' },
    { name: 'Travel', slug: 'travel' },
    { name: 'Food', slug: 'food' },
  ]

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      payload.create({ collection: 'categories', data: cat, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${createdCategories.length} categories`)

  // Seed Posts
  const posts = [
    {
      slug: 'introduction-to-react',
      category: createdCategories[0].id,
      status: 'published',
      title: 'Introduction to React',
    },
    {
      slug: 'typescript-best-practices',
      category: createdCategories[0].id,
      status: 'published',
      title: 'TypeScript Best Practices',
    },
    {
      slug: 'building-scalable-apis',
      category: createdCategories[0].id,
      status: 'published',
      title: 'Building Scalable APIs',
    },
    {
      slug: 'ui-ux-principles',
      category: createdCategories[1].id,
      status: 'published',
      title: 'Modern UI/UX Design Principles',
    },
    {
      slug: 'color-theory-guide',
      category: createdCategories[1].id,
      status: 'published',
      title: 'Complete Guide to Color Theory',
    },
    {
      slug: 'responsive-design-2024',
      category: createdCategories[1].id,
      status: 'draft',
      title: 'Responsive Design in 2024',
    },
    {
      slug: 'startup-funding-guide',
      category: createdCategories[2].id,
      status: 'published',
      title: 'Ultimate Startup Funding Guide',
    },
    {
      slug: 'remote-team-management',
      category: createdCategories[2].id,
      status: 'published',
      title: 'Managing Remote Teams Effectively',
    },
    {
      slug: 'marketing-strategies',
      category: createdCategories[2].id,
      status: 'draft',
      title: 'Digital Marketing Strategies',
    },
    {
      slug: 'minimalist-living',
      category: createdCategories[3].id,
      status: 'published',
      title: 'The Art of Minimalist Living',
    },
    {
      slug: 'productivity-hacks',
      category: createdCategories[3].id,
      status: 'published',
      title: '10 Productivity Hacks for Developers',
    },
    {
      slug: 'travel-europe-guide',
      category: createdCategories[4].id,
      status: 'published',
      title: 'Traveling Through Europe: A Complete Guide',
    },
    {
      slug: 'budget-travel-tips',
      category: createdCategories[4].id,
      status: 'published',
      title: 'Budget Travel Tips and Tricks',
    },
    {
      slug: 'digital-nomad-life',
      category: createdCategories[4].id,
      status: 'draft',
      title: 'Life as a Digital Nomad',
    },
    {
      slug: 'italian-cooking',
      category: createdCategories[5].id,
      status: 'published',
      title: 'Authentic Italian Cooking Techniques',
    },
    {
      slug: 'healthy-meal-prep',
      category: createdCategories[5].id,
      status: 'published',
      title: 'Healthy Meal Prep for Busy Professionals',
    },
    {
      slug: 'coffee-brewing-methods',
      category: createdCategories[5].id,
      status: 'draft',
      title: 'Coffee Brewing Methods Explained',
    },
  ] as const

  const createdPosts = await Promise.all(
    posts.map((post, i) =>
      payload.create({
        collection: 'posts',
        data: { ...post, tenant: tenants[i % tenants.length].id },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${createdPosts.length} posts`)

  // Seed Pages
  const pages = [
    { slug: 'home', title: 'Home' },
    { slug: 'about', title: 'About Us' },
    { slug: 'services', title: 'Our Services' },
    { slug: 'contact', title: 'Contact' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-of-service', title: 'Terms of Service' },
    { slug: 'blog', title: 'Blog' },
  ]

  const createdPages = await Promise.all(
    pages.map((page, i) =>
      payload.create({
        collection: 'pages',
        data: { ...page, tenant: tenants[i % tenants.length].id },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${createdPages.length} pages`)

  // Seed Authors
  const authors = [
    { name: 'John Smith', bio: 'Senior developer and tech writer' },
    { name: 'Jane Doe', bio: 'UX designer and blogger' },
    { name: 'Alex Johnson', bio: 'Full-stack developer' },
  ]

  const createdAuthors = await Promise.all(
    authors.map((author) =>
      payload.create({ collection: 'authors', data: author, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${createdAuthors.length} authors`)

  // Seed Folders — a small tree, so the folders sidebar tab has something to show
  const guidesFolder = await payload.create({
    collection: 'folders',
    data: { name: 'Guides' },
    overrideAccess: true,
  })
  const engineeringFolder = await payload.create({
    collection: 'folders',
    data: { name: 'Engineering' },
    overrideAccess: true,
  })
  const frontendFolder = await payload.create({
    collection: 'folders',
    data: { name: 'Frontend', _h_folders: engineeringFolder.id },
    overrideAccess: true,
  })

  payload.logger.info('Created 3 folders')

  // Seed Tags — tags can nest too, unlike folders a document can have many
  const [tutorialTag, webTag] = await Promise.all(
    ['Tutorial', 'Web'].map((name) =>
      payload.create({ collection: 'tags', data: { name }, overrideAccess: true }),
    ),
  )
  const [reactTag, typescriptTag] = await Promise.all(
    ['React', 'TypeScript'].map((name) =>
      payload.create({
        collection: 'tags',
        data: { name, _h_tags: webTag.id },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info('Created 4 tags')

  // Seed Articles
  const articles = [
    {
      _h_folders: guidesFolder.id,
      _h_tags: [tutorialTag.id],
      content: null,
      title: 'Getting Started with Payload CMS',
    },
    {
      _h_folders: engineeringFolder.id,
      _h_tags: [webTag.id],
      content: null,
      title: 'Building Modern Web Applications',
    },
    {
      _h_folders: frontendFolder.id,
      _h_tags: [reactTag.id, tutorialTag.id],
      content: null,
      title: 'React Best Practices 2024',
    },
    {
      _h_folders: frontendFolder.id,
      _h_tags: [typescriptTag.id],
      content: null,
      title: 'Introduction to TypeScript',
    },
  ]

  const createdArticles = await Promise.all(
    articles.map((article) =>
      payload.create({ collection: 'articles', data: article, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${createdArticles.length} articles`)

  // Seed Products
  const products = [
    { name: 'Wireless Headphones', price: 199.99, sku: 'WH-001' },
    { name: 'Mechanical Keyboard', price: 149.99, sku: 'KB-002' },
    { name: 'USB-C Hub', price: 49.99, sku: 'HUB-003' },
    { name: 'Laptop Stand', price: 79.99, sku: 'LS-004' },
    { name: 'Webcam HD', price: 89.99, sku: 'WC-005' },
    { name: 'Monitor 27"', price: 399.99, sku: 'MON-006' },
    { name: 'Ergonomic Mouse', price: 69.99, sku: 'MS-007' },
    { name: 'Desk Lamp LED', price: 39.99, sku: 'DL-008' },
    { name: 'Cable Organizer', price: 19.99, sku: 'CO-009' },
    { name: 'Portable SSD 1TB', price: 129.99, sku: 'SSD-010' },
    { name: 'Bluetooth Speaker', price: 59.99, sku: 'SPK-011' },
    { name: 'Phone Stand', price: 24.99, sku: 'PS-012' },
    { name: 'Laptop Bag', price: 79.99, sku: 'LB-013' },
    { name: 'Microphone USB', price: 99.99, sku: 'MIC-014' },
    { name: 'Monitor Arm', price: 119.99, sku: 'MA-015' },
  ]

  // Seed Product Folders: Electronics > Audio, and Accessories
  const electronicsFolder = await payload.create({
    collection: 'product-folders',
    data: { name: 'Electronics' },
    overrideAccess: true,
  })
  const audioFolder = await payload.create({
    collection: 'product-folders',
    data: { name: 'Audio', '_h_product-folders': electronicsFolder.id },
    overrideAccess: true,
  })
  const accessoriesFolder = await payload.create({
    collection: 'product-folders',
    data: { name: 'Accessories' },
    overrideAccess: true,
  })

  payload.logger.info('Created 3 product folders')

  // Seed Product Tags: Promo > Sale, and New
  const [promoTag, newTag] = await Promise.all(
    ['Promo', 'New'].map((name) =>
      payload.create({ collection: 'product-tags', data: { name }, overrideAccess: true }),
    ),
  )
  const saleTag = await payload.create({
    collection: 'product-tags',
    data: { name: 'Sale', '_h_product-tags': promoTag.id },
    overrideAccess: true,
  })

  payload.logger.info('Created 3 product tags')

  const productFolders = [electronicsFolder.id, audioFolder.id, accessoriesFolder.id]
  const productTags = [[newTag.id], [saleTag.id], [], [promoTag.id, newTag.id]]

  const createdProducts = await Promise.all(
    products.map((product, i) =>
      payload.create({
        collection: 'products',
        data: {
          ...product,
          '_h_product-folders': productFolders[i % productFolders.length],
          '_h_product-tags': productTags[i % productTags.length],
        },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${createdProducts.length} products`)

  // Seed Customers
  const customers = [
    { email: 'olena@example.com', firstName: 'Olena', lastName: 'Kovalenko' },
    { email: 'john@example.com', firstName: 'John', lastName: 'Smith' },
    { email: 'maria@example.com', firstName: 'Maria', lastName: 'Garcia' },
    { email: 'taras@example.com', firstName: 'Taras', lastName: 'Shevchuk' },
    { email: 'anna@example.com', firstName: 'Anna', lastName: 'Mueller' },
  ]

  const createdCustomers = await Promise.all(
    customers.map((customer) =>
      payload.create({ collection: 'customers', data: customer, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${createdCustomers.length} customers`)

  // Seed Orders: a mix of statuses
  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered'] as const

  const createdOrders = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      payload.create({
        collection: 'orders',
        data: {
          orderNumber: `ORD-${1001 + i}`,
          status: orderStatuses[i % orderStatuses.length],
          total: Math.round((50 + i * 37.5) * 100) / 100,
        },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${createdOrders.length} orders`)

  // Seed Reviews
  const reviews = [
    { comment: 'Great sound quality, would buy again.', rating: 5 },
    { comment: 'Solid build, but a bit pricey.', rating: 4 },
    { comment: 'Does the job.', rating: 3 },
    { comment: 'Stopped working after a month.', rating: 1 },
    { comment: 'Fast delivery and well packed.', rating: 5 },
    { comment: 'Not what I expected from the photos.', rating: 2 },
  ]

  const createdReviews = await Promise.all(
    reviews.map((review) =>
      payload.create({ collection: 'reviews', data: review, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${createdReviews.length} reviews`)

  // Seed Campaigns
  const campaigns = [
    { name: 'Spring Sale', endDate: '2026-04-30', startDate: '2026-04-01' },
    { name: 'Back to School', endDate: '2026-09-15', startDate: '2026-08-15' },
    { name: 'Black Friday', endDate: '2026-11-30', startDate: '2026-11-27' },
  ]

  const createdCampaigns = await Promise.all(
    campaigns.map((campaign) =>
      payload.create({ collection: 'campaigns', data: campaign, overrideAccess: true }),
    ),
  )

  payload.logger.info(`Created ${createdCampaigns.length} campaigns`)

  // Seed Newsletters
  const newsletters = ['Monthly Digest: September', 'Product Updates', 'Black Friday Preview']

  const createdNewsletters = await Promise.all(
    newsletters.map((subject) =>
      payload.create({
        collection: 'newsletters',
        data: { body: null, subject },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${createdNewsletters.length} newsletters`)

  // Seed Subscribers
  const createdSubscribers = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      payload.create({
        collection: 'subscribers',
        data: { email: `subscriber${i + 1}@example.com` },
        overrideAccess: true,
      }),
    ),
  )

  payload.logger.info(`Created ${createdSubscribers.length} subscribers`)

  // Seed Globals
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      // Add any default data for site-settings if needed
    },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'footer-settings',
    data: {
      // Add any default data for footer-settings if needed
    },
    overrideAccess: true,
  })

  payload.logger.info('Globals updated')

  payload.logger.info('✅ Database seeded successfully!')
}
