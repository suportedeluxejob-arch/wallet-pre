'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Send, Loader2, CheckCircle2, BookUser } from 'lucide-react'
import { sendTransaction, isValidSolanaAddress } from '@/lib/wallet-utils'
import { addressBook } from '@/lib/address-book'
import AddressBook from './address-book'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface SendTransactionProps {
  wallet: any
  onSuccess: () => void
}

export default function SendTransaction({ wallet, onSuccess }: SendTransactionProps) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [signature, setSignature] = useState('')
  const [showAddressBook, setShowAddressBook] = useState(false)

  const handleSend = async () => {
    setError('')
    setSuccess(false)
    
    // Validation
    if (!recipient) {
      setError('Please enter a recipient address')
      return
    }
    
    if (!isValidSolanaAddress(recipient)) {
      setError('Invalid Solana address')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    try {
      setLoading(true)
      const sig = await sendTransaction(
        wallet.privateKey,
        recipient,
        parseFloat(amount),
        'mainnet'
      )
      
      // Mark address as used in address book
      addressBook.markAsUsed(recipient)
      
      setSignature(sig)
      setSuccess(true)
      setRecipient('')
      setAmount('')
      
      // Wait 2 seconds then call onSuccess to refresh balance
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContact = (address: string) => {
    setRecipient(address)
    setShowAddressBook(false)
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
            <Send className="w-5 h-5 text-[#8b005d]" />
            Send SOL
          </CardTitle>
          <CardDescription className="text-[#c0c0c0]">Transfer SOL to another wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 font-semibold text-sm">Transaction Sent!</p>
                <p className="text-xs text-green-400/70 mt-1 break-all">Signature: {signature.slice(0, 20)}...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipient" className="text-[#c0c0c0]">Recipient Address</Label>
              <Dialog open={showAddressBook} onOpenChange={setShowAddressBook}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-[#8b005d] h-6 px-2">
                    <BookUser className="w-3 h-3 mr-1" />
                    Address Book
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a14] border-[#3a2a34] max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-[#f8e1f4]">Select Contact</DialogTitle>
                  </DialogHeader>
                  <AddressBook onSelectContact={handleSelectContact} />
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="recipient"
              placeholder="Enter Solana address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[#c0c0c0]">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl"
              disabled={loading}
            />
          </div>

          <div className="p-3 bg-[#8b005d]/10 border border-[#8b005d]/30 rounded-xl">
            <p className="text-xs text-[#c0c0c0]">
              Estimated Fee: <span className="text-[#8b005d] font-semibold">~0.000005 SOL</span>
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={loading || !recipient || !amount}
            className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#a0006b] hover:to-[#e040a0] text-[#f8e1f4] rounded-xl h-12 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Transaction...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Transaction
              </>
            )}
          </Button>

          <p className="text-xs text-[#c0c0c0] text-center">
            Always verify the recipient address before sending
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
