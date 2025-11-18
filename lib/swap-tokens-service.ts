// Service for managing popular swap tokens and token discovery

export interface SwapToken {
  mint: string
  symbol: string
  decimals: number
  name: string
  logo?: string
  category?: 'stablecoin' | 'token' | 'wrapped'
  chainId?: number
}

export const EXPANDED_SWAP_TOKENS: SwapToken[] = [
  // SOL & Wrapped
  { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', decimals: 9, name: 'Solana', category: 'token', logo: '🌐' },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6, name: 'USD Coin', category: 'stablecoin', logo: '💵' },
  { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenJebm', symbol: 'USDT', decimals: 6, name: 'Tether', category: 'stablecoin', logo: '🏦' },

  // Popular Tokens
  { mint: 'MNDESYeB3cLCbDEuE6ripsnudS2g35nxDcnSoMD1mFT', symbol: 'MNDE', decimals: 8, name: 'Marinade', category: 'token', logo: '🪙' },
  { mint: 'mSoLzYCxHdgMLP3mZZoMZRH74MgUn5x3nxmbNyumLFa', symbol: 'mSOL', decimals: 9, name: 'Marinade Staked SOL', category: 'wrapped', logo: '🌙' },
  { mint: '7xKXtg2CW87d97TXJSDpbD5jBkheSXA1Grb4gTs81nf', symbol: 'COPE', decimals: 6, name: 'Cope', category: 'token', logo: '🎯' },
  { mint: 'RLY19iotQiOVUZZZP1lHmXnsvpdMA9R2specification', symbol: 'RLY', decimals: 8, name: 'Rally', category: 'token', logo: '🎪' },
  { mint: 'Lfthx4DHqyAy1V2pCHg47qSqKfRkasXsXJtPkuseevL', symbol: 'COPE', decimals: 6, name: 'Cope Token', category: 'token', logo: '🪂' },

  // NFT/Gaming
  { mint: 'orcaEKTdK7LKz57chYcUgdpeyvkq2Em27Sf811sCH9', symbol: 'ORCA', decimals: 6, name: 'Orca', category: 'token', logo: '🐋' },
  { mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', symbol: 'MNGO', decimals: 6, name: 'Mango', category: 'token', logo: '🥭' },

  // DEX Tokens
  { mint: 'JUP6LkbZbjS1jKKwapdHyR5sTdKiccqzybVZ5di6CDP', symbol: 'JUP', decimals: 6, name: 'Jupiter', category: 'token', logo: '⭐' },
  { mint: 'EPb9SEzEQVDERRvaLw93DNwQRvccWaWj3V5 sandbox', symbol: 'ORCA', decimals: 6, name: 'Orca DEX', category: 'token', logo: '🏊' },

  // Stablecoins
  { mint: 'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkxvx41a', symbol: 'USDH', decimals: 6, name: 'Hubble USDH', category: 'stablecoin', logo: '💠' },
]

class SwapTokensService {
  private favorites: string[] = []
  private favoritesKey = 'solary_swap_token_favorites'

  constructor() {
    this.loadFavorites()
  }

  private loadFavorites() {
    const stored = localStorage.getItem(this.favoritesKey)
    if (stored) {
      try {
        this.favorites = JSON.parse(stored)
      } catch (error) {
        console.error('Error loading favorites:', error)
        this.favorites = []
      }
    }
  }

  private saveFavorites() {
    localStorage.setItem(this.favoritesKey, JSON.stringify(this.favorites))
  }

  getPopularTokens(): SwapToken[] {
    return EXPANDED_SWAP_TOKENS
  }

  getTokenByMint(mint: string): SwapToken | undefined {
    return EXPANDED_SWAP_TOKENS.find((t) => t.mint === mint)
  }

  searchTokens(query: string): SwapToken[] {
    const q = query.toLowerCase()
    return EXPANDED_SWAP_TOKENS.filter(
      (token) =>
        token.symbol.toLowerCase().includes(q) ||
        token.name.toLowerCase().includes(q) ||
        token.mint.toLowerCase().includes(q)
    )
  }

  addFavorite(mint: string) {
    if (!this.favorites.includes(mint)) {
      this.favorites.push(mint)
      this.saveFavorites()
    }
  }

  removeFavorite(mint: string) {
    this.favorites = this.favorites.filter((m) => m !== mint)
    this.saveFavorites()
  }

  isFavorite(mint: string): boolean {
    return this.favorites.includes(mint)
  }

  getFavorites(): SwapToken[] {
    return this.favorites
      .map((mint) => this.getTokenByMint(mint))
      .filter((token) => token !== undefined) as SwapToken[]
  }

  getTokensByCategory(category: SwapToken['category']): SwapToken[] {
    return EXPANDED_SWAP_TOKENS.filter((t) => t.category === category)
  }
}

export const swapTokensService = new SwapTokensService()
