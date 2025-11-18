import type { UserToken } from './token-search-service'

// Save user's custom token to localStorage
export async function addUserToken(
  walletAddress: string,
  token: UserToken
): Promise<void> {
  try {
    const storageKey = `wallet_custom_tokens_${walletAddress}`
    const stored = localStorage.getItem(storageKey)
    const tokens: Record<string, UserToken & { addedAt: number }> = stored 
      ? JSON.parse(stored) 
      : {}
    
    tokens[token.mint] = {
      ...token,
      addedAt: Date.now(),
    }
    
    localStorage.setItem(storageKey, JSON.stringify(tokens))
    console.log('[v0] Token added to user favorites')
  } catch (error) {
    console.error('Error adding user token:', error)
    throw error
  }
}

// Remove user's custom token from localStorage
export async function removeUserToken(
  walletAddress: string,
  mintAddress: string
): Promise<void> {
  try {
    const storageKey = `wallet_custom_tokens_${walletAddress}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      const tokens: Record<string, UserToken & { addedAt: number }> = JSON.parse(stored)
      delete tokens[mintAddress]
      localStorage.setItem(storageKey, JSON.stringify(tokens))
      console.log('[v0] Token removed from user favorites')
    }
  } catch (error) {
    console.error('Error removing user token:', error)
    throw error
  }
}

// Get all user's custom tokens from localStorage
export async function getUserTokens(
  walletAddress: string
): Promise<UserToken[]> {
  try {
    const storageKey = `wallet_custom_tokens_${walletAddress}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      const tokens: Record<string, UserToken & { addedAt: number }> = JSON.parse(stored)
      return Object.values(tokens).sort((a, b) => b.addedAt - a.addedAt)
    }
    
    return []
  } catch (error) {
    console.error('Error fetching user tokens:', error)
    return []
  }
}

// Check if token is in user's favorites
export async function isTokenFavorited(
  walletAddress: string,
  mintAddress: string
): Promise<boolean> {
  try {
    const storageKey = `wallet_custom_tokens_${walletAddress}`
    const stored = localStorage.getItem(storageKey)
    
    if (stored) {
      const tokens: Record<string, UserToken & { addedAt: number }> = JSON.parse(stored)
      return mintAddress in tokens
    }
    
    return false
  } catch (error) {
    console.error('Error checking token favorite status:', error)
    return false
  }
}
