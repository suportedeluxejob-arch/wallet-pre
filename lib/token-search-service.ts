import { Connection, PublicKey } from '@solana/web3.js'
import { NETWORK_ENDPOINTS, NetworkType } from './wallet-utils'

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  tags?: string[]
  verified?: boolean
  daily_volume?: number
  price?: number
  market_cap?: number
}

export interface UserToken {
  mint: string
  symbol: string
  name: string
  logoURI?: string
  decimals: number
  addedAt: number
  isFavorite: boolean
}

const POPULAR_TOKENS: TokenInfo[] = [
  {
    address: 'So11111111111111111111111111111111111111111',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    verified: true,
    daily_volume: 2000000000
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    verified: true,
    daily_volume: 500000000
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'USDT',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    verified: true,
    daily_volume: 400000000
  },
  {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    logoURI: 'https://static.jup.ag/jup/icon.png',
    verified: true,
    daily_volume: 40000000
  },
  {
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    verified: true,
    daily_volume: 30000000
  },
  {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
    verified: true,
    daily_volume: 50000000
  },
  {
    address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    symbol: 'PYTH',
    name: 'Pyth Network',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3/logo.png',
    verified: true,
    daily_volume: 25000000
  },
  {
    address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png',
    verified: true,
    daily_volume: 20000000
  },
  {
    address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    symbol: 'WETH',
    name: 'Wrapped Ethereum (Wormhole)',
    decimals: 8,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/logo.png',
    verified: true,
    daily_volume: 35000000
  },
  {
    address: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin (Wormhole)',
    decimals: 8,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh/logo.png',
    verified: true,
    daily_volume: 28000000
  },
  {
    address: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    symbol: 'RENDER',
    name: 'Render Token',
    decimals: 8,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png',
    verified: true,
    daily_volume: 18000000
  },
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    verified: true,
    daily_volume: 1000000000
  },
  {
    address: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    symbol: 'DUST',
    name: 'DUST Protocol',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ/logo.png',
    verified: true,
    daily_volume: 15000000
  },
  {
    address: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
    symbol: 'JTO',
    name: 'Jito',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL/logo.png',
    verified: true,
    daily_volume: 22000000
  },
  {
    address: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk',
    symbol: 'WEN',
    name: 'Wen',
    decimals: 5,
    logoURI: 'https://shdw-drive.genesysgo.net/CsDkETHRRR1EcueeN346MJoqzymkkr7RFjMqGpZMzAib/wen_logo.png',
    verified: true,
    daily_volume: 12000000
  }
]

// Cache for token list to avoid repeated API calls
let tokenListCache: TokenInfo[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function getAllTokens(): Promise<TokenInfo[]> {
  // Return cached data if still valid
  if (tokenListCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return tokenListCache
  }

  try {
    const response = await fetch('https://token.jup.ag/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const tokens: TokenInfo[] = await response.json()
    
    // Update cache
    tokenListCache = tokens
    cacheTimestamp = Date.now()
    
    return tokens
  } catch (error) {
    // Silently use fallback - Jupiter API has CORS restrictions in browser
    return POPULAR_TOKENS
  }
}

// Search tokens by name, symbol, or address
export async function searchTokens(query: string): Promise<TokenInfo[]> {
  if (!query || query.length < 2) {
    return []
  }

  const allTokens = await getAllTokens()
  const searchQuery = query.toLowerCase()

  // If query looks like an address, search by exact match first
  if (query.length > 32) {
    const exactMatch = allTokens.find(
      token => token.address.toLowerCase() === searchQuery
    )
    if (exactMatch) {
      return [exactMatch]
    }
  }

  // Search by symbol or name
  return allTokens
    .filter(token => 
      token.symbol.toLowerCase().includes(searchQuery) ||
      token.name.toLowerCase().includes(searchQuery) ||
      token.address.toLowerCase().includes(searchQuery)
    )
    .slice(0, 50) // Limit results to 50
    .sort((a, b) => {
      // Prioritize verified tokens
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      
      // Then by daily volume
      const volA = a.daily_volume || 0
      const volB = b.daily_volume || 0
      return volB - volA
    })
}

// Get token info by mint address
export async function getTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
  try {
    const allTokens = await getAllTokens()
    return allTokens.find(token => token.address === mintAddress) || null
  } catch (error) {
    console.error('Error fetching token info:', error)
    return null
  }
}

// Verify if token mint exists on-chain
export async function verifyTokenMint(
  mintAddress: string,
  network: NetworkType = 'mainnet'
): Promise<boolean> {
  try {
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    const mintPublicKey = new PublicKey(mintAddress)
    const accountInfo = await connection.getAccountInfo(mintPublicKey)
    
    // Check if account exists and is a token mint
    return accountInfo !== null && accountInfo.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
  } catch (error) {
    console.error('Error verifying token mint:', error)
    return false
  }
}

// Get token balance for a specific mint
export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string,
  network: NetworkType = 'mainnet'
): Promise<number> {
  try {
    const response = await fetch(NETWORK_ENDPOINTS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: mintAddress },
          { encoding: 'jsonParsed' }
        ],
      }),
    })

    const data = await response.json()
    
    if (data.result?.value && data.result.value.length > 0) {
      const accountInfo = data.result.value[0].account.data.parsed.info
      return accountInfo.tokenAmount.uiAmount || 0
    }
    
    return 0
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return 0
  }
}

// Fetch token price from Jupiter Price API
export async function getTokenPrice(mintAddress: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://price.jup.ag/v4/price?ids=${mintAddress}`
    )
    const data = await response.json()
    
    if (data.data && data.data[mintAddress]) {
      return data.data[mintAddress].price
    }
    
    return null
  } catch (error) {
    console.error('Error fetching token price:', error)
    return null
  }
}

export async function getPopularTokens(limit: number = 10): Promise<TokenInfo[]> {
  const allTokens = await getAllTokens()
  
  // If we got tokens from API, filter and sort
  if (allTokens.length > 20) {
    return allTokens
      .filter(token => token.verified && token.daily_volume)
      .sort((a, b) => (b.daily_volume || 0) - (a.daily_volume || 0))
      .slice(0, limit)
  }
  
  // Otherwise return the hardcoded popular tokens
  return POPULAR_TOKENS.slice(0, limit)
}

export async function addCustomToken(mintAddress: string, network: NetworkType = 'mainnet'): Promise<TokenInfo | null> {
  try {
    // First check if token exists in our list
    const existingToken = await getTokenInfo(mintAddress)
    if (existingToken) {
      return existingToken
    }
    
    // Verify token exists on-chain and get basic info
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    const mintPublicKey = new PublicKey(mintAddress)
    const accountInfo = await connection.getAccountInfo(mintPublicKey)
    
    if (!accountInfo || accountInfo.owner.toString() !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      throw new Error('Invalid token mint address')
    }
    
    // Parse mint data to get decimals
    const decimals = accountInfo.data[44] // Decimals are at byte 44 in mint account data
    
    return {
      address: mintAddress,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: decimals,
      verified: false
    }
  } catch (error) {
    console.error('[v0] Error adding custom token:', error)
    return null
  }
}
