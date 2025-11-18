'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Fingerprint, Loader2 } from 'lucide-react'
import { useSecurity } from '@/hooks/use-security'
import { useLanguage } from '@/contexts/language-context'

interface WalletLockScreenProps {
  onUnlock: () => void
  walletAddress: string
}

export default function WalletLockScreen({ onUnlock, walletAddress }: WalletLockScreenProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { unlockWallet, authenticateWithBiometrics, settings, isBiometricsAvailable } = useSecurity()
  const { t } = useLanguage()

  const handlePasswordUnlock = async () => {
    if (!password) {
      setError(t.unlock?.enterPassword || 'Please enter your password')
      return
    }

    setLoading(true)
    setError('')
    
    // Simulate password verification (in real app, verify against stored hash)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    unlockWallet()
    onUnlock()
    setLoading(false)
  }

  const handleBiometricsUnlock = async () => {
    setLoading(true)
    setError('')
    
    try {
      const authenticated = await authenticateWithBiometrics()
      if (authenticated) {
        unlockWallet()
        onUnlock()
      } else {
        setError(t.unlock?.biometricsFailed || 'Biometric authentication failed')
      }
    } catch (err) {
      setError(t.unlock?.biometricsError || 'Biometrics not available')
    }
    
    setLoading(false)
  }

  const displayAddress = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-6)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0b0b0b] via-[#1a0a14] to-[#0b0b0b]">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8b005d] to-[#d4308e] flex items-center justify-center shadow-2xl">
              <Lock className="w-10 h-10 text-[#f8e1f4]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>
            {t.unlock?.title || 'Wallet Locked'}
          </h1>
          <p className="text-sm text-[#c0c0c0]">
            {displayAddress}
          </p>
        </div>

        {/* Unlock Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.unlock?.passwordPlaceholder || 'Enter your password'}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordUnlock()}
              className="bg-[#1a0a14] border-2 border-[#3a2a34] text-[#f8e1f4] placeholder-[#c0c0c0]/50 focus:border-[#8b005d] h-14 text-lg"
            />
            <Button
              onClick={handlePasswordUnlock}
              disabled={loading}
              className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.unlock?.unlocking || 'Unlocking...'}
                </>
              ) : (
                t.unlock?.unlockButton || 'Unlock Wallet'
              )}
            </Button>
          </div>

          {settings.biometricsEnabled && isBiometricsAvailable && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#3a2a34]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-[#0b0b0b] text-[#c0c0c0]">{t.auth?.or || 'or'}</span>
                </div>
              </div>

              <Button
                onClick={handleBiometricsUnlock}
                disabled={loading}
                className="w-full h-14 text-lg font-semibold rounded-2xl border-2 border-[#8b005d] bg-transparent text-[#8b005d] hover:bg-[#8b005d]/10"
              >
                <Fingerprint className="w-5 h-5 mr-2" />
                {t.unlock?.useBiometrics || 'Use Biometrics'}
              </Button>
            </>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
