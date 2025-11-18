'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, TrendingUp, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createRealTimeMonitor, type PriceAlertConfig } from '@/lib/real-time-monitor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NETWORK_ENDPOINTS, NetworkType } from '@/lib/wallet-utils'

interface RealTimeDashboardProps {
  walletAddress: string
  network: string
}

export default function RealTimeDashboard({ walletAddress, network }: RealTimeDashboardProps) {
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertConfig[]>([])
  const [newToken, setNewToken] = useState('')
  const [newThreshold, setNewThreshold] = useState('')
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above')
  const [networkStatus, setNetworkStatus] = useState<{
    status: 'healthy' | 'congested' | 'slow'
    tps: number
    avgSlot: number
  }>({ status: 'healthy', tps: 0, avgSlot: 0 })
  const [estimatedFee, setEstimatedFee] = useState<number>(0)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const networkEndpoint = NETWORK_ENDPOINTS[network as NetworkType] || NETWORK_ENDPOINTS.mainnet
  const monitor = createRealTimeMonitor(networkEndpoint)

  useEffect(() => {
    loadMonitorData()
    startMonitoring()

    return () => {
      monitor.stopAllMonitoring()
    }
  }, [walletAddress, network])

  const loadMonitorData = async () => {
    try {
      const alerts = monitor.getPriceAlerts()
      setPriceAlerts(alerts)

      // Fire and forget for non-critical updates
      monitor.getNetworkStatus().then(setNetworkStatus).catch(() => {
        // Silently fail, keep default values
      })

      monitor.getEstimatedFee().then(setEstimatedFee).catch(() => {
        // Silently fail, keep default value
      })
    } catch (err) {
      console.error('Error loading monitor data:', err)
    }
  }

  const startMonitoring = () => {
    monitor.startWalletMonitoring(walletAddress)
    setIsMonitoring(true)
  }

  const handleAddPriceAlert = () => {
    if (!newToken || !newThreshold) {
      setError('Enter token and threshold')
      return
    }

    try {
      const threshold = parseFloat(newThreshold)
      monitor.addPriceAlert(newToken, threshold, newCondition)
      
      setPriceAlerts(monitor.getPriceAlerts())
      setNewToken('')
      setNewThreshold('')
      setSuccess(`Price alert added for ${newToken}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add price alert')
    }
  }

  const handleRemovePriceAlert = (token: string) => {
    monitor.removePriceAlert(token)
    setPriceAlerts(monitor.getPriceAlerts())
    setSuccess(`Removed alert for ${token}`)
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Network Status */}
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Network Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  networkStatus.status === 'healthy'
                    ? 'bg-green-500/20 text-green-400'
                    : networkStatus.status === 'congested'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {networkStatus.status}
              </Badge>
              <Activity className="w-4 h-4 text-[#8b005d]" />
            </div>
            <p className="text-sm text-[#c0c0c0] mt-2">
              {networkStatus.tps.toFixed(0)} TPS
            </p>
          </CardContent>
        </Card>

        {/* Estimated Fee */}
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Est. Network Fee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <p className="text-2xl font-bold text-[#f8e1f4]">
                {(estimatedFee * 1e9).toFixed(0)} <span className="text-xs">lamports</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Monitoring Status */}
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Monitoring Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isMonitoring ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-semibold text-green-400">Active</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm font-semibold text-yellow-400">Inactive</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Price Alerts */}
      <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#f8e1f4]">
            <TrendingUp className="w-5 h-5" />
            Price Alerts
          </CardTitle>
          <CardDescription className="text-[#c0c0c0]">
            Get notified when token prices reach specific levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-[#f8e1f4] text-sm">Token Symbol</Label>
                <Input
                  placeholder="SOL"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value.toUpperCase())}
                  className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[#f8e1f4] text-sm">Price ($)</Label>
                <Input
                  type="number"
                  placeholder="150.00"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[#f8e1f4] text-sm">Condition</Label>
                <Select value={newCondition} onValueChange={(val: any) => setNewCondition(val)}>
                  <SelectTrigger className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0a14] border-[#8b005d]/30">
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddPriceAlert}
                className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4] self-end"
              >
                Add Alert
              </Button>
            </div>
          </div>

          {priceAlerts.length > 0 ? (
            <div className="space-y-2">
              {priceAlerts.map((alert) => (
                <div
                  key={`${alert.token}-${alert.threshold}`}
                  className="p-3 bg-[#0b0b0b]/70 rounded border border-[#3a2a34] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[#8b005d]">
                      {alert.token}
                    </Badge>
                    <p className="text-sm text-[#f8e1f4]">
                      Notify when {alert.condition} ${alert.threshold.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRemovePriceAlert(alert.token)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-500"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#c0c0c0] text-center py-4">
              No price alerts set up yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
