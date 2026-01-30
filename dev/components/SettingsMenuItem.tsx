'use client'
import { PopupList } from '@payloadcms/ui'
import React from 'react'

export const SettingsMenuItem: React.FC = () => {
  return (
    <PopupList.ButtonGroup>
      <PopupList.Button onClick={() => console.log('Account clicked')}>
        My Account
      </PopupList.Button>
      <PopupList.Button onClick={() => console.log('Preferences clicked')}>
        Preferences
      </PopupList.Button>
    </PopupList.ButtonGroup>
  )
}

export const AnotherSettingsItem: React.FC = () => {
  return (
    <PopupList.ButtonGroup>
      <PopupList.Button onClick={() => window.open('https://payloadcms.com', '_blank')}>
        Payload Docs
      </PopupList.Button>
    </PopupList.ButtonGroup>
  )
}
