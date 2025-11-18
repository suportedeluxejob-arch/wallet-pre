'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Loader2, CheckCircle2, AlertCircle, TrendingUp, Star } from 'lucide-react'
import { searchTokens, getTokenInfo, verifyTokenMint, getPopularTokens, type TokenInfo } from '@/lib/token-search-service'
import { addUserToken, type UserToken } from '@/lib/user-tokens-service'
import type { NetworkType } from '@/lib/wallet-utils'

interface AddTokenDialogProps {
  walletAddress: string
  network: NetworkType
  onTokenAdded: () => void
}

export default function AddTokenDialog({ walletAddress, network, onTokenAdded }: AddTokenDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TokenInfo[]>([])
  const [popularTokens, setPopularTokens] = useState<TokenInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [addingToken, setAddingToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadPopularTokens()
    }
  }, [open])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadPopularTokens = async () => {
    try {
      const tokens = await getPopularTokens(20)
      setPopularTokens(tokens)
    } catch (error) {
      console.error('Error loading popular tokens:', error)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const results = await searchTokens(searchQuery)
      setSearchResults(results)
      
      if (results.length === 0) {
        setError('No tokens found. Try searching by name, symbol, or contract address.')
      }
    } catch (error) {
      console.error('Error searching tokens:', error)
      setError('Failed to search tokens. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToken = async (token: TokenInfo) => {
    setAddingToken(token.address)
    setError(null)
    
    try {
      // Verify token exists on-chain
      const isValid = await verifyTokenMint(token.address, network)
      
      if (!isValid) {
        setError('Token not found on the selected network. Please check the network and try again.')
        setAddingToken(null)
        return
      }

      // Add to user's custom tokens
      const userToken: UserToken = {
        mint: token.address,
        symbol: token.symbol,
        name: token.name,
        logoURI: token.logoURI,
        decimals: token.decimals,
        addedAt: Date.now(),
        isFavorite: true,
      }

      await addUserToken(walletAddress, userToken)
      
      // Success - close dialog and refresh
      onTokenAdded()
      setOpen(false)
      setSearchQuery('')
      setSearchResults([])
    } catch (error) {
      console.error('Error adding token:', error)
      setError('Failed to add token. Please try again.')
    } finally {
      setAddingToken(null)
    }
  }

  const displayTokens = searchQuery.length >= 2 ? searchResults : popularTokens

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4] hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Token
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-[#1a0a14] border-[#3a2a34]">
        <DialogHeader>
          <DialogTitle className="text-[#f8e1f4] text-2xl">Add Custom Token</DialogTitle>
          <DialogDescription className="text-[#c0c0c0]">
            Search for tokens by name, symbol, or paste a token contract address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#c0c0c0]" />
            <Input
              placeholder="Search by name, symbol, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8b005d] animate-spin" />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Section Title */}
          <div className="flex items-center gap-2 text-[#c0c0c0] text-sm">
            {searchQuery.length >= 2 ? (
              <>
                <Search className="w-4 h-4" />
                <span>Search Results ({displayTokens.length})</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Popular Tokens</span>
              </>
            )}
          </div>

          {/* Token List */}
          <ScrollArea className="h-[400px] rounded-lg border border-[#3a2a34]">
            <div className="p-2 space-y-2">
              {displayTokens.length === 0 && !loading && !error && (
                <div className="text-center py-8 text-[#c0c0c0]">
                  <p>Start typing to search for tokens</p>
                </div>
              )}

              {displayTokens.map((token) => (
                <div
                  key={token.address}
                  className="flex items-center justify-between p-3 bg-[#0b0b0b]/50 hover:bg-[#0b0b0b] border border-[#3a2a34] rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Token Logo */}
                    {token.logoURI ? (
                      <img 
                        src={token.logoURI || "/placeholder.svg"} 
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b005d] to-[#d4308e] flex items-center justify-center">
                        <span className="text-[#f8e1f4] font-bold text-sm">
                          {token.symbol.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Token Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[#f8e1f4] font-semibold">{token.symbol}</p>
                        {token.verified && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-[#c0c0c0] text-sm truncate">{token.name}</p>
                      <p className="text-[#c0c0c0]/50 text-xs font-mono truncate">
                        {token.address.slice(0, 8)}...{token.address.slice(-8)}
                      </p>
                    </div>

                    {/* Token Tags */}
                    {token.tags && token.tags.length > 0 && (
                      <div className="flex gap-1">
                        {token.tags.slice(0, 2).map((tag) => (
                          <Badge 
                            key={tag}
                            variant="outline"
                            className="text-xs border-[#8b005d]/30 text-[#8b005d]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    onClick={() => handleAddToken(token)}
                    disabled={addingToken === token.address}
                    size="sm"
                    className="bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d] border border-[#8b005d]/30"
                  >
                    {addingToken === token.address ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Network Warning */}
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <p className="text-sm text-yellow-400">
              Make sure the token exists on <span className="font-semibold capitalize">{network}</span> network
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
