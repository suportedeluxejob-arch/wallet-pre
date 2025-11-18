'use client'

import { useState, useEffect } from 'react'
import WalletAuth from '@/components/wallet-auth'
import WalletCreationFlow from '@/components/wallet-creation-flow'
import WalletDashboard from '@/components/wallet-dashboard'
import WalletUnlock from '@/components/wallet-unlock'
import { useAutoLock } from '@/hooks/use-auto-lock'

export default function Home() {
  const [wallet, setWallet] = useState<any>(null)
  const [mode, setMode] = useState<'auth' | 'creation' | 'unlock' | 'dashboard'>('auth')

  const handleAutoLock = () => {
    if (wallet && mode === 'dashboard') {
      setMode('unlock')
    }
  }

  useAutoLock(handleAutoLock)

  // Check if wallet exists on mount
  useEffect(() => {
    const hasWallet = localStorage.getItem('solary_wallet')
    if (hasWallet) {
      setMode('unlock')
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b0b0b' }}>
      {mode === 'auth' && (
        <WalletAuth
          onCreateNew={() => setMode('creation')}
          onWalletCreated={(w) => {
            setWallet(w)
            setMode('dashboard')
          }}
        />
      )}
      {mode === 'creation' && (
        <WalletCreationFlow
          onWalletCreated={(w) => {
            setWallet(w)
            setMode('dashboard')
          }}
          onBack={() => setMode('auth')}
        />
      )}
      {mode === 'unlock' && (
        <WalletUnlock
          onUnlock={(w) => {
            setWallet(w)
            setMode('dashboard')
          }}
          onBack={() => {
            setMode('auth')
            localStorage.removeItem('solary_wallet')
          }}
        />
      )}
      {mode === 'dashboard' && wallet && (
        <WalletDashboard wallet={wallet} onReset={() => {
          setWallet(null)
          setMode('unlock')
        }} />
      )}
    </div>
  )
}
