'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDownLeft, ArrowUpRight, RefreshCw, ExternalLink } from 'lucide-react'
import { getTransactionHistory, Transaction } from '@/lib/wallet-utils'

interface TransactionHistoryProps {
  publicKey: string
}

export default function TransactionHistory({ publicKey }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [publicKey])

  const loadHistory = async () => {
    try {
      setRefreshing(true)
      const history = await getTransactionHistory(publicKey, 10, 'mainnet')
      setTransactions(history)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const openExplorer = (signature: string) => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank')
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>Transaction History</CardTitle>
            <CardDescription className="text-[#c0c0c0]">Recent activity on your wallet</CardDescription>
          </div>
          <Button
            onClick={loadHistory}
            disabled={refreshing}
            className="w-9 h-9 p-0 bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d]"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-[#8b005d]" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#c0c0c0] text-sm">No transactions yet</p>
            <p className="text-[#c0c0c0]/70 text-xs mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.signature}
                className="p-3 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-xl hover:border-[#8b005d]/50 transition-all group cursor-pointer"
                onClick={() => openExplorer(tx.signature)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.type === 'sent' 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {tx.type === 'sent' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-[#f8e1f4] capitalize">{tx.type}</p>
                      <p className={`text-sm font-bold ${
                        tx.type === 'sent' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {tx.type === 'sent' ? '-' : '+'}{tx.amount.toFixed(4)} SOL
                      </p>
                    </div>
                    
                    <p className="text-xs text-[#c0c0c0] truncate">
                      {tx.type === 'sent' ? 'To: ' : 'From: '}
                      {(tx.type === 'sent' ? tx.to : tx.from).slice(0, 16)}...
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[#c0c0c0]/70">{formatDate(tx.timestamp)}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'confirmed' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tx.status}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#8b005d] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
