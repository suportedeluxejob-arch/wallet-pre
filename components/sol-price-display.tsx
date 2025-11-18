'use client'

import { useSOLPrice } from '@/hooks/use-sol-price'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPrice, formatPercent } from '@/lib/price-service'

export default function SOLPriceDisplay() {
  const { solPrice, loading } = useSOLPrice()

  if (loading) {
    return (
      <div className="p-4 bg-[#1a0a14]/80 border border-[#3a2a34] rounded-xl">
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-[#3a2a34] rounded w-24"></div>
          <div className="h-4 bg-[#3a2a34] rounded w-32"></div>
        </div>
      </div>
    )
  }

  if (!solPrice) {
    return null
  }

  const isPositive = solPrice.change24h >= 0

  return (
    <div className="p-4 bg-gradient-to-br from-[#1a0a14]/80 to-[#2a1a24]/60 border border-[#3a2a34] rounded-xl">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[#c0c0c0] text-sm font-medium">SOL Price</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8b005d] to-[#d4308e]">
              {formatPrice(solPrice.price)}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">{formatPercent(solPrice.change24h)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#0b0b0b]/70 rounded-lg">
            <p className="text-[#c0c0c0] text-xs">24h Volume</p>
            <p className="text-[#f8e1f4] font-semibold">
              ${(solPrice.volume24h / 1e9).toFixed(2)}B
            </p>
          </div>
          <div className="p-2 bg-[#0b0b0b]/70 rounded-lg">
            <p className="text-[#c0c0c0] text-xs">Market Cap</p>
            <p className="text-[#f8e1f4] font-semibold">
              ${(solPrice.marketCap / 1e9).toFixed(2)}B
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
