import { useState, useEffect } from 'react'
import { priceHistoryService } from '@/lib/price-history-service'

export function usePriceHistory(mint: string, hours: number = 24) {
  const [history, setHistory] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const updateHistory = () => {
      const historyData = priceHistoryService.getHistory(mint, hours)
      const statsData = priceHistoryService.get24hStats(mint)
      setHistory(historyData)
      setStats(statsData)
    }

    updateHistory()
    const interval = setInterval(updateHistory, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [mint, hours])

  return { history, stats }
}
