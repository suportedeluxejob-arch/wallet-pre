'use client'

import { useState, useEffect } from 'react'
import { securityManager, SecuritySettings, SecuritySession } from '@/lib/security-enhanced'

export function useSecurity() {
  const [session, setSession] = useState<SecuritySession | null>(null)
  const [settings, setSettings] = useState<SecuritySettings>(securityManager.getSettings())
  const [timeUntilLock, setTimeUntilLock] = useState<number | null>(null)

  useEffect(() => {
    // Load session
    const currentSession = securityManager.getSession()
    setSession(currentSession)

    // Update activity on user interactions
    const handleActivity = () => {
      securityManager.updateActivity()
      setSession(securityManager.getSession())
    }

    // Listen for lock events
    const unsubscribe = securityManager.onLock(() => {
      setSession(securityManager.getSession())
    })

    // Activity listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Update timer
    const timerInterval = setInterval(() => {
      const time = securityManager.getTimeUntilLock()
      setTimeUntilLock(time)
    }, 1000)

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
      clearInterval(timerInterval)
      unsubscribe()
    }
  }, [])

  const lockWallet = () => {
    securityManager.lockWallet()
    setSession(securityManager.getSession())
  }

  const unlockWallet = () => {
    securityManager.unlockWallet()
    setSession(securityManager.getSession())
  }

  const updateSettings = (newSettings: Partial<SecuritySettings>) => {
    securityManager.updateSettings(newSettings)
    setSettings(securityManager.getSettings())
  }

  const registerBiometrics = async (walletAddress: string) => {
    return await securityManager.registerBiometrics(walletAddress)
  }

  const authenticateWithBiometrics = async () => {
    return await securityManager.authenticateWithBiometrics()
  }

  return {
    session,
    settings,
    timeUntilLock,
    isLocked: session?.isLocked ?? true,
    isBiometricsAvailable: securityManager.isBiometricsAvailable(),
    lockWallet,
    unlockWallet,
    updateSettings,
    registerBiometrics,
    authenticateWithBiometrics,
  }
}
