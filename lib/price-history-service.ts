// Service for tracking and storing price history for charting

export interface PriceHistoryPoint {
  timestamp: number
  price: number
  symbol: string
}

class PriceHistoryService {
  private history = new Map<string, PriceHistoryPoint[]>()
  private maxHistoryPoints = 1440 // 24 hours of 1-minute data
  private updateIntervals = new Map<string, NodeJS.Timeout>()

  startTracking(mint: string, symbol: string, priceGetter: () => number) {
    if (this.updateIntervals.has(mint)) {
      return // Already tracking
    }

    const history: PriceHistoryPoint[] = []
    this.history.set(mint, history)

    const recordPrice = () => {
      const price = priceGetter()
      if (price > 0) {
        history.push({
          timestamp: Date.now(),
          price,
          symbol,
        })

        // Keep only last 24 hours
        if (history.length > this.maxHistoryPoints) {
          history.shift()
        }
      }
    }

    // Record immediately and then every minute
    recordPrice()
    const interval = setInterval(recordPrice, 60000)
    this.updateIntervals.set(mint, interval)
  }

  stopTracking(mint: string) {
    const interval = this.updateIntervals.get(mint)
    if (interval) {
      clearInterval(interval)
      this.updateIntervals.delete(mint)
    }
    this.history.delete(mint)
  }

  getHistory(mint: string, hours: number = 24): PriceHistoryPoint[] {
    const history = this.history.get(mint) || []
    const cutoffTime = Date.now() - hours * 3600000

    return history.filter(point => point.timestamp >= cutoffTime)
  }

  get24hStats(mint: string) {
    const history = this.getHistory(mint, 24)
    if (history.length === 0) {
      return { high: 0, low: 0, change: 0, changePercent: 0 }
    }

    const prices = history.map(p => p.price)
    const high = Math.max(...prices)
    const low = Math.min(...prices)
    const opening = history[0].price
    const closing = history[history.length - 1].price
    const change = closing - opening
    const changePercent = (change / opening) * 100

    return { high, low, change, changePercent }
  }
}

export const priceHistoryService = new PriceHistoryService()
