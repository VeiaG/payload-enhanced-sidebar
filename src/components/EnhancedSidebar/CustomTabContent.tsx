'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useConfig, useTranslation } from '@payloadcms/ui'
import { usePathname } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { SidebarTabItem } from '../../types'

const baseClass = 'enhanced-sidebar'

export type CustomTabContentProps = {
  items: SidebarTabItem[]
}

export const CustomTabContent: React.FC<CustomTabContentProps> = ({ items }) => {
  const { i18n } = useTranslation()
  const pathname = usePathname()

  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <div className={`${baseClass}__custom-items`}>
      {items.map((item) => {
        const href = item.isExternal ? item.href : formatAdminURL({ adminRoute, path: item.href })
        const label = getTranslation(item.label, i18n)
        const isActive = pathname.startsWith(href)

        return (
          <Link
            className={`${baseClass}__link ${isActive ? `${baseClass}__link--active` : ''}`}
            href={href}
            key={item.slug}
            prefetch={false}
          >
            <span className={`${baseClass}__link-label`}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
