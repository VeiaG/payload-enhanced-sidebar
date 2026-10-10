'use client'

import { Account, RenderCustomComponent, UserMenu } from '@payloadcms/ui'
import React from 'react'

import './index.scss'

type UserMenuProps = React.ComponentProps<typeof UserMenu>

export type RailUserMenuProps = Pick<
  UserMenuProps,
  'CustomAvatar' | 'CustomLogoutButton' | 'settingsItemGroups'
>

const baseClass = 'enhanced-sidebar-user'

/**
 * Payload's account menu as an avatar button for the tabs rail. The menu itself (profile,
 * theme, language, settings, logout) is Payload's `UserMenu`, untouched; its trigger has no
 * avatar and its sub-menus aren't exported, so the avatar is laid over the trigger instead
 * and the trigger is reshaped in CSS.
 */
export const RailUserMenu: React.FC<RailUserMenuProps> = ({
  CustomAvatar,
  CustomLogoutButton,
  settingsItemGroups,
}) => (
  <div className={baseClass}>
    <UserMenu
      CustomAvatar={CustomAvatar}
      CustomLogoutButton={CustomLogoutButton}
      settingsItemGroups={settingsItemGroups}
    />
    {/* Decorative: clicks go to the trigger underneath */}
    <span aria-hidden className={`${baseClass}__avatar`}>
      <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
    </span>
  </div>
)
