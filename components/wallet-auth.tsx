'use client'

import { useState } from 'react'
import { importWallet } from '@/lib/wallet-utils'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import LanguageSwitcher from './language-switcher'

interface WalletAuthProps {
  onCreateNew: () => void
  onWalletCreated: (wallet: any) => void
}

export default function WalletAuth({ onCreateNew, onWalletCreated }: WalletAuthProps) {
  const [mode, setMode] = useState<'choice' | 'import'>('choice')
  const [seedInput, setSeedInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useLanguage()

  const handleImport = async () => {
    if (!seedInput.trim()) {
      setError(t.import.enterSeed)
      return
    }

    setLoading(true)
    setError('')
    try {
      const wallet = await importWallet(seedInput.trim())
      onWalletCreated(wallet)
    } catch (err) {
      setError(t.import.invalidSeed)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0b0b0b] via-[#1a0a14] to-[#0b0b0b]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Logo and Branding */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b005d] to-[#d4308e] flex items-center justify-center shadow-2xl">
              <Lock className="w-8 h-8 text-[#f8e1f4]" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>
            {t.auth.title}
          </h1>
          <p className="text-sm text-[#c0c0c0]">{t.auth.subtitle}</p>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {mode === 'choice' && (
            <>
              {/* Security Info */}
              <div className="bg-[#8b005d]/10 border border-[#8b005d]/30 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#8b005d] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-[#c0c0c0]">
                  <p className="font-semibold text-[#f8e1f4] mb-1">{t.auth.securityTitle}</p>
                  <p>{t.auth.securityDesc}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <Button
                onClick={onCreateNew}
                className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#9b1d6d] hover:to-[#e0409e] text-[#f8e1f4]"
              >
                {t.auth.createNew}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#3a2a34]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-[#0b0b0b] text-[#c0c0c0]">{t.auth.or}</span>
                </div>
              </div>

              <Button
                onClick={() => setMode('import')}
                className="w-full py-6 text-lg font-semibold rounded-2xl border-2 border-[#8b005d] bg-transparent text-[#8b005d] hover:bg-[#8b005d]/10"
              >
                {t.auth.importExisting}
              </Button>
            </>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <textarea
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder={t.import.placeholder}
                className="w-full p-4 bg-[#1a0a14] border-2 border-[#3a2a34] rounded-2xl text-[#f8e1f4] placeholder-[#c0c0c0]/50 focus:border-[#8b005d] focus:outline-none"
                rows={4}
              />
              <Button
                onClick={handleImport}
                disabled={loading}
                className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t.import.importing}
                  </>
                ) : (
                  t.import.button
                )}
              </Button>
              <Button
                onClick={() => {
                  setMode('choice')
                  setError('')
                  setSeedInput('')
                }}
                variant="ghost"
                className="w-full text-[#c0c0c0]"
              >
                {t.common.back}
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
