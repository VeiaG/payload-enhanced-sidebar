'use client'

import {
  Account,
  RenderCustomComponent,
  useAuth,
  useConfig,
  useEmbed,
  UserMenu,
} from '@payloadcms/ui'
import React from 'react'

import './index.css'

type UserMenuProps = React.ComponentProps<typeof UserMenu>

export type RailUserMenuProps = Pick<
  UserMenuProps,
  'CustomAvatar' | 'CustomLogoutButton' | 'settingsItemGroups'
>

const baseClass = 'enhanced-sidebar-user'

/**
 * The user's initial on a rounded tile — stands in for Payload's default account icon, which is
 * drawn as a circle. SVG with a viewBox, so it scales to whatever box it is put in.
 */
const InitialAvatar: React.FC = () => {
  const { user } = useAuth()
  const {
    config: {
      admin: { user: userSlug },
    },
    getEntityConfig,
  } = useConfig()

  const useAsTitle = getEntityConfig({ collectionSlug: userSlug })?.admin?.useAsTitle
  const title = useAsTitle ? (user as Record<string, unknown> | null)?.[useAsTitle] : undefined
  const name =
    (typeof title === 'string' && title.trim()) || user?.username || user?.email || ''
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <svg
      aria-hidden="true"
      className={`${baseClass}__initial`}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="24" width="24" />
      <text dominantBaseline="central" textAnchor="middle" x="12" y="12.5">
        {initial}
      </text>
    </svg>
  )
}

/**
 * Payload's account menu as an avatar button for the tabs rail. The menu itself (profile,
 * theme, language, settings, logout) is Payload's `UserMenu`, untouched; its trigger has no
 * avatar and its sub-menus aren't exported, so the avatar is laid over the trigger instead
 * and the trigger is reshaped in CSS.
 *
 * Avatar: the project's custom `admin.avatar` component as is; Gravatar through Payload's
 * `Account`; otherwise the user's initial instead of Payload's round default icon. The same
 * avatar is handed to `UserMenu`, so the menu's profile header matches.
 */
export const RailUserMenu: React.FC<RailUserMenuProps> = ({
  CustomAvatar,
  CustomLogoutButton,
  settingsItemGroups,
}) => {
  const {
    config: {
      admin: { avatar },
    },
  } = useConfig()
  const { user } = useAuth()
  const { isEmbedded } = useEmbed()

  // Embedded admin has no user menu, as in Payload's own nav
  if (isEmbedded) {
    return null
  }

  const avatarNode =
    CustomAvatar ??
    (avatar === 'gravatar' && user?.email ? <Account /> : <InitialAvatar />)

  return (
    <div className={baseClass}>
      <UserMenu
        CustomAvatar={avatarNode}
        CustomLogoutButton={CustomLogoutButton}
        settingsItemGroups={settingsItemGroups}
      />
      {/* Decorative: clicks go to the trigger underneath */}
      <span aria-hidden className={`${baseClass}__avatar`}>
        <RenderCustomComponent CustomComponent={avatarNode} Fallback={<Account />} />
      </span>
    </div>
  )
}
