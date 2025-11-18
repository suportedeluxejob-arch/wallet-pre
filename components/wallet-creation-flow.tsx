'use client'

import { useState } from 'react'
import { generateWallet } from '@/lib/wallet-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Lock, CheckCircle2, Copy, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import LanguageSwitcher from './language-switcher'

interface WalletCreationFlowProps {
  onWalletCreated: (wallet: any) => void
  onBack: () => void
}

export default function WalletCreationFlow({ onWalletCreated, onBack }: WalletCreationFlowProps) {
  const [step, setStep] = useState(1) // 1: Generate, 2: Show Seed, 3: Verify, 4: Password
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSeed, setShowSeed] = useState(false)
  const [verificationWords, setVerificationWords] = useState<{ index: number; word: string }[]>([])
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({})
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  // Step 1: Generate wallet
  const handleGenerateWallet = async () => {
    setLoading(true)
    try {
      const newWallet = await generateWallet()
      setWallet(newWallet)
      
      // Select 3 random words for verification
      const seedWords = newWallet.seedPhrase.split(' ')
      const randomIndices = Array.from({ length: 3 }, () => Math.floor(Math.random() * 12))
      const verification = randomIndices.map(idx => ({
        index: idx,
        word: seedWords[idx],
      }))
      setVerificationWords(verification)
      setStep(2)
    } catch (error) {
      console.error('Error generating wallet:', error)
    }
    setLoading(false)
  }

  // Step 2: Copy seed phrase
  const handleCopySeed = async () => {
    await navigator.clipboard.writeText(wallet.seedPhrase)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Step 2 -> 3: Proceed to verification
  const handleProceedToVerify = () => {
    setStep(3)
  }

  // Step 3: Verify seed phrase
  const handleVerifyWords = () => {
    const allCorrect = verificationWords.every(
      item => userAnswers[item.index]?.toLowerCase().trim() === item.word.toLowerCase()
    )
    
    if (allCorrect) {
      setStep(4)
    } else {
      alert('Some words are incorrect. Please try again.')
    }
  }

  // Step 4: Set password and save
  const handleSetPassword = async () => {
    if (!password || !confirmPassword) {
      alert('Please enter and confirm your password')
      return
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const { encryptWalletData } = await import('@/lib/wallet-utils')
      
      const walletData = {
        wallet,
        createdAt: new Date().toISOString(),
      }
      
      const encrypted = await encryptWalletData(walletData, password)
      localStorage.setItem('solary_wallet', encrypted)
      
      onWalletCreated(wallet)
    } catch (error) {
      console.error('Error saving wallet:', error)
      alert('Failed to save wallet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0b0b0b] via-[#1a0a14] to-[#0b0b0b]">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]'
                    : 'bg-[#2a1a24] text-[#c0c0c0]'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 w-12 mx-2 transition-all ${
                    step > s ? 'bg-[#8b005d]' : 'bg-[#2a1a24]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-[#c0c0c0]">
          <span>{t.creation.steps.generate}</span>
          <span>{t.creation.steps.backup}</span>
          <span>{t.creation.steps.verify}</span>
          <span>{t.creation.steps.password}</span>
        </div>

        {/* Content */}
        <div className="bg-[#1a0a14]/50 border border-[#8b005d]/20 rounded-3xl p-8 space-y-6 backdrop-blur-sm">
          
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#f8e1f4] mb-2" style={{ fontFamily: 'Poppins' }}>
                  {t.creation.step1.title}
                </h2>
                <p className="text-[#c0c0c0]">{t.creation.step1.desc}</p>
              </div>

              <div className="bg-[#8b005d]/10 border border-[#8b005d]/30 rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <Lock className="w-5 h-5 text-[#8b005d] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#c0c0c0]">
                    <p className="font-semibold text-[#f8e1f4] mb-1">{t.creation.step1.securityTitle}</p>
                    <p>{t.creation.step1.securityDesc}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateWallet}
                disabled={loading}
                className="w-full py-6 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#9b1d6d] hover:to-[#e0409e] text-[#f8e1f4]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t.creation.step1.generating}
                  </>
                ) : (
                  <>
                    {t.creation.step1.button} <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 2 && wallet && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#f8e1f4] mb-2" style={{ fontFamily: 'Poppins' }}>
                  {t.creation.step2.title}
                </h2>
                <p className="text-[#c0c0c0]">{t.creation.step2.desc}</p>
              </div>

              <div className="bg-[#8b005d]/10 border border-[#8b005d]/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-[#f8e1f4]">{t.creation.step2.seedTitle}</p>
                  <button onClick={() => setShowSeed(!showSeed)} className="text-[#8b005d]">
                    {showSeed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {showSeed ? (
                  <div className="grid grid-cols-3 gap-3">
                    {wallet.seedPhrase.split(' ').map((word: string, idx: number) => (
                      <div key={idx} className="bg-[#0b0b0b] border border-[#3a2a34] rounded-lg p-3 text-center">
                        <p className="text-xs text-[#c0c0c0] mb-1">{idx + 1}</p>
                        <p className="text-[#f8e1f4] font-mono font-semibold">{word}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div key={idx} className="bg-[#0b0b0b] border border-[#3a2a34] rounded-lg p-3 text-center">
                        <p className="text-xs text-[#c0c0c0] mb-1">{idx + 1}</p>
                        <p className="text-[#c0c0c0]">●●●●●</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleCopySeed}
                  className="w-full py-3 text-sm font-semibold rounded-xl bg-[#2a1a24] hover:bg-[#3a2a34] text-[#f8e1f4] border border-[#8b005d]/30"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? t.common.copied : t.creation.step2.copyButton}
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={onBack}
                  variant="ghost"
                  className="flex-1 text-[#c0c0c0]"
                >
                  {t.common.back}
                </Button>
                <Button
                  onClick={handleProceedToVerify}
                  className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
                >
                  {t.creation.step2.savedButton}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#f8e1f4] mb-2" style={{ fontFamily: 'Poppins' }}>
                  {t.creation.step3.title}
                </h2>
                <p className="text-[#c0c0c0]">{t.creation.step3.desc}</p>
              </div>

              <div className="space-y-4">
                {verificationWords.map(item => (
                  <div key={item.index}>
                    <label className="block text-sm font-semibold text-[#f8e1f4] mb-2">
                      {t.creation.step3.wordLabel}{item.index + 1}
                    </label>
                    <Input
                      type="text"
                      value={userAnswers[item.index] || ''}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [item.index]: e.target.value })}
                      placeholder={t.creation.step3.placeholder}
                      className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4] placeholder-[#c0c0c0]/50"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(2)}
                  variant="ghost"
                  className="flex-1 text-[#c0c0c0]"
                >
                  {t.common.back}
                </Button>
                <Button
                  onClick={handleVerifyWords}
                  className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
                >
                  {t.creation.step3.verifyButton}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-[#f8e1f4] mb-2" style={{ fontFamily: 'Poppins' }}>
                  {t.creation.step4.title}
                </h2>
                <p className="text-[#c0c0c0]">{t.creation.step4.desc}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#f8e1f4] mb-2">{t.creation.step4.passwordLabel}</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.creation.step4.passwordPlaceholder}
                    className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4] placeholder-[#c0c0c0]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#f8e1f4] mb-2">{t.creation.step4.confirmLabel}</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.creation.step4.confirmPlaceholder}
                    className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4] placeholder-[#c0c0c0]/50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(3)}
                  variant="ghost"
                  className="flex-1 text-[#c0c0c0]"
                >
                  {t.common.back}
                </Button>
                <Button
                  onClick={handleSetPassword}
                  className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
                >
                  {t.creation.step4.createButton}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
