'use client'

import { DelayedSpinner, SidebarTabsProvider, TabError, useServerFunctions } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useEnhancedSidebar } from '../context.js'
import { useTabState } from '../hooks/useTabState.js'
import { NavContentShell } from '../NavContent/index.js'

type RenderTabResult = { component: React.ReactNode }

export type LazyTabViewProps = {
  /** Our tab id */
  id: string
  /** Content rendered on the server when this tab was the active one on load */
  initialContent?: React.ReactNode
  /** Slug the tab is registered under in `admin.components.sidebar.tabs` */
  renderSlug: string
  /**
   * Wrap the content in `NavContentShell`. Payload's own tabs expect to sit inside the nav's
   * scroll area; a plugin `contentComponent` brings its own `<nav>`.
   */
  withShell?: boolean
}

/**
 * Renders a tab's content through Payload's `render-tab` server function, like Payload's own
 * sidebar does: on first open, then again each time the tab is reopened. While a reload runs
 * the previous content stays on screen; the spinner only shows before the first load.
 */
export const LazyTabView: React.FC<LazyTabViewProps> = ({
  id,
  initialContent,
  renderSlug,
  withShell,
}) => {
  const { activeTabId } = useEnhancedSidebar()
  const { isActive } = useTabState(id)
  const { serverFunction } = useServerFunctions()

  const [content, setContent] = useState<React.ReactNode>(initialContent)
  const [isLoading, setIsLoading] = useState(false)
  const hasContentRef = useRef(initialContent !== undefined)
  // Content rendered on the server is fresh for the first activation
  const skipNextLoadRef = useRef(initialContent !== undefined)

  const load = useCallback(
    async (serverArgs?: Record<string, unknown>) => {
      if (!hasContentRef.current) {
        setIsLoading(true)
      }
      try {
        const result = (await serverFunction({
          name: 'render-tab',
          args: { ...serverArgs, tabSlug: renderSlug },
        })) as RenderTabResult
        hasContentRef.current = true
        setContent(result.component)
      } catch (error) {
        // A failed reload keeps the content already on screen
        if (!hasContentRef.current) {
          setContent(
            <TabError
              message={error instanceof Error ? error.message : 'Unknown error'}
              onRetry={() => void load(serverArgs)}
            />,
          )
        }
      } finally {
        setIsLoading(false)
      }
    },
    [renderSlug, serverFunction],
  )

  useEffect(() => {
    if (!isActive) {
      return
    }
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false
      return
    }
    void load()
  }, [isActive, load])

  // `useSidebarTabs()` inside the content works as in Payload's nav. `reloadTabContent` only
  // reaches this tab: it is the one the content belongs to.
  const reloadTabContent = useCallback(
    (tabSlug: string, serverArgs?: Record<string, unknown>) => {
      if (tabSlug === id || tabSlug === renderSlug) {
        void load(serverArgs)
      }
    },
    [id, load, renderSlug],
  )

  const body = (
    <SidebarTabsProvider activeTabSlug={activeTabId} reloadTabContent={reloadTabContent}>
      <DelayedSpinner baseClass="enhanced-sidebar-lazy-tab" isLoading={isLoading} />
      {content}
    </SidebarTabsProvider>
  )

  return withShell ? <NavContentShell>{body}</NavContentShell> : body
}
