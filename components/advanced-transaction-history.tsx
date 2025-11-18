'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Send, Download, Filter, Search, ExternalLink, Copy, CheckCircle2 } from 'lucide-react'
import { transactionService, type TransactionRecord } from '@/lib/transaction-service'
import { formatPrice } from '@/lib/price-service'

interface AdvancedTransactionHistoryProps {
  publicKey: string
}

type FilterType = 'all' | 'send' | 'receive' | 'swap' | 'pending' | 'confirmed' | 'failed'

export default function AdvancedTransactionHistory({ publicKey }: AdvancedTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
    const interval = setInterval(loadTransactions, 60000)
    return () => clearInterval(interval)
  }, [publicKey])

  const loadTransactions = async () => {
    try {
      setRefreshing(true)
      const history = await transactionService.getCombinedHistory(publicKey)
      setTransactions(history)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'pending' || filter === 'confirmed' || filter === 'failed') {
      return tx.status === filter
    }
    return tx.type === filter
  }).filter(tx => {
    if (!searchTerm) return true
    return (
      tx.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.signature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <Send className="w-4 h-4" />
      case 'receive':
        return <Download className="w-4 h-4 rotate-180" />
      case 'swap':
        return <Filter className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#f8e1f4]" style={{ fontFamily: 'Poppins' }}>
                Transaction History
              </CardTitle>
              <CardDescription className="text-[#c0c0c0]">
                {filteredTransactions.length} transactions
              </CardDescription>
            </div>
            <Button
              onClick={loadTransactions}
              disabled={refreshing}
              className="w-10 h-10 p-0 bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] rounded-xl"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl"
              icon={<Search className="w-4 h-4" />}
            />

            <div className="flex gap-2 overflow-x-auto">
              {(['all', 'send', 'receive', 'swap', 'confirmed', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]'
                      : 'bg-[#0b0b0b]/70 text-[#c0c0c0] border border-[#3a2a34] hover:border-[#8b005d]/50'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-[#8b005d] animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-[#c0c0c0]">No transactions found</p>
            <p className="text-[#c0c0c0]/60 text-sm">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-xl hover:border-[#8b005d]/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Type Icon */}
                    <div className="w-10 h-10 rounded-lg bg-[#8b005d]/20 flex items-center justify-center text-[#8b005d] flex-shrink-0">
                      {getTypeIcon(tx.type)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[#f8e1f4] font-semibold capitalize">
                          {tx.type} {tx.tokenSymbol || 'SOL'}
                        </p>
                        <Badge className={`text-xs ${getStatusColor(tx.status)}`}>
                          {tx.status}
                        </Badge>
                      </div>

                      <p className="text-[#c0c0c0] text-xs mb-2">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>

                      <p className="text-[#c0c0c0] text-xs break-all">
                        {tx.recipient || tx.sender || tx.signature.slice(0, 20) + '...'}
                      </p>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold mb-2 ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'send' ? '-' : '+'}
                      {tx.amount.toLocaleString()}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(tx.signature, tx.id)}
                        className="p-2 hover:bg-[#2a1a24] rounded-lg transition-colors text-[#c0c0c0] hover:text-[#8b005d]"
                        title="Copy signature"
                      >
                        {copied === tx.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {tx.explorerUrl && (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-[#2a1a24] rounded-lg transition-colors text-[#c0c0c0] hover:text-[#8b005d]"
                          title="View on explorer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {tx.notes && (
                  <div className="mt-2 p-2 bg-[#0b0b0b] rounded text-xs text-[#c0c0c0] border border-[#3a2a34]">
                    {tx.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
