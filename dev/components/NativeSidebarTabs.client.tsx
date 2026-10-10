'use client'

import { Button, useConfig, useRouter, useSidebarTabs } from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

/** Re-renders a server tab in place through `useSidebarTabs().reloadTabContent`. */
export const ReloadTabButton = ({ tabSlug }: { tabSlug: string }) => {
  const sidebarTabs = useSidebarTabs()

  if (!sidebarTabs) {
    return null
  }

  return (
    <Button
      buttonStyle="ghost"
      margin={false}
      onClick={() => sidebarTabs.reloadTabContent(tabSlug)}
    >
      Reload
    </Button>
  )
}

const QUICK_CREATE = [
  { collection: 'posts', label: 'New post' },
  { collection: 'articles', label: 'New article' },
  { collection: 'products', label: 'New product' },
  { collection: 'campaigns', label: 'New campaign' },
]

/** A client-only tab: no server rendering, so it is pre-rendered and never revalidated. */
export const QuickCreateTab = () => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const router = useRouter()
  const sidebarTabs = useSidebarTabs()

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--base) / 2)', padding: 'var(--base)' }}>
      <strong>Quick create</strong>
      {QUICK_CREATE.map(({ collection, label }) => (
        <Button
          buttonStyle="secondary"
          key={collection}
          margin={false}
          onClick={() =>
            router.push(formatAdminURL({ adminRoute, path: `/collections/${collection}/create` }))
          }
        >
          {label}
        </Button>
      ))}
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: '12px' }}>
        Active tab: {sidebarTabs?.activeTabSlug ?? '—'}
      </p>
    </div>
  )
}

const NOTES_KEY = 'dev-sidebar-notes'

/** Per-browser scratch notes, to see a stateful client tab survive tab switches. */
export const NotesTab = () => {
  const [notes, setNotes] = React.useState('')

  // Loaded after mount: the tab is server-rendered first, where there is no localStorage
  React.useEffect(() => {
    try {
      setNotes(window.localStorage.getItem(NOTES_KEY) ?? '')
    } catch {
      // Storage unavailable: start empty
    }
  }, [])

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--base) / 2)', padding: 'var(--base)' }}>
      <strong>Notes</strong>
      <textarea
        aria-label="Notes"
        onChange={(e) => {
          setNotes(e.target.value)
          try {
            window.localStorage.setItem(NOTES_KEY, e.target.value)
          } catch {
            // Storage unavailable: keep the notes in memory only
          }
        }}
        placeholder="Jot something down…"
        rows={10}
        style={{ resize: 'vertical', width: '100%' }}
        value={notes}
      />
    </div>
  )
}

const HELP_LINKS = [
  { href: 'https://payloadcms.com/docs', label: 'Payload docs' },
  {
    href: 'https://payloadcms.com/docs/custom-components/root-components',
    label: 'Root components',
  },
  { href: 'https://payload.veiag.dev/', label: 'Enhanced sidebar docs' },
]

/** Static links, the simplest possible tab. */
export const HelpTab = () => (
  <div style={{ display: 'grid', gap: 'calc(var(--base) / 2)', padding: 'var(--base)' }}>
    <strong>Help</strong>
    {HELP_LINKS.map(({ href, label }) => (
      <a href={href} key={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    ))}
  </div>
)
