'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Check, User } from 'lucide-react'
import { deriveAccount, type WalletAccount } from '@/lib/wallet-utils'

interface AccountManagerProps {
  accounts: WalletAccount[]
  currentAccount: WalletAccount
  onAccountSwitch: (account: WalletAccount) => void
  onAccountAdd: (account: WalletAccount) => void
}

export default function AccountManager({ 
  accounts, 
  currentAccount, 
  onAccountSwitch, 
  onAccountAdd 
}: AccountManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddAccount = async () => {
    try {
      setLoading(true)
      const newIndex = accounts.length
      const newAccount = await deriveAccount(currentAccount.seedPhrase, newIndex)
      
      if (newAccountName.trim()) {
        newAccount.name = newAccountName.trim()
      }
      
      onAccountAdd(newAccount)
      setNewAccountName('')
      setIsAdding(false)
    } catch (error) {
      console.error('Error creating account:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
          <User className="w-5 h-5 text-[#8b005d]" />
          Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {accounts.map((account) => (
            <button
              key={account.publicKey}
              onClick={() => onAccountSwitch(account)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                currentAccount.publicKey === account.publicKey
                  ? 'bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]'
                  : 'bg-[#0b0b0b]/70 hover:bg-[#2a1a24] text-[#c0c0c0] border border-[#3a2a34]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentAccount.publicKey === account.publicKey
                    ? 'bg-[#f8e1f4]/20'
                    : 'bg-[#8b005d]/20'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{account.name}</p>
                  <p className="text-xs opacity-70">
                    {account.publicKey.slice(0, 4)}...{account.publicKey.slice(-4)}
                  </p>
                </div>
              </div>
              {currentAccount.publicKey === account.publicKey && (
                <Check className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>

        {isAdding ? (
          <div className="space-y-2 p-4 bg-[#0b0b0b]/70 rounded-xl border border-[#3a2a34]">
            <Input
              placeholder="Account name (optional)"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="bg-[#1a0a14] border-[#3a2a34] text-[#f8e1f4]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddAccount}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:opacity-90 text-[#f8e1f4]"
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false)
                  setNewAccountName('')
                }}
                variant="outline"
                className="bg-[#1a0a14] border-[#3a2a34] text-[#c0c0c0]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full rounded-xl bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] border border-[#8b005d]/30"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
