'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Settings, AlertCircle, CheckCircle2, Zap, Loader2, Lock } from 'lucide-react'
import { feeConfigService, type FeeStructure } from '@/lib/fee-config-service'
import { NETWORK_PRIORITY_PRESETS } from '@/lib/platform-fees'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FeeConfigurationPanel() {
  const [platformFees, setPlatformFees] = useState<any>(null)
  const [networkPriority, setNetworkPriority] = useState<string>('standard')
  const [rpcEndpoint, setRpcEndpoint] = useState('')
  const [rpcName, setRpcName] = useState('')
  const [rpcStatus, setRpcStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected')
  const [autoCompound, setAutoCompound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [testingRpc, setTestingRpc] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = () => {
    try {
      const fees = feeConfigService.getPlatformFees()
      setPlatformFees(fees)
      const priority = feeConfigService.getNetworkPriority()
      setNetworkPriority(priority.mode)
      const rpc = feeConfigService.getRpcConfig()
      setRpcEndpoint(rpc.endpoint)
      setRpcName(rpc.name)
      setRpcStatus(rpc.status)
      setAutoCompound(feeConfigService.getAutoCompound())
    } catch (err) {
      setError('Failed to load configuration')
    }
  }

  const handlePriorityChange = (mode: 'economy' | 'standard' | 'priority') => {
    feeConfigService.setNetworkPriority(mode)
    setNetworkPriority(mode)
    setSuccess(`Network priority set to ${mode}`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleTestRpc = async () => {
    if (!rpcEndpoint) {
      setError('Enter an RPC endpoint')
      return
    }

    try {
      setTestingRpc(true)
      setError('')
      const isValid = await feeConfigService.validateRpcEndpoint(rpcEndpoint)
      
      if (isValid) {
        setRpcStatus('connected')
        setSuccess('RPC endpoint is valid and responsive')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setRpcStatus('disconnected')
        setError('RPC endpoint is not responding')
      }
    } catch (err) {
      setRpcStatus('disconnected')
      setError('Failed to validate RPC endpoint')
    } finally {
      setTestingRpc(false)
    }
  }

  const handleSetCustomRpc = () => {
    if (!rpcEndpoint || !rpcName) {
      setError('Enter both endpoint and name')
      return
    }

    feeConfigService.setCustomRpc(rpcEndpoint, rpcName)
    setSuccess('Custom RPC endpoint set')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleResetRpc = () => {
    feeConfigService.resetToDefaultRpc()
    loadConfig()
    setSuccess('Reset to default RPC')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleAutoCompoundToggle = (enabled: boolean) => {
    feeConfigService.setAutoCompound(enabled)
    setAutoCompound(enabled)
    setSuccess(`Auto-compound ${enabled ? 'enabled' : 'disabled'}`)
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!platformFees) {
    return (
      <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#8b005d] mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="priority" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1a0a14]/50 border border-[#8b005d]/20">
          <TabsTrigger value="priority">Transaction Priority</TabsTrigger>
          <TabsTrigger value="fees">Platform Fees</TabsTrigger>
          <TabsTrigger value="rpc">RPC Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="space-y-4">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Zap className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-400 text-sm">
              Choose your transaction priority. Higher priority = faster processing but higher network costs.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {(Object.entries(NETWORK_PRIORITY_PRESETS) as any[]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePriorityChange(key as any)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  networkPriority === key
                    ? 'bg-[#8b005d]/20 border-[#8b005d]/50'
                    : 'bg-[#0b0b0b]/70 border-[#3a2a34] hover:border-[#8b005d]/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#f8e1f4]">{preset.name}</p>
                  {networkPriority === key && <CheckCircle2 className="w-5 h-5 text-[#d4308e]" />}
                </div>
                <p className="text-xs text-[#c0c0c0]">{preset.description}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <p className="text-[#8b005d]">Est. Time:</p>
                    <p className="text-[#f8e1f4]">{preset.estimatedTime}</p>
                  </div>
                  <div>
                    <p className="text-[#8b005d]">Est. Cost:</p>
                    <p className="text-[#f8e1f4]">{preset.estimatedCost}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <Lock className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-400 text-sm">
              Platform fees are fixed and help us maintain world-class service. These fees are not configurable and apply to all users.
            </AlertDescription>
          </Alert>

          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#f8e1f4]">
                <DollarSign className="w-5 h-5" />
                Fixed Platform Fees
              </CardTitle>
              <CardDescription className="text-[#c0c0c0]">
                These fees ensure we can provide secure, fast, and reliable service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-[#0b0b0b]/70 rounded border border-[#3a2a34]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#c0c0c0]">Swap Fee</p>
                    <p className="text-lg font-bold text-[#f8e1f4]">{(platformFees.swap * 100).toFixed(3)}%</p>
                  </div>
                  <Badge variant="outline" className="text-[#8b005d]">Fixed</Badge>
                </div>
              </div>
              <div className="p-3 bg-[#0b0b0b]/70 rounded border border-[#3a2a34]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#c0c0c0]">NFT Listing Fee</p>
                    <p className="text-lg font-bold text-[#f8e1f4]">{(platformFees.nftListing * 100).toFixed(1)}%</p>
                  </div>
                  <Badge variant="outline" className="text-[#8b005d]">Fixed</Badge>
                </div>
              </div>
              <div className="p-3 bg-[#0b0b0b]/70 rounded border border-[#3a2a34]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#c0c0c0]">Staking Rewards</p>
                    <p className="text-lg font-bold text-[#f8e1f4]">No Fee</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Free</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]">Why Fixed Fees?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#c0c0c0] space-y-2">
              <p>• Ensures consistent quality across all transactions</p>
              <p>• Funds security audits and updates</p>
              <p>• Supports 24/7 monitoring and infrastructure</p>
              <p>• Enables competitive rates with other wallets</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RPC Configuration Tab */}
        <TabsContent value="rpc" className="space-y-4">
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#f8e1f4]">
                <Settings className="w-5 h-5" />
                RPC Endpoint Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-[#0b0b0b]/70 rounded border border-[#3a2a34]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#c0c0c0]">Current Endpoint</p>
                  <Badge
                    variant={rpcStatus === 'connected' ? 'default' : 'secondary'}
                    className={rpcStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
                  >
                    {rpcStatus}
                  </Badge>
                </div>
                <p className="text-[#f8e1f4] font-mono text-sm break-all">{rpcEndpoint}</p>
                <p className="text-xs text-[#c0c0c0] mt-2">{rpcName}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]">Set Custom RPC</CardTitle>
              <CardDescription className="text-[#c0c0c0]">
                Use a private RPC for better performance and reliability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#f8e1f4]">RPC Endpoint URL</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={rpcEndpoint}
                  onChange={(e) => setRpcEndpoint(e.target.value)}
                  className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#f8e1f4]">RPC Name</Label>
                <Input
                  type="text"
                  placeholder="e.g., Helius, QuickNode"
                  value={rpcName}
                  onChange={(e) => setRpcName(e.target.value)}
                  className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleTestRpc}
                  disabled={testingRpc || !rpcEndpoint}
                  variant="outline"
                  className="flex-1 border-[#8b005d]/30 text-[#f8e1f4]"
                >
                  {testingRpc ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <Button
                  onClick={handleSetCustomRpc}
                  className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e]"
                >
                  Set Custom RPC
                </Button>
              </div>

              <Button
                onClick={handleResetRpc}
                variant="outline"
                className="w-full border-[#8b005d]/30 text-[#f8e1f4]"
              >
                Reset to Default
              </Button>

              <Alert className="bg-blue-500/10 border-blue-500/30">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-400 text-xs">
                  Popular RPC providers: Helius, QuickNode, Alchemy, Magic Eden - Use private endpoints for better performance and no rate limits
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
