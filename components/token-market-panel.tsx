'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { fetchTokenPrices, formatPrice, formatPercent } from '@/lib/price-service'
import type { TokenPrice } from '@/lib/price-service'

interface TokenMarketPanelProps {
  tokens?: string[]
}

const POPULAR_TOKENS = [
  { mint: 'EPjFWdd5Au17DD7xNZe1SAfqBjUbL5q37C1DvDKXoQn', symbol: 'USDC' },
  { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BcJlLS', symbol: 'USDT' },
  { mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', symbol: 'COPE' },
  { mint: 'Kin3gmeNyStCykqTW8hhvkZ3j7nSXgAMVVtQycv5pKo', symbol: 'KIN' },
]

export default function TokenMarketPanel({ tokens = POPULAR_TOKENS }: TokenMarketPanelProps) {
  const [prices, setPrices] = useState<Map<string, TokenPrice>>(new Map())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPrices()
    const interval = setInterval(loadPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPrices = async () => {
    try {
      setRefreshing(true)
      const mints = tokens.map(t => t.mint)
      const result = await fetchTokenPrices(mints)
      setPrices(result)
    } catch (error) {
      console.error('Error loading prices:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredTokens = tokens.filter(t =>
    t.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
              <Zap className="w-5 h-5 text-[#8b005d]" />
              Market Prices
            </CardTitle>
            <CardDescription className="text-[#c0c0c0]">
              Real-time token prices from Jupiter
            </CardDescription>
          </div>
          <Button
            onClick={loadPrices}
            disabled={refreshing}
            className="w-10 h-10 p-0 bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] rounded-xl"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="Search tokens..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl"
        />

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-[#8b005d] animate-spin mx-auto" />
            </div>
          ) : (
            filteredTokens.map((token) => {
              const price = prices.get(token.mint)
              const isPositive = (price?.change24h || 0) >= 0

              return (
                <div
                  key={token.mint}
                  className="flex items-center justify-between p-3 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-xl hover:border-[#8b005d]/50 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b005d] to-[#d4308e] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#f8e1f4]">
                        {token.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[#f8e1f4] font-semibold text-sm">{token.symbol}</p>
                      <p className="text-[#c0c0c0] text-xs">
                        {price?.name || 'Token'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[#f8e1f4] font-semibold text-sm">
                      {formatPrice(price?.price || 0)}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{formatPercent(price?.change24h || 0)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filteredTokens.length === 0 && !loading && (
          <div className="text-center py-4 text-[#c0c0c0] text-sm">
            No tokens found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
