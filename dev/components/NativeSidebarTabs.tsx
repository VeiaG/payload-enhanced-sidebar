import type { CollectionSlug, PayloadRequest, ServerProps } from 'payload'

import { Link } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { ReloadTabButton } from './NativeSidebarTabs.client'

/**
 * Content for Payload's own `admin.components.sidebar.tabs` (not the plugin's tabs).
 * Server components: rendered on first load when the tab is active, otherwise lazily
 * through the `render-tab` server function, and re-rendered every time the tab is opened.
 */

type TabProps = { req?: PayloadRequest } & ServerProps

const RECENT_COLLECTIONS: CollectionSlug[] = ['posts', 'articles', 'products']

const STATS_COLLECTIONS: CollectionSlug[] = [
  'posts',
  'pages',
  'articles',
  'products',
  'orders',
  'customers',
  'subscribers',
]

const styles = {
  heading: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0 0 var(--base)',
  },
  list: { display: 'grid', gap: 'calc(var(--base) / 2)', listStyle: 'none', margin: 0, padding: 0 },
  muted: { color: 'var(--theme-elevation-500)', fontSize: '12px' },
  row: { display: 'flex', justifyContent: 'space-between' },
  wrap: { padding: 'var(--base)' },
} satisfies Record<string, React.CSSProperties>

const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { hour12: false })

/** The latest edits across a few collections, read as the current user. */
export const RecentTab = async ({ payload, req }: TabProps) => {
  const results = await Promise.all(
    RECENT_COLLECTIONS.map((collection) =>
      payload
        .find({
          collection,
          depth: 0,
          limit: 5,
          overrideAccess: false,
          req,
          sort: '-updatedAt',
        })
        .then(({ docs }) =>
          docs.map((doc) => {
            const { admin, labels } = payload.collections[collection].config
            const titleField = admin.useAsTitle
            const title = (doc as Record<string, unknown>)[titleField]

            return {
              id: doc.id,
              collection,
              collectionLabel: typeof labels.singular === 'string' ? labels.singular : collection,
              title: typeof title === 'string' && title ? title : String(doc.id),
              updatedAt: doc.updatedAt as string,
            }
          }),
        ),
    ),
  )

  const recent = results
    .flat()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)

  return (
    <div style={styles.wrap}>
      <div style={styles.heading}>
        <strong>Recently edited</strong>
        <ReloadTabButton tabSlug="recent" />
      </div>
      <ul style={styles.list}>
        {recent.map((doc) => (
          <li key={`${doc.collection}-${doc.id}`}>
            <Link
              href={formatAdminURL({
                adminRoute: payload.config.routes.admin,
                path: `/collections/${doc.collection}/${doc.id}`,
              })}
            >
              {doc.title}
            </Link>
            <div style={styles.muted}>
              {doc.collectionLabel} · {new Date(doc.updatedAt).toLocaleString('en-GB')}
            </div>
          </li>
        ))}
      </ul>
      <p style={{ ...styles.muted, marginTop: 'var(--base)' }}>
        Rendered at {formatTime(new Date())}
      </p>
    </div>
  )
}

/** Document counts per collection, respecting the current user's access. */
export const StatsTab = async ({ payload, req }: TabProps) => {
  const counts = await Promise.all(
    STATS_COLLECTIONS.map(async (collection) => {
      const { labels } = payload.collections[collection].config
      const { totalDocs } = await payload.count({ collection, overrideAccess: false, req })

      return {
        collection,
        label: typeof labels.plural === 'string' ? labels.plural : collection,
        totalDocs,
      }
    }),
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.heading}>
        <strong>Stats</strong>
        <ReloadTabButton tabSlug="stats" />
      </div>
      <ul style={styles.list}>
        {counts.map(({ collection, label, totalDocs }) => (
          <li key={collection} style={styles.row}>
            <span>{label}</span>
            <strong>{totalDocs}</strong>
          </li>
        ))}
      </ul>
      <p style={{ ...styles.muted, marginTop: 'var(--base)' }}>
        Rendered at {formatTime(new Date())}
      </p>
    </div>
  )
}
