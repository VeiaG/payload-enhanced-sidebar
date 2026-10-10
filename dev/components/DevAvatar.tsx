import React from 'react'

/**
 * Custom `admin.avatar` for the dev app, to see a real photo in the account menu.
 */
export const DevAvatar: React.FC = () => (
  <img
    alt="Avatar"
    height={24}
    src="/dev-avatar.jpg"
    style={{ display: 'block', objectFit: 'cover' }}
    width={24}
  />
)
