'use client'
import type { NavPreferences } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { NavGroup, useConfig, useTranslation } from '@payloadcms/ui'
import { EntityType } from '@payloadcms/ui/shared'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React, { Fragment } from 'react'

import type { BadgeConfig, ExtendedGroup } from '../../types'

import { NavItem } from './NavItem'

export const EnhancedSidebarClient: React.FC<{
  badges?: Record<string, BadgeConfig>
  groups: ExtendedGroup[]
  navPreferences: NavPreferences | null
}> = ({ badges, groups, navPreferences }) => {
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
        const translatedLabel = getTranslation(groupLabel, i18n)

        const properKey = `${translatedLabel}-${key}`

        const content = entities.map((entity, i) => {
          const { slug } = entity
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
          const isCurrentPage = pathname === href

          // Get badge config for this entity
          const badgeConfig = badges?.[slug]

          return (
            <NavItem
              badgeConfig={badgeConfig}
              entity={entity}
              href={href}
              id={id}
              isActive={isActive}
              isCurrentPage={isCurrentPage}
              key={i}
            />
          )
        })

        // For ungrouped items, render without NavGroup wrapper
        if (isUngrouped) {
          return <Fragment key={properKey}>{content}</Fragment>
        }
        //TODO:
        return (
          <NavGroup
            isOpen={navPreferences?.groups?.[translatedLabel]?.open}
            key={properKey}
            label={translatedLabel}
          >
            {content}
          </NavGroup>
        )
      })}
    </Fragment>
  )
}
