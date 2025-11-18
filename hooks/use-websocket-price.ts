import { useState, useEffect } from 'react'
import { priceService, type PriceUpdate } from '@/lib/websocket-price-service'

export function useWebSocketPrice(mint: string) {
  const [priceUpdate, setPriceUpdate] = useState<PriceUpdate | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    const unsubscribe = priceService.subscribe(mint, (update) => {
      setPriceUpdate(update)
      setIsConnected(true)
    })

    return unsubscribe
  }, [mint])

  return { priceUpdate, isConnected }
}
