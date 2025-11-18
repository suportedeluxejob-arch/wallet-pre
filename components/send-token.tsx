'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Send, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { sendTokenTransaction, isValidSolanaAddress, type SPLToken } from '@/lib/wallet-utils'

interface SendTokenProps {
  wallet: any
  token: SPLToken
  onBack: () => void
  onSuccess: () => void
}

export default function SendToken({ wallet, token, onBack, onSuccess }: SendTokenProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [signature, setSignature] = useState('')

  const handleSend = async () => {
    setError('')
    setSuccess(false)

    // Validation
    if (!recipient.trim()) {
      setError('Please enter a recipient address')
      return
    }

    if (!isValidSolanaAddress(recipient)) {
      setError('Invalid Solana address')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (amountNum > token.balance) {
      setError(`Insufficient balance. You have ${token.balance} ${token.symbol}`)
      return
    }

    try {
      setSending(true)
      const sig = await sendTokenTransaction(
        wallet.privateKey,
        recipient,
        token.mint,
        amountNum,
        token.decimals
      )
      
      setSignature(sig)
      setSuccess(true)
      setRecipient('')
      setAmount('')
      
      setTimeout(() => {
        onSuccess()
        onBack()
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to send tokens')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            className="w-10 h-10 p-0 bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] rounded-xl"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
              <Send className="w-5 h-5 text-[#8b005d]" />
              Send {token.symbol || 'Token'}
            </CardTitle>
            <CardDescription className="text-[#c0c0c0]">
              Balance: {token.balance.toLocaleString()} {token.symbol}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Transaction successful! Signature: {signature.slice(0, 8)}...
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label className="text-[#f8e1f4]">Recipient Address</Label>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Enter Solana address"
            className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl"
            disabled={sending || success}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[#f8e1f4]">Amount</Label>
            <button
              onClick={() => setAmount(token.balance.toString())}
              className="text-xs text-[#8b005d] hover:text-[#d4308e] font-semibold"
              disabled={sending || success}
            >
              Max
            </button>
          </div>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="any"
            className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl"
            disabled={sending || success}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || success || !recipient || !amount}
          className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#a0006d] hover:to-[#e4409e] text-[#f8e1f4] font-bold rounded-xl h-12"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sent Successfully
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send {token.symbol}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
