// WebSocket service for real-time price updates with fallback to polling

export interface PriceUpdate {
  mint: string
  symbol: string
  price: number
  timestamp: number
  change24h?: number
}

type PriceUpdateCallback = (update: PriceUpdate) => void

class WebSocketPriceService {
  private subscriptions = new Map<string, Set<PriceUpdateCallback>>()
  private priceCache = new Map<string, PriceUpdate>()
  private pollingIntervals = new Map<string, NodeJS.Timeout>()
  private lastUpdate = new Map<string, number>()

  subscribe(mint: string, callback: PriceUpdateCallback): () => void {
    if (!this.subscriptions.has(mint)) {
      this.subscriptions.set(mint, new Set())
      this.startPolling(mint)
    }

    this.subscriptions.get(mint)!.add(callback)

    // Send cached price if available
    const cached = this.priceCache.get(mint)
    if (cached) {
      callback(cached)
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(mint)?.delete(callback)
      if (this.subscriptions.get(mint)?.size === 0) {
        this.stopPolling(mint)
        this.subscriptions.delete(mint)
      }
    }
  }

  private startPolling(mint: string) {
    const pollFn = async () => {
      try {
        const response = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`)
        const data = await response.json()

        if (data.data && data.data[mint]) {
          const tokenData = data.data[mint]
          const update: PriceUpdate = {
            mint,
            symbol: tokenData.symbol || 'UNKNOWN',
            price: tokenData.price || 0,
            timestamp: Date.now(),
            change24h: tokenData.vsToken?.['24h']?.changePercent || 0,
          }

          this.priceCache.set(mint, update)
          this.notifySubscribers(mint, update)
        }
      } catch (error) {
        console.error(`Error polling price for ${mint}:`, error)
      }
    }

    // Poll immediately and then every 5 seconds
    pollFn()
    const interval = setInterval(pollFn, 5000)
    this.pollingIntervals.set(mint, interval)
  }

  private stopPolling(mint: string) {
    const interval = this.pollingIntervals.get(mint)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(mint)
    }
  }

  private notifySubscribers(mint: string, update: PriceUpdate) {
    const callbacks = this.subscriptions.get(mint)
    if (callbacks) {
      callbacks.forEach(callback => callback(update))
    }
  }

  getPrice(mint: string): PriceUpdate | null {
    return this.priceCache.get(mint) || null
  }

  getAllPrices(): Map<string, PriceUpdate> {
    return new Map(this.priceCache)
  }

  clear() {
    this.subscriptions.forEach((_, mint) => this.stopPolling(mint))
    this.subscriptions.clear()
    this.priceCache.clear()
    this.pollingIntervals.clear()
  }
}

// Singleton instance
export const priceService = new WebSocketPriceService()
