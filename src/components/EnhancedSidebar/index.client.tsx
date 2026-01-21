'use client'
import type { NavPreferences } from 'payload'
import type { ExtendedGroup } from 'src/types'

import { getTranslation } from '@payloadcms/translations'
import { Link, NavGroup, useConfig, useTranslation } from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

const baseClass = 'enhanced-sidebar'

export const EnhancedSidebarClient: React.FC<{
  groups: ExtendedGroup[]
  navPreferences: NavPreferences | null
}> = ({ groups, navPreferences }) => {
  const pathname = usePathname()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const { i18n } = useTranslation()

  return (
    <Fragment>
      {groups.map(({ entities, label }, key) => {
        // Handle empty label (ungrouped items)
        const groupLabel = label || ''
        const isUngrouped = !label || (typeof label === 'string' && label === '')

        const content = entities.map((entity, i) => {
          const { slug, label: entityLabel } = entity
          const entityType = entity.type
          let href: string
          let id: string

          // Check for collection
          //@ts-expect-error Idk why typescript is complaining here
          if (entityType === EntityType.collection) {
            href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })
            id = `nav-${slug}`
            //@ts-expect-error Idk why typescript is complaining here
          } else if (entityType === EntityType.global) {
            href = formatAdminURL({ adminRoute, path: `/globals/${slug}` })
            id = `nav-global-${slug}`
          } else if (entityType === 'custom' && entity.href) {
            // Custom item with href
            id = `nav-custom-${slug}`
            if (entity.isExternal) {
              href = entity.href
            } else {
              href = formatAdminURL({ adminRoute, path: entity.href })
            }
          } else {
            return null
          }

          const isActive =
            pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

          const Label = (
            <>
              {isActive && <div className={`${baseClass}__link-indicator`} />}
              <span className={`${baseClass}__link-label`}>
                {getTranslation(entityLabel, i18n)}
              </span>
            </>
          )

          if (pathname === href) {
            return (
              <div className={`${baseClass}__link`} id={id} key={i}>
                {Label}
              </div>
            )
          }

          return (
            <Link className={`${baseClass}__link`} href={href} id={id} key={i} prefetch={false}>
              {Label}
            </Link>
          )
        })

        // For ungrouped items, render without NavGroup wrapper
        if (isUngrouped) {
          return <Fragment key={key}>{content}</Fragment>
        }

        // Get translated label for NavGroup
        const translatedLabel = getTranslation(groupLabel, i18n)

        return (
          <NavGroup
            isOpen={navPreferences?.groups?.[translatedLabel]?.open}
            key={key}
            label={translatedLabel}
          >
            {content}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
