'use client'

import { BadgeProvider } from '@veiag/payload-enhanced-sidebar'
import React, { useEffect, useState } from 'react'

/**
 * Test provider that demonstrates reactive badge values.
 * In real usage, you might fetch from an API, subscribe to websockets, etc.
 */
export const TestBadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counts, setCounts] = useState({
    // Initial values
    'notifications-tab': 3,
    orders: 0,
  })

  // Simulate changing values (for demo purposes)
  useEffect(() => {
    // Simulate new orders coming in
    const interval = setInterval(() => {
      setCounts((prev) => ({
        ...prev,
        orders: Math.floor(Math.random() * 10),
      }))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return <BadgeProvider values={counts}>{children}</BadgeProvider>
}
