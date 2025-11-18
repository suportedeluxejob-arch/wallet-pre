import { useState, useEffect } from 'react'
import { fetchTokenPrices, TokenPrice } from '@/lib/price-service'

export function useTokenPrices(mints: string[]) {
  const [prices, setPrices] = useState<Map<string, TokenPrice>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mints.length === 0) {
      setLoading(false)
      return
    }

    const loadPrices = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchTokenPrices(mints)
        setPrices(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prices')
      } finally {
        setLoading(false)
      }
    }

    loadPrices()

    // Refresh prices every 30 seconds
    const interval = setInterval(loadPrices, 30000)
    return () => clearInterval(interval)
  }, [mints.join(',')])

  return { prices, loading, error }
}
