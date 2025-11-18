'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Loader2, AlertTriangle } from 'lucide-react'
import { decryptWalletData } from '@/lib/wallet-utils'
import { useLanguage } from '@/contexts/language-context'
import LanguageSwitcher from './language-switcher'
import { securityManager } from '@/lib/security-manager'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WalletUnlockProps {
  onUnlock: (wallet: any) => void
  onBack: () => void
}

export default function WalletUnlock({ onUnlock, onBack }: WalletUnlockProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const isLocked = securityManager.isAccountLocked()
  const loginAttempts = securityManager.getLoginAttempts()
  const maxAttempts = securityManager.getSettings().maxLoginAttempts

  const handleUnlock = async () => {
    if (isLocked) {
      setError(t.unlock?.accountLocked || 'Account locked. Too many failed attempts.')
      return
    }

    if (!password) {
      setError(t.unlock.enterPassword)
      return
    }

    setLoading(true)
    setError('')

    try {
      const encryptedData = localStorage.getItem('solary_wallet')
      if (!encryptedData) {
        setError(t.unlock.noWallet)
        return
      }

      const walletData = await decryptWalletData(encryptedData, password)
      
      securityManager.recordLoginAttempt(true)
      onUnlock(walletData.wallet)
    } catch (err) {
      securityManager.recordLoginAttempt(false)
      
      const remainingAttempts = maxAttempts - (loginAttempts + 1)
      if (remainingAttempts > 0) {
        setError(`${t.unlock.invalidPassword}. ${remainingAttempts} attempts remaining.`)
      } else {
        setError(t.unlock?.accountLocked || 'Account locked. Too many failed attempts.')
      }
      console.error('Decryption error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockAccount = () => {
    securityManager.unlockAccount()
    setError('')
    window.location.reload()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLocked) handleUnlock()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0b0b0b] via-[#1a0a14] to-[#0b0b0b]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b005d] to-[#d4308e] flex items-center justify-center shadow-2xl">
              <Lock className="w-8 h-8 text-[#f8e1f4]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>
            {t.unlock.title}
          </h1>
          <p className="text-sm text-[#c0c0c0]">{t.unlock.subtitle}</p>
        </div>

        <div className="bg-[#1a0a14]/50 border border-[#8b005d]/20 rounded-3xl p-8 space-y-6 backdrop-blur-sm">
          {isLocked && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {t.unlock?.accountLocked || 'Account locked due to too many failed attempts.'}
              </AlertDescription>
            </Alert>
          )}

          {!isLocked && loginAttempts > 0 && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-400">
                {maxAttempts - loginAttempts} attempts remaining
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#f8e1f4] mb-3">{t.unlock.passwordLabel}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.unlock.passwordPlaceholder}
              disabled={isLocked}
              className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4] placeholder-[#c0c0c0]/50"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {isLocked ? (
            <Button
              onClick={handleUnlockAccount}
              className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#9b1d6d] hover:to-[#e0409e] text-[#f8e1f4]"
            >
              {t.unlock?.unlockAccount || 'Unlock Account'}
            </Button>
          ) : (
            <Button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#9b1d6d] hover:to-[#e0409e] text-[#f8e1f4] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.unlock.unlocking}
                </>
              ) : (
                t.unlock.unlockButton
              )}
            </Button>
          )}

          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full text-[#c0c0c0] hover:text-[#f8e1f4] hover:bg-[#2a1a24]"
          >
            {t.common.back}
          </Button>
        </div>
      </div>
    </div>
  )
}
