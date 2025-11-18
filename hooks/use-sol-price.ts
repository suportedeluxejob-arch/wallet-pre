import { useState, useEffect } from 'react'
import { fetchSOLPrice, SOLPrice } from '@/lib/price-service'

export function useSOLPrice() {
  const [solPrice, setSOLPrice] = useState<SOLPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSOLPrice = async () => {
      try {
        setLoading(true)
        setError(null)
        const price = await fetchSOLPrice()
        setSOLPrice(price)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load SOL price'
        setError(errorMsg)
        // Still set a default price to avoid UI breaking
        setSOLPrice({
          price: 140,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          lastUpdate: Date.now(),
        })
      } finally {
        setLoading(false)
      }
    }

    loadSOLPrice()

    const interval = setInterval(loadSOLPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  return { solPrice, loading, error }
}
