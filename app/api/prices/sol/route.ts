let priceCache: { price: number; change24h: number; volume24h: number; marketCap: number; lastUpdate: number } | null = null
const CACHE_DURATION = 30000 // 30 seconds cache

async function fetchFromKraken() {
  try {
    const response = await fetch('https://api.kraken.com/0/public/Ticker?pair=SOLUSD')
    if (!response.ok) return null
    
    const result = await response.json()
    
    if (result.error && result.error.length > 0) return null
    
    const ticker = result.result?.SOLUSD
    if (!ticker) return null
    
    const currentPrice = parseFloat(ticker.c[0])
    const openPrice = parseFloat(ticker.o)
    const change24h = ((currentPrice - openPrice) / openPrice) * 100
    
    return {
      price: currentPrice,
      change24h,
      volume24h: parseFloat(ticker.v[1]) * currentPrice,
      marketCap: 0,
      lastUpdate: Date.now(),
    }
  } catch (error) {
    return null
  }
}

async function fetchFromKuCoin() {
  try {
    const response = await fetch('https://api.kucoin.com/api/v1/market/stats?symbol=SOL-USDT')
    if (!response.ok) return null
    
    const result = await response.json()
    const data = result.data
    
    return {
      price: parseFloat(data.last),
      change24h: parseFloat(data.changeRate) * 100,
      volume24h: parseFloat(data.volValue),
      marketCap: 0,
      lastUpdate: Date.now(),
    }
  } catch (error) {
    return null
  }
}

async function fetchFromCoinbase() {
  try {
    const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=SOL')
    if (!response.ok) return null
    
    const result = await response.json()
    const rate = parseFloat(result.data?.rates?.USD || 0)
    
    if (rate === 0) return null
    
    return {
      price: rate,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdate: Date.now(),
    }
  } catch (error) {
    return null
  }
}

async function fetchFromCoinGecko() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
      { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) return null
    
    const data = await response.json()
    
    if (data.solana) {
      return {
        price: data.solana.usd || 0,
        change24h: data.solana.usd_24h_change || 0,
        volume24h: data.solana.usd_24h_vol || 0,
        marketCap: data.solana.usd_market_cap || 0,
        lastUpdate: Date.now(),
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

export async function GET() {
  try {
    // Check cache first
    if (priceCache && Date.now() - priceCache.lastUpdate < CACHE_DURATION) {
      return Response.json(priceCache)
    }

    let priceData = await fetchFromKuCoin()
    
    if (!priceData) {
      priceData = await fetchFromKraken()
    }
    
    if (!priceData) {
      priceData = await fetchFromCoinbase()
    }
    
    if (!priceData) {
      priceData = await fetchFromCoinGecko()
    }
    
    if (priceData) {
      priceCache = priceData
      return Response.json(priceData)
    }
    
    // If all APIs fail and we have old cache, return it
    if (priceCache) {
      return Response.json(priceCache)
    }
    
    return Response.json({ error: 'All price APIs failed' }, { status: 503 })
  } catch (error) {
    // Return stale cache if available
    if (priceCache) {
      return Response.json(priceCache)
    }
    
    return Response.json({ error: 'Failed to fetch SOL price' }, { status: 500 })
  }
}
