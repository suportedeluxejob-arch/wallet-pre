'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowDown, RefreshCw, Loader2, AlertCircle, TrendingUp, Info, Search, Star } from 'lucide-react'
import { 
  getSwapQuote, 
  formatSwapAmount, 
  calculatePriceImpact, 
  calculateSwapFees,
  getAmountAfterPlatformFee,
  PLATFORM_FEE_PERCENTAGE,
  type SwapQuote,
  type SwapFees,
  executeSwapWithFee
} from '@/lib/swap-service'
import { swapHistoryService } from '@/lib/swap-history-service'
import { swapTokensService, type SwapToken } from '@/lib/swap-tokens-service'
import type { SPLToken, WalletAccount } from '@/lib/wallet-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SwapHistoryPanel from './swap-history-panel'

interface TokenSwapProps {
  wallet: WalletAccount
  tokens: SPLToken[]
}

export default function TokenSwap({ wallet, tokens }: TokenSwapProps) {
  const [inputToken, setInputToken] = useState<SwapToken>(swapTokensService.getPopularTokens()[0])
  const [outputToken, setOutputToken] = useState<SwapToken>(swapTokensService.getPopularTokens()[1])
  const [inputAmount, setInputAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [fees, setFees] = useState<SwapFees | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [customSlippage, setCustomSlippage] = useState('')
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)
  const [tokenSearch, setTokenSearch] = useState('')
  const [showTokenList, setShowTokenList] = useState(false)
  const [filteredTokens, setFilteredTokens] = useState<SwapToken[]>([])

  const availableTokens = swapTokensService.getPopularTokens()

  useEffect(() => {
    if (inputAmount && parseFloat(inputAmount) > 0) {
      const timer = setTimeout(() => {
        fetchQuote()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [inputAmount, inputToken, outputToken, slippage, customSlippage])

  useEffect(() => {
    if (tokenSearch) {
      setFilteredTokens(swapTokensService.searchTokens(tokenSearch))
    } else {
      setFilteredTokens(swapTokensService.getFavorites().length > 0 
        ? swapTokensService.getFavorites()
        : availableTokens.slice(0, 10)
      )
    }
  }, [tokenSearch])

  const fetchQuote = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return

    try {
      setLoading(true)
      setError('')
      
      const amountInSmallestUnit = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals))
      const amountAfterFee = getAmountAfterPlatformFee(amountInSmallestUnit)
      
      const effectiveSlippage = customSlippage ? parseFloat(customSlippage) : slippage
      
      const q = await getSwapQuote(
        inputToken.mint,
        outputToken.mint,
        Math.floor(amountAfterFee),
        Math.floor(effectiveSlippage * 100)
      )

      if (q) {
        setQuote(q)
        
        const calculatedFees = calculateSwapFees(
          amountInSmallestUnit,
          inputToken.decimals,
          0,
          0.00025
        )
        setFees(calculatedFees)
      } else {
        setError('Failed to fetch quote')
      }
    } catch (err) {
      setError('Error fetching quote')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSwapTokens = () => {
    const temp = inputToken
    setInputToken(outputToken)
    setOutputToken(temp)
    setQuote(null)
    setFees(null)
  }

  const handleSelectToken = (token: SwapToken, isInput: boolean) => {
    if (isInput) {
      setInputToken(token)
    } else {
      setOutputToken(token)
    }
    setTokenSearch('')
    setShowTokenList(false)
  }

  const getTokenBalance = (tokenMint: string): number => {
    const userToken = tokens.find(t => t.mint === tokenMint)
    return userToken ? userToken.balance : 0
  }

  const hasInsufficientBalance = (): boolean => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return false
    const balance = getTokenBalance(inputToken.mint)
    return parseFloat(inputAmount) > balance
  }

  const handleSwap = async () => {
    if (hasInsufficientBalance()) {
      setError(`Saldo insuficiente. Você tem apenas ${getTokenBalance(inputToken.mint)} ${inputToken.symbol}`)
      return
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setError('Digite um valor válido')
      return
    }

    try {
      setLoading(true)
      setError('')

      const amountInSmallestUnit = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputToken.decimals))
      
      const historyEntry = swapHistoryService.addEntry({
        inputMint: inputToken.mint,
        inputSymbol: inputToken.symbol,
        inputAmount: parseFloat(inputAmount),
        outputMint: outputToken.mint,
        outputSymbol: outputToken.symbol,
        outputAmount: quote ? formatSwapAmount(quote.outputAmount, outputToken.decimals) : 0,
        slippage: customSlippage ? parseFloat(customSlippage) : slippage,
        priceImpact: quote ? parseFloat(calculatePriceImpact(quote)) : 0,
        platformFee: fees ? formatSwapAmount(fees.platformFee, inputToken.decimals) : 0,
        status: 'pending',
        routePlan: quote?.routePlan,
      })

      console.log('[v0] Starting swap:', {
        from: inputToken.symbol,
        to: outputToken.symbol,
        amount: inputAmount,
        amountInSmallestUnit,
        historyEntryId: historyEntry.id,
      })

      const result = await executeSwapWithFee(
        wallet.privateKey,
        inputToken.mint,
        outputToken.mint,
        amountInSmallestUnit,
        Math.floor((customSlippage ? parseFloat(customSlippage) : slippage) * 100)
      )

      console.log('[v0] Swap successful!', result)

      swapHistoryService.updateEntry(historyEntry.id, {
        status: 'confirmed',
        signature: result.signature,
        outputAmount: formatSwapAmount(result.outputAmount, outputToken.decimals),
      })

      alert(`Swap realizado com sucesso!\n\nAssinatura: ${result.signature}\n\nVocê receberá aproximadamente ${formatSwapAmount(result.outputAmount, outputToken.decimals).toFixed(6)} ${outputToken.symbol}`)
      
      setInputAmount('')
      setQuote(null)
      setFees(null)
      
    } catch (err: any) {
      console.error('[v0] Swap failed:', err)
      setError(err.message || 'Falha ao executar swap. Tente novamente.')
      
      // Note: This assumes we saved the entry ID somewhere - in a production app you'd want better error handling
    } finally {
      setLoading(false)
    }
  }

  const outputAmount = quote ? formatSwapAmount(quote.outputAmount, outputToken.decimals) : 0
  const priceImpact = quote ? calculatePriceImpact(quote) : '0.00%'
  const platformFeeAmount = fees ? formatSwapAmount(fees.platformFee, inputToken.decimals) : 0
  const totalFeesAmount = fees ? formatSwapAmount(fees.totalFees, inputToken.decimals) : 0
  const userBalance = getTokenBalance(inputToken.mint)

  return (
    <div className="space-y-4">
      <Tabs defaultValue="swap" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1a0a14]/50 border border-[#8b005d]/20">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="swap" className="space-y-4">
          <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                <TrendingUp className="w-5 h-5 text-[#8b005d]" />
                Token Swap
              </CardTitle>
              <CardDescription className="text-[#c0c0c0]">
                Exchange tokens with only 0.25% platform fee
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-3 bg-gradient-to-r from-[#8b005d]/10 to-[#d4308e]/10 rounded-lg border border-[#8b005d]/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#8b005d] mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#f8e1f4]">A wallet mais barata da Solana</p>
                    <p className="text-xs text-[#c0c0c0]">Economize até 70% em taxas de swap</p>
                  </div>
                </div>
              </div>

              {/* Input Token */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[#f8e1f4]">From</Label>
                  <span className="text-xs text-[#c0c0c0]">
                    Saldo: {userBalance.toFixed(4)} {inputToken.symbol}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search token..."
                      value={tokenSearch}
                      onChange={(e) => {
                        setTokenSearch(e.target.value)
                        setShowTokenList(true)
                      }}
                      onFocus={() => setShowTokenList(true)}
                      className="px-3 py-2 bg-[#0b0b0b]/70 border border-[#3a2a34] text-[#f8e1f4] rounded-xl"
                    />
                    {showTokenList && tokenSearch === '' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a0a14] border border-[#3a2a34] rounded-xl max-h-48 overflow-y-auto z-10">
                        {filteredTokens.map((token) => (
                          <button
                            key={token.mint}
                            onClick={() => handleSelectToken(token, true)}
                            className="w-full px-3 py-2 text-left hover:bg-[#2a1a24] transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{token.logo}</span>
                              <div>
                                <p className="text-[#f8e1f4] text-sm font-semibold">{token.symbol}</p>
                                <p className="text-[#c0c0c0] text-xs">{token.name}</p>
                              </div>
                            </div>
                            {swapTokensService.isFavorite(token.mint) && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => {
                      setInputAmount(e.target.value)
                      setError('')
                    }}
                    placeholder="0.00"
                    className={`flex-1 bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] placeholder:text-[#c0c0c0]/50 rounded-xl ${
                      hasInsufficientBalance() ? 'border-red-500/50' : ''
                    }`}
                  />
                </div>
                {hasInsufficientBalance() && (
                  <p className="text-xs text-red-400">Saldo insuficiente</p>
                )}
              </div>

              {/* Swap Direction Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapTokens}
                  className="p-3 hover:bg-[#2a1a24] rounded-full transition-colors text-[#8b005d] border border-[#3a2a34]"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>

              {/* Output Token */}
              <div className="space-y-2">
                <Label className="text-[#f8e1f4]">To (estimated)</Label>
                <div className="flex gap-2">
                  <div className="px-3 py-2 bg-[#0b0b0b]/70 border border-[#3a2a34] text-[#f8e1f4] rounded-xl w-32 flex items-center">
                    {outputToken.logo} {outputToken.symbol}
                  </div>
                  <Input
                    type="number"
                    value={loading ? 'Loading...' : outputAmount.toFixed(6)}
                    disabled
                    className="flex-1 bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4] rounded-xl disabled:opacity-60"
                  />
                </div>
              </div>

              {quote && fees && (
                <div className="space-y-3 p-4 bg-[#0b0b0b]/70 rounded-lg border border-[#3a2a34]">
                  <button
                    onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-[#f8e1f4]"
                  >
                    <span>Fee Breakdown</span>
                    <span className="text-[#8b005d]">{showFeeBreakdown ? '▼' : '▶'}</span>
                  </button>

                  {showFeeBreakdown && (
                    <div className="space-y-2 pt-2 border-t border-[#3a2a34]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#c0c0c0]">Platform Fee (0.25%)</span>
                        <span className="text-[#8b005d] font-semibold">
                          {platformFeeAmount.toFixed(6)} {inputToken.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#c0c0c0]">Network Fee (Solana)</span>
                        <span className="text-[#f8e1f4]">~0.00025 SOL</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#c0c0c0]">Price Impact</span>
                        <span className={parseFloat(priceImpact) > 1 ? 'text-red-400' : 'text-green-400'}>
                          {priceImpact}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-[#3a2a34]">
                        <span className="text-[#f8e1f4] font-semibold">Total Fees</span>
                        <span className="text-[#f8e1f4] font-semibold">
                          {totalFeesAmount.toFixed(6)} {inputToken.symbol}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[#f8e1f4] text-sm">Slippage Tolerance</Label>
                <div className="flex gap-2 flex-wrap">
                  {[0.1, 0.5, 1].map(value => (
                    <button
                      key={value}
                      onClick={() => {
                        setSlippage(value)
                        setCustomSlippage('')
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        !customSlippage && slippage === value
                          ? 'bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]'
                          : 'bg-[#0b0b0b]/70 text-[#c0c0c0] border border-[#3a2a34]'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <Input
                    type="number"
                    placeholder="Custom %"
                    value={customSlippage}
                    onChange={(e) => setCustomSlippage(e.target.value)}
                    min="0"
                    max="50"
                    step="0.1"
                    className="w-24 px-2 py-1 bg-[#0b0b0b]/70 border border-[#3a2a34] text-[#f8e1f4] rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <Button
                onClick={handleSwap}
                disabled={loading || !inputAmount || !quote || parseFloat(inputAmount) <= 0 || hasInsufficientBalance()}
                className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] hover:from-[#a0006d] hover:to-[#e4409e] text-[#f8e1f4] font-bold rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching best price...
                  </>
                ) : hasInsufficientBalance() ? (
                  'Saldo Insuficiente'
                ) : (
                  'Swap Tokens'
                )}
              </Button>

              <div className="p-4 bg-[#0b0b0b]/50 rounded-lg border border-[#3a2a34]">
                <p className="text-xs text-[#f8e1f4] mb-3 font-semibold">Comparação de Taxas de Swap:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs py-1.5 px-2 bg-[#2a1a24]/50 rounded">
                    <span className="text-[#c0c0c0]">Phantom (swap integrado)</span>
                    <span className="text-red-400 font-semibold">0.85%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 px-2 bg-[#2a1a24]/50 rounded">
                    <span className="text-[#c0c0c0]">Trust Wallet (swap integrado)</span>
                    <span className="text-orange-400 font-semibold">0.75%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1.5 px-2 bg-[#2a1a24]/50 rounded">
                    <span className="text-[#c0c0c0]">Backpack (swap integrado)</span>
                    <span className="text-yellow-400 font-semibold">0.50%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-2 px-2 bg-gradient-to-r from-[#8b005d]/20 to-[#d4308e]/20 border border-[#8b005d]/40 rounded">
                    <span className="text-[#f8e1f4] font-bold">✨ Solary (Você)</span>
                    <span className="text-green-400 font-bold">0.25%</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-[10px] text-[#c0c0c0]/70">
                    *Wallets não custodiais (Phantom, Solflare, etc.) não cobram taxas de carteira
                  </p>
                  <p className="text-[10px] text-[#c0c0c0]/70">
                    *Taxas mostradas são apenas dos recursos de swap integrados nas wallets
                  </p>
                  <p className="text-[10px] text-[#8b005d] font-semibold">
                    + Taxas de rede Solana (~0.00025 SOL) aplicam-se a todas as transações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <SwapHistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
