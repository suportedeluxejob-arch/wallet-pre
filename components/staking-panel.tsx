'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, TrendingDown, Coins, Clock, Award, AlertCircle, ChevronDown, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { 
  createStakingService, 
  StakeAccount, 
  Validator, 
  StakeHistory 
} from '@/lib/staking-service'
import { createStakingAPYService, type APYData } from '@/lib/staking-apy-service'
import { stakingRewardsMonitor } from '@/lib/staking-rewards-monitor'
import { NETWORK_ENDPOINTS, NetworkType } from '@/lib/wallet-utils'
import { useLanguage } from '@/contexts/language-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Keypair, PublicKey } from '@solana/web3.js'
import StakingRewardsChart from './staking-rewards-chart'

interface StakingPanelProps {
  wallet: any
  network: string
}

export default function StakingPanel({ wallet, network }: StakingPanelProps) {
  const { t } = useLanguage()
  const [stakeAccounts, setStakeAccounts] = useState<StakeAccount[]>([])
  const [validators, setValidators] = useState<Validator[]>([])
  const [history, setHistory] = useState<StakeHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedValidator, setSelectedValidator] = useState('')
  const [estimatedApy, setEstimatedApy] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rpcWarning, setRpcWarning] = useState(false)
  const [apyData, setApyData] = useState<APYData | null>(null)
  const [refreshingAPY, setRefreshingAPY] = useState(false)

  const networkEndpoint = NETWORK_ENDPOINTS[network as NetworkType] || NETWORK_ENDPOINTS.mainnet
  const stakingService = createStakingService(networkEndpoint)
  const apyService = createStakingAPYService(networkEndpoint)

  useEffect(() => {
    loadStakingData()
    loadRealAPY()
  }, [wallet, network])

  const loadRealAPY = async () => {
    try {
      setRefreshingAPY(true)
      const realAPY = await apyService.getRealAPY()
      setApyData(realAPY)
      setEstimatedApy(realAPY.currentAPY)
    } catch (err) {
      console.error('Error loading real APY:', err)
    } finally {
      setRefreshingAPY(false)
    }
  }

  const loadStakingData = async () => {
    try {
      setLoading(true)
      setRpcWarning(false)
      const walletPubkey = new PublicKey(wallet.publicKey)
      
      const [accounts, vals, hist] = await Promise.all([
        stakingService.getStakeAccounts(walletPubkey),
        stakingService.getValidators(),
        Promise.resolve(stakingService.getStakingHistory()),
      ])

      setStakeAccounts(accounts)
      setValidators(vals)
      setHistory(hist)

      accounts.forEach((account) => {
        if (account.state === 'active') {
          const solAmount = account.lamports / 1e9
          stakingRewardsMonitor.startMonitoring(
            account.pubkey,
            solAmount,
            estimatedApy
          )
        }
      })

      if (accounts.length === 0 && network === 'mainnet') {
        setRpcWarning(true)
      }
    } catch (err) {
      console.error('Error loading staking data:', err)
      setError('Failed to load staking data')
    } finally {
      setLoading(false)
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || !selectedValidator) {
      setError('Please enter amount and select validator')
      return
    }

    const amount = parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid stake amount')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const keypair = Keypair.fromSecretKey(new Uint8Array(wallet.secretKey))

      const result = await stakingService.createStakeAccount(
        keypair,
        amount,
        selectedValidator
      )

      setSuccess(`Successfully staked ${amount} SOL! Signature: ${result.signature.slice(0, 8)}...`)
      setStakeAmount('')
      
      stakingRewardsMonitor.startMonitoring(
        result.stakeAccount,
        amount,
        estimatedApy
      )
      
      await loadStakingData()
    } catch (err: any) {
      console.error('Error staking:', err)
      setError(err.message || 'Failed to stake SOL')
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async (stakeAccountPubkey: string) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const keypair = Keypair.fromSecretKey(new Uint8Array(wallet.secretKey))
      const signature = await stakingService.deactivateStake(keypair, stakeAccountPubkey)

      setSuccess(`Unstake initiated! Signature: ${signature.slice(0, 8)}...`)
      
      stakingRewardsMonitor.stopMonitoring(stakeAccountPubkey)
      
      await loadStakingData()
    } catch (err: any) {
      console.error('Error unstaking:', err)
      setError(err.message || 'Failed to unstake')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (stakeAccountPubkey: string, amount: number) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const keypair = Keypair.fromSecretKey(new Uint8Array(wallet.secretKey))
      const signature = await stakingService.withdrawStake(keypair, stakeAccountPubkey, amount)

      setSuccess(`Withdrawal successful! Signature: ${signature.slice(0, 8)}...`)
      
      await loadStakingData()
    } catch (err: any) {
      console.error('Error withdrawing:', err)
      setError(err.message || 'Failed to withdraw')
    } finally {
      setLoading(false)
    }
  }

  const totalStaked = stakeAccounts.reduce((sum, acc) => sum + acc.lamports / 1e9, 0)
  const estimatedRewards = stakingService.calculateRewards(totalStaked, 30, estimatedApy)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Total Staked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-[#d4308e]" />
              <p className="text-2xl font-bold text-[#f8e1f4]">{totalStaked.toFixed(4)} SOL</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-[#c0c0c0]">Real-time APY</CardDescription>
              <Button
                onClick={loadRealAPY}
                disabled={refreshingAPY}
                size="sm"
                variant="ghost"
                className="text-[#8b005d] hover:text-[#d4308e]"
              >
                <RefreshCw className={`w-3 h-3 ${refreshingAPY ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-2xl font-bold text-[#f8e1f4]">{estimatedApy.toFixed(2)}%</p>
            </div>
            {apyData && (
              <div className="mt-2 text-xs text-[#c0c0c0]">
                <p>Avg: {apyData.averageAPY.toFixed(2)}% | Range: {apyData.minAPY.toFixed(2)}%-{apyData.maxAPY.toFixed(2)}%</p>
                <p>Confidence: {(apyData.confidence * 100).toFixed(0)}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Est. Monthly Rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <p className="text-2xl font-bold text-[#f8e1f4]">{estimatedRewards.toFixed(4)} SOL</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {rpcWarning && (
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-400">
            Public RPC endpoints have limited access to staking data. For full staking features, consider using a custom RPC endpoint in Settings.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <AlertCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {totalStaked > 0 && (
        <StakingRewardsChart
          stakedAmount={totalStaked}
          apy={estimatedApy}
          days={30}
        />
      )}

      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1a0a14]/50 border border-[#8b005d]/20">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="accounts">My Stakes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-6">
          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]">Stake SOL</CardTitle>
              <CardDescription className="text-[#c0c0c0]">
                Stake your SOL to earn rewards at {estimatedApy.toFixed(2)}% APY
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[#f8e1f4]">Amount (SOL)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validator" className="text-[#f8e1f4]">Select Validator</Label>
                <Select value={selectedValidator} onValueChange={setSelectedValidator}>
                  <SelectTrigger className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]">
                    <SelectValue placeholder="Choose a validator" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0a14] border-[#8b005d]/30">
                    {validators.map((validator) => (
                      <SelectItem 
                        key={validator.votePubkey} 
                        value={validator.votePubkey}
                        className="text-[#f8e1f4] hover:bg-[#2a1a24]"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{validator.votePubkey.slice(0, 8)}...</span>
                          <Badge variant="outline" className="ml-2">
                            {validator.commission}% fee
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/30">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">
                  Staked SOL will be locked and earn ~{estimatedApy.toFixed(2)}% APY. 
                  Unstaking takes 2-3 days to complete.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleStake}
                disabled={loading || !stakeAmount || !selectedValidator}
                className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Stake SOL'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {stakeAccounts.length === 0 ? (
            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardContent className="py-8 text-center">
                <p className="text-[#c0c0c0]">No active stakes found</p>
              </CardContent>
            </Card>
          ) : (
            stakeAccounts.map((account) => (
              <Card key={account.pubkey} className="bg-[#1a0a14]/50 border-[#8b005d]/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#f8e1f4] font-semibold">
                        {(account.lamports / 1e9).toFixed(4)} SOL
                      </p>
                      <p className="text-[#c0c0c0] text-xs">
                        {account.pubkey.slice(0, 8)}...{account.pubkey.slice(-8)}
                      </p>
                    </div>
                    <Badge 
                      variant={account.state === 'active' ? 'default' : 'secondary'}
                      className={account.state === 'active' ? 'bg-green-500/20 text-green-400' : ''}
                    >
                      {account.state}
                    </Badge>
                  </div>

                  {account.voter && (
                    <div className="text-xs text-[#c0c0c0]">
                      Validator: {account.voter.slice(0, 8)}...
                    </div>
                  )}

                  <div className="flex gap-2">
                    {account.state === 'active' && (
                      <Button
                        onClick={() => handleUnstake(account.pubkey)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-[#8b005d]/30 text-[#f8e1f4]"
                      >
                        Unstake
                      </Button>
                    )}
                    {account.state === 'inactive' && (
                      <Button
                        onClick={() => handleWithdraw(account.pubkey, account.lamports / 1e9)}
                        disabled={loading}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e]"
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardContent className="py-8 text-center">
                <p className="text-[#c0c0c0]">No staking history yet</p>
              </CardContent>
            </Card>
          ) : (
            history.map((entry) => (
              <Card key={entry.id} className="bg-[#1a0a14]/50 border-[#8b005d]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {entry.type === 'stake' ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="text-[#f8e1f4] font-semibold capitalize">{entry.type}</p>
                        <p className="text-[#c0c0c0] text-xs">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f8e1f4] font-semibold">{entry.amount} SOL</p>
                      <Badge variant="secondary" className="text-xs">
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
