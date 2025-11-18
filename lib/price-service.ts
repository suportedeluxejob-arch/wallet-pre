// Real-time price feed service using backend API routes
import { SPLToken } from './wallet-utils'

export interface TokenPrice {
  mint: string
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  lastUpdate: number
}

export interface SOLPrice {
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  lastUpdate: number
}

// Cache for prices to avoid excessive API calls
const priceCache = new Map<string, { price: TokenPrice; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export async function fetchSOLPrice(): Promise<SOLPrice> {
  try {
    const response = await fetch('/api/prices/sol')
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }
    
    return data
  } catch (error) {
    console.error("[v0] Error fetching SOL price:", error)
    // Return fallback price instead of failing completely
    return {
      price: 140,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdate: Date.now(),
    }
  }
}

export async function fetchTokenPrices(mints: string[]): Promise<Map<string, TokenPrice>> {
  try {
    if (mints.length === 0) return new Map()
    
    const prices = new Map<string, TokenPrice>()
    
    const response = await fetch('/api/prices/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mints })
    })
    
    if (!response.ok) {
      console.warn(`[v0] Token price API returned ${response.status}`)
      return prices
    }
    
    const data = await response.json()
    
    if (data.data) {
      for (const mint of mints) {
        if (data.data[mint]) {
          const tokenData = data.data[mint]
          prices.set(mint, {
            mint,
            symbol: tokenData.symbol || 'UNKNOWN',
            price: tokenData.price || 0,
            change24h: tokenData.vsToken?.['24h']?.changePercent || 0,
            volume24h: 0,
            marketCap: 0,
            lastUpdate: Date.now(),
          })
        }
      }
    }
    
    return prices
  } catch (error) {
    console.error("[v0] Error in fetchTokenPrices:", error)
    return new Map()
  }
}

// Get price with cache
export async function getPriceWithCache(mint: string): Promise<TokenPrice | null> {
  const cached = priceCache.get(mint)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price
  }
  
  try {
    const response = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
    
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    
    const data = await response.json()
    
    if (data.data && data.data[mint]) {
      const tokenData = data.data[mint]
      const price: TokenPrice = {
        mint,
        symbol: tokenData.symbol || 'UNKNOWN',
        price: tokenData.price || 0,
        change24h: tokenData.vsToken?.['24h']?.changePercent || 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdate: Date.now(),
      }
      
      priceCache.set(mint, { price, timestamp: Date.now() })
      return price
    }
  } catch (error) {
    console.warn(`[v0] Price fetch failed for ${mint}:`, error)
  }
  
  return null
}

// Calculate token value in USD
export function calculateTokenValue(balance: number, price: number): number {
  return balance * price
}

// Format price to display
export function formatPrice(price: number): string {
  if (price === 0) return '$0.00'
  if (price < 0.01) return `$${price.toFixed(6)}`
  return `$${price.toFixed(2)}`
}

// Format percentage change to display
export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}
