const TOKEN_ID_MAP: Record<string, string> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU': 'cope',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'marinade-staked-sol',
}

export async function POST(request: Request) {
  try {
    const { mints } = await request.json()
    
    if (!Array.isArray(mints) || mints.length === 0) {
      return Response.json({ data: {} })
    }
    
    const prices: Record<string, any> = {}
    
    const coinGeckoIds = mints
      .map(mint => TOKEN_ID_MAP[mint])
      .filter(Boolean)
    
    if (coinGeckoIds.length === 0) {
      return Response.json({ data: {} })
    }
    
    try {
      const idsParam = coinGeckoIds.join(',')
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        
        // Map back to mint addresses
        mints.forEach(mint => {
          const coinGeckoId = TOKEN_ID_MAP[mint]
          if (coinGeckoId && data[coinGeckoId]) {
            prices[mint] = {
              id: mint,
              price: data[coinGeckoId].usd || 0,
              change24h: data[coinGeckoId].usd_24h_change || 0,
            }
          }
        })
      }
    } catch (err) {
      console.warn('[API] Token fetch failed:', err)
    }
    
    return Response.json({ data: prices })
  } catch (error) {
    return Response.json({ data: {} }, { status: 500 })
  }
}
