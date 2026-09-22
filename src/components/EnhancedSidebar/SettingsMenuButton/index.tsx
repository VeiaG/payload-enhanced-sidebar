'use client'
import { Popup, useTranslation } from '@payloadcms/ui'
import { Settings } from 'lucide-react'
import React, { Fragment } from 'react'

import './index.scss'

const baseClass = 'settings-menu-button'

export type SettingsMenuButtonProps = {
  settingsMenu?: React.ReactNode[]
}

export const SettingsMenuButton: React.FC<SettingsMenuButtonProps> = ({ settingsMenu }) => {
  const { t } = useTranslation()

  if (!settingsMenu || settingsMenu.length === 0) {
    return null
  }

  return (
    <Popup
      button={
        <span aria-label={t('general:menu')} className={`${baseClass}__button`}>
          <Settings size={20} />
        </span>
      }
      className={baseClass}
      horizontalAlign="right"
      id="settings-menu"
      size="small"
      verticalAlign="top"
    >
      {settingsMenu.map((item, i) => (
        <Fragment key={`settings-menu-item-${i}`}>{item}</Fragment>
      ))}
    </Popup>
  )
}
