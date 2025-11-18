'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react'
import { generateWallet } from '@/lib/wallet-utils'

interface WalletCreationProps {
  onWalletCreated: (wallet: any) => void
}

export default function WalletCreation({ onWalletCreated }: WalletCreationProps) {
  const [step, setStep] = useState<'initial' | 'seed' | 'confirm'>('initial')
  const [seedPhrase, setSeedPhrase] = useState('')
  const [wallet, setWallet] = useState<any>(null)
  const [showSeed, setShowSeed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [agreedToWarning, setAgreedToWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateSeed = async () => {
    setIsLoading(true)
    try {
      const newWallet = await generateWallet()
      setSeedPhrase(newWallet.seedPhrase)
      setWallet(newWallet)
      setStep('seed')
    } catch (error) {
      console.error('Error generating wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seedPhrase)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmSeed = () => {
    setAgreedToWarning(false)
    onWalletCreated(wallet)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#8b005d] flex items-center justify-center glow-pink">
              <span className="text-2xl font-bold text-[#f8e1f4]">◆</span>
            </div>
            <h1 className="text-4xl font-bold text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>Solary</h1>
          </div>
          <p className="text-[#c0c0c0]">Premium Solana Wallet</p>
        </div>

        {/* Initial Step */}
        {step === 'initial' && (
          <Card className="glass-effect border-[#3a2a34] bg-[#1a0a14]/80">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>Welcome</CardTitle>
              <CardDescription className="text-[#c0c0c0]">Create a new Solana wallet to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#8b005d]/10 border border-[#8b005d]/30 rounded-[1rem] p-4 text-sm text-[#f8e1f4]">
                <p className="font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Important Security Notice</p>
                <p>Never share your seed phrase with anyone. It gives full access to your wallet and all your funds.</p>
              </div>
              <Button
                onClick={handleGenerateSeed}
                disabled={isLoading}
                className="w-full bg-[#8b005d] hover:bg-[#a0215d] text-[#f8e1f4] font-semibold py-2 h-auto disabled:opacity-50 rounded-[1rem] glow-pink-hover transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate New Wallet'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Seed Phrase Step */}
        {step === 'seed' && (
          <Card className="glass-effect border-[#3a2a34] bg-[#1a0a14]/80">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>Your Seed Phrase</CardTitle>
              <CardDescription className="text-[#c0c0c0]">Save this safely. You'll need it to recover your wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative bg-[#0b0b0b]/50 border border-[#3a2a34] rounded-[1rem] p-6 glow-pink">
                <div className="grid grid-cols-3 gap-3">
                  {seedPhrase.split(' ').map((word, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-[#2a1a24]/50 rounded-lg px-3 py-2 border border-[#3a2a34]/50">
                      <span className="text-[#c0c0c0] text-xs font-mono">{index + 1}.</span>
                      <span className={`font-mono text-sm ${showSeed ? 'text-[#8b005d]' : 'text-[#c0c0c0]'}`}>
                        {showSeed ? word : '••••'}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowSeed(!showSeed)}
                  className="absolute top-4 right-4 p-2 hover:bg-[#3a2a34]/50 rounded-lg transition-colors"
                >
                  {showSeed ? (
                    <EyeOff className="w-5 h-5 text-[#c0c0c0]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[#c0c0c0]" />
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopySeed}
                  variant="outline"
                  className="flex-1 border-[#3a2a34] text-[#f8e1f4] hover:bg-[#2a1a24] rounded-[1rem]"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  onClick={handleGenerateSeed}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 border-[#3a2a34] text-[#f8e1f4] hover:bg-[#2a1a24] rounded-[1rem] disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToWarning}
                    onChange={(e) => setAgreedToWarning(e.target.checked)}
                    className="w-4 h-4 rounded border-[#3a2a34] cursor-pointer"
                  />
                  <span className="text-sm text-[#c0c0c0]">
                    I have saved my seed phrase securely and understand the risks
                  </span>
                </label>
              </div>

              <Button
                onClick={handleConfirmSeed}
                disabled={!agreedToWarning}
                className="w-full bg-[#8b005d] hover:bg-[#a0215d] text-[#f8e1f4] font-semibold disabled:opacity-50 disabled:cursor-not-allowed py-2 h-auto rounded-[1rem] glow-pink-hover transition-all"
              >
                Continue to Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#c0c0c0]">
          Solary Wallet is a secure, client-side wallet. Your keys are never stored on our servers.
        </p>
      </div>
    </div>
  )
}
