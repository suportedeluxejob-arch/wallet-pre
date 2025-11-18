'use client'

import { useEffect, useCallback } from 'react'
import { securityManager } from '@/lib/security-manager'

export function useAutoLock(onLock: () => void) {
  const checkAutoLock = useCallback(() => {
    if (securityManager.shouldAutoLock()) {
      securityManager.logSecurityEvent('auto_lock', 'Wallet auto-locked due to inactivity')
      onLock()
    }
  }, [onLock])

  const updateActivity = useCallback(() => {
    securityManager.updateLastActivity()
  }, [])

  useEffect(() => {
    // Update activity on mount
    updateActivity()

    // Check for auto-lock every 30 seconds
    const lockCheckInterval = setInterval(checkAutoLock, 30000)

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    return () => {
      clearInterval(lockCheckInterval)
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  }, [checkAutoLock, updateActivity])
}
