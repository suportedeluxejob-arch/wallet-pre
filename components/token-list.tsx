'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Send, Coins, TrendingUp, Trash2, Star } from 'lucide-react'
import { getTokenAccounts, type SPLToken, type NetworkType } from '@/lib/wallet-utils'
import { getUserTokens, removeUserToken, type UserToken } from '@/lib/user-tokens-service'
import { getTokenBalance, getTokenPrice } from '@/lib/token-search-service'
import AddTokenDialog from './add-token-dialog'

interface TokenListProps {
  publicKey: string
  network?: NetworkType
  onSendToken: (token: SPLToken) => void
}

interface TokenDisplay extends SPLToken {
  isCustom?: boolean
  isFavorite?: boolean
  usdValue?: number
}

export default function TokenList({ publicKey, network = 'mainnet', onSendToken }: TokenListProps) {
  const [tokens, setTokens] = useState<TokenDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [removingToken, setRemovingToken] = useState<string | null>(null)

  useEffect(() => {
    loadTokens()
  }, [publicKey, network])

  const loadTokens = async () => {
    try {
      setRefreshing(true)
      
      const [tokenAccounts, customTokens] = await Promise.all([
        getTokenAccounts(publicKey, network),
        getUserTokens(publicKey)
      ])

      const tokenMap = new Map<string, TokenDisplay>()

      // Add regular SPL tokens
      tokenAccounts.forEach(token => {
        tokenMap.set(token.mint, {
          ...token,
          isCustom: false,
          isFavorite: false
        })
      })

      const customTokenBalances = await Promise.all(
        customTokens.map(async (customToken) => {
          // Check if token already exists in SPL tokens
          if (!tokenMap.has(customToken.mint)) {
            const balance = await getTokenBalance(publicKey, customToken.mint, network)
            
            // Only add if balance exists or if it's favorited
            if (balance > 0 || customToken.isFavorite) {
              return {
                mint: customToken.mint,
                tokenAccount: '', // Will be resolved when needed for sending
                balance,
                decimals: customToken.decimals,
                symbol: customToken.symbol,
                name: customToken.name,
                logoURI: customToken.logoURI,
                isCustom: true,
                isFavorite: customToken.isFavorite
              } as TokenDisplay
            }
          } else {
            // Mark existing token as favorite
            const existingToken = tokenMap.get(customToken.mint)!
            existingToken.isFavorite = true
          }
          return null
        })
      )

      // Add custom tokens that don't exist in SPL list
      customTokenBalances.forEach(token => {
        if (token) {
          tokenMap.set(token.mint, token)
        }
      })

      const tokensWithPrices = await Promise.all(
        Array.from(tokenMap.values()).map(async (token) => {
          try {
            const price = await getTokenPrice(token.mint)
            return {
              ...token,
              usdValue: price ? token.balance * price : undefined
            }
          } catch (error) {
            return token
          }
        })
      )

      tokensWithPrices.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        
        if (a.usdValue !== undefined && b.usdValue !== undefined) {
          return b.usdValue - a.usdValue
        }
        
        return b.balance - a.balance
      })

      setTokens(tokensWithPrices)
    } catch (error) {
      console.error('Error loading tokens:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRemoveToken = async (token: TokenDisplay) => {
    if (!token.isCustom) return
    
    setRemovingToken(token.mint)
    try {
      await removeUserToken(publicKey, token.mint)
      await loadTokens() // Refresh the list
    } catch (error) {
      console.error('Error removing token:', error)
    } finally {
      setRemovingToken(null)
    }
  }

  if (loading) {
    return (
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-[#8b005d] animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
              <Coins className="w-5 h-5 text-[#8b005d]" />
              SPL Tokens
            </CardTitle>
            <CardDescription className="text-[#c0c0c0]">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <AddTokenDialog 
              walletAddress={publicKey}
              network={network}
              onTokenAdded={loadTokens}
            />
            <Button
              onClick={loadTokens}
              disabled={refreshing}
              className="w-10 h-10 p-0 bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] rounded-xl"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tokens.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Coins className="w-12 h-12 text-[#8b005d]/30 mx-auto" />
            <p className="text-[#c0c0c0] text-sm">No tokens found</p>
            <p className="text-[#c0c0c0]/60 text-xs">SPL tokens will appear here once received</p>
            <p className="text-[#c0c0c0]/60 text-xs">or click "Add Token" to search for tokens</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.mint}
                className="flex items-center justify-between p-4 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-xl hover:border-[#8b005d]/50 transition-all group"
              >
                <div className="flex items-center gap-3 flex-1">
                  {token.isFavorite && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                  
                  {token.logoURI ? (
                    <img
                      src={token.logoURI || "/placeholder.svg"}
                      alt={token.symbol || 'Token'}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b005d] to-[#d4308e] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#f8e1f4]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f8e1f4] font-semibold truncate">
                      {token.symbol || 'Unknown Token'}
                    </p>
                    <p className="text-[#c0c0c0] text-xs truncate">
                      {token.name || token.mint.slice(0, 8) + '...'}
                    </p>
                    {token.usdValue !== undefined && (
                      <p className="text-[#8b005d] text-xs font-semibold">
                        ${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[#f8e1f4] font-bold">{token.balance.toLocaleString()}</p>
                    <p className="text-[#c0c0c0] text-xs">{token.symbol || 'TOKEN'}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {token.isCustom && token.balance === 0 && (
                      <Button
                        onClick={() => handleRemoveToken(token)}
                        disabled={removingToken === token.mint}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => onSendToken(token)}
                      disabled={token.balance === 0}
                      className="bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] rounded-xl disabled:opacity-50"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
