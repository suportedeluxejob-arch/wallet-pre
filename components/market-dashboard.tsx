'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, TrendingUp, TrendingDown, BarChart3, Eye, EyeOff, Star, Zap } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useWebSocketPrice } from '@/hooks/use-websocket-price'
import { usePriceHistory } from '@/hooks/use-price-history'
import { formatPrice, formatPercent } from '@/lib/price-service'
import type { PriceHistoryPoint } from '@/lib/price-history-service'

interface MarketAsset {
  mint: string
  symbol: string
  name?: string
}

const TRACKED_ASSETS: MarketAsset[] = [
  { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana' },
  { mint: 'EPjFWdd5Au17DD7xNZe1SAfqBjUbL5q37C1DvDKXoQn', symbol: 'USDC', name: 'USD Coin' },
  { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BcJlLS', symbol: 'USDT', name: 'Tether' },
  { mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', symbol: 'COPE', name: 'Cope' },
]

export default function MarketDashboard() {
  const [selectedAsset, setSelectedAsset] = useState(TRACKED_ASSETS[0])
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['So11111111111111111111111111111111111111112']))
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h')

  const { priceUpdate } = useWebSocketPrice(selectedAsset.mint)
  const { history, stats } = usePriceHistory(selectedAsset.mint, timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 7 * 24)

  const toggleFavorite = (mint: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(mint)) {
      newFavorites.delete(mint)
    } else {
      newFavorites.add(mint)
    }
    setFavorites(newFavorites)
  }

  const displayedAssets = showFavoritesOnly
    ? TRACKED_ASSETS.filter(a => favorites.has(a.mint))
    : TRACKED_ASSETS

  const isPositive = (priceUpdate?.change24h || 0) >= 0

  // Format history for chart
  const chartData = history.map(point => ({
    time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    price: point.price,
    timestamp: point.timestamp,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-[#3a2a34] bg-gradient-to-br from-[#1a0a14]/80 to-[#2a1a24]/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                <BarChart3 className="w-6 h-6 text-[#8b005d]" />
                Market Dashboard
              </CardTitle>
              <CardDescription className="text-[#c0c0c0]">Real-time asset prices and analytics</CardDescription>
            </div>
            <Button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              variant={showFavoritesOnly ? 'default' : 'outline'}
              className={`rounded-xl ${
                showFavoritesOnly
                  ? 'bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]'
                  : 'bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] border-[#3a2a34]'
              }`}
            >
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Asset List */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs text-[#c0c0c0] font-semibold px-2">ASSETS</p>
          <div className="space-y-2">
            {displayedAssets.map(asset => {
              const isFavorite = favorites.has(asset.mint)

              return (
                <div
                  key={asset.mint}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedAsset.mint === asset.mint
                      ? 'bg-gradient-to-r from-[#8b005d] to-[#d4308e] border-[#8b005d] text-[#f8e1f4]'
                      : 'bg-[#0b0b0b]/70 border-[#3a2a34] text-[#c0c0c0] hover:border-[#8b005d]/50'
                  }`}
                >
                  <div 
                    onClick={() => setSelectedAsset(asset)}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold text-sm">{asset.symbol}</p>
                    <p className="text-xs opacity-70">{asset.name}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(asset.mint)
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label={`Toggle favorite for ${asset.symbol}`}
                  >
                    <Star
                      className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Chart and Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Price Header */}
          <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[#c0c0c0] text-sm font-medium">{selectedAsset.symbol}</p>
                    <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8b005d] to-[#d4308e]">
                      {formatPrice(priceUpdate?.price || 0)}
                    </p>
                  </div>
                  <div className={`text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="flex items-center justify-end gap-2">
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <div>
                        <p className="text-lg font-bold">{formatPercent(priceUpdate?.change24h || 0)}</p>
                        <p className="text-xs opacity-70">24h Change</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-[#0b0b0b]/70 rounded-lg">
                    <p className="text-[#c0c0c0] text-xs">24h High</p>
                    <p className="text-[#f8e1f4] font-semibold text-sm">
                      {formatPrice(stats?.high || 0)}
                    </p>
                  </div>
                  <div className="p-2 bg-[#0b0b0b]/70 rounded-lg">
                    <p className="text-[#c0c0c0] text-xs">24h Low</p>
                    <p className="text-[#f8e1f4] font-semibold text-sm">
                      {formatPrice(stats?.low || 0)}
                    </p>
                  </div>
                  <div className="p-2 bg-[#0b0b0b]/70 rounded-lg">
                    <p className="text-[#c0c0c0] text-xs">24h Change</p>
                    <p className="text-[#f8e1f4] font-semibold text-sm">
                      {formatPrice(stats?.change || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#f8e1f4] text-sm">Price Chart</CardTitle>
                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                  <TabsList className="bg-[#0b0b0b]/50 border border-[#3a2a34]">
                    <TabsTrigger
                      value="1h"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8b005d] data-[state=active]:to-[#d4308e] data-[state=active]:text-[#f8e1f4]"
                    >
                      1H
                    </TabsTrigger>
                    <TabsTrigger
                      value="24h"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8b005d] data-[state=active]:to-[#d4308e] data-[state=active]:text-[#f8e1f4]"
                    >
                      24H
                    </TabsTrigger>
                    <TabsTrigger
                      value="7d"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8b005d] data-[state=active]:to-[#d4308e] data-[state=active]:text-[#f8e1f4]"
                    >
                      7D
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b005d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b005d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a2a34" />
                    <XAxis dataKey="time" stroke="#c0c0c0" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#c0c0c0" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b0b0b',
                        border: '1px solid #3a2a34',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f8e1f4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#d4308e"
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="w-6 h-6 text-[#8b005d] animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
