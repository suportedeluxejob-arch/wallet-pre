'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, PieChart, BarChart3, Award, AlertCircle, Download, RefreshCw } from 'lucide-react'
import { 
  portfolioAnalytics, 
  PortfolioSnapshot, 
  AssetAllocation,
  PortfolioHistory 
} from '@/lib/portfolio-analytics-service'
import { useLanguage } from '@/contexts/language-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface PortfolioAnalyticsPanelProps {
  wallet: any
  balance: number
  tokens: any[]
  solPrice: number
}

export default function PortfolioAnalyticsPanel({ wallet, balance, tokens, solPrice }: PortfolioAnalyticsPanelProps) {
  const { t } = useLanguage()
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)
  const [loading, setLoading] = useState(false)

  // Create current snapshot
  const currentSnapshot = useMemo((): PortfolioSnapshot => {
    const tokenData = tokens.map(token => ({
      symbol: token.symbol || 'Unknown',
      amount: token.amount || 0,
      valueUsd: (token.amount || 0) * (token.price || 0),
      priceUsd: token.price || 0,
    }))

    const totalValue = tokenData.reduce((sum, t) => sum + t.valueUsd, 0) + (balance * solPrice)

    return {
      id: 'current',
      timestamp: new Date().toISOString(),
      totalValue,
      totalValueSol: balance,
      tokens: tokenData,
      solBalance: balance,
      percentageChange24h: 0, // Would need historical data
    }
  }, [balance, tokens, solPrice])

  // Get analytics data
  const summary = useMemo(() => 
    portfolioAnalytics.getPortfolioSummary(currentSnapshot),
    [currentSnapshot]
  )

  const allocation = useMemo(() => 
    portfolioAnalytics.calculateAssetAllocation(currentSnapshot),
    [currentSnapshot]
  )

  const diversificationScore = useMemo(() => 
    portfolioAnalytics.calculateDiversificationScore(allocation),
    [allocation]
  )

  const insights = useMemo(() => 
    portfolioAnalytics.getInsights(currentSnapshot),
    [currentSnapshot]
  )

  const history = useMemo(() => 
    portfolioAnalytics.getPortfolioHistory(timeRange),
    [timeRange]
  )

  // Save snapshot periodically
  useEffect(() => {
    const saveSnapshot = () => {
      portfolioAnalytics.saveSnapshot({
        totalValue: currentSnapshot.totalValue,
        totalValueSol: currentSnapshot.totalValueSol,
        tokens: currentSnapshot.tokens,
        solBalance: currentSnapshot.solBalance,
        percentageChange24h: 0,
      })
    }

    // Save immediately
    saveSnapshot()

    // Save every 1 hour
    const interval = setInterval(saveSnapshot, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentSnapshot])

  const handleExport = () => {
    const data = portfolioAnalytics.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio-analytics-${Date.now()}.json`
    a.click()
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Total Value</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#f8e1f4]">
              {formatCurrency(currentSnapshot.totalValue)}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              {summary.change24h >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${summary.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPercentage(summary.change24h)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">30D Change</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${summary.change30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(summary.change30d)}
            </p>
            <p className="text-sm text-[#c0c0c0] mt-1">
              {formatCurrency(summary.profitLoss.totalProfitLoss)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Diversification</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#f8e1f4]">
              {diversificationScore.toFixed(0)}/100
            </p>
            <p className="text-sm text-[#c0c0c0] mt-1">
              {diversificationScore > 70 ? 'Excellent' : diversificationScore > 40 ? 'Good' : 'Low'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-[#c0c0c0]">Total Assets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#f8e1f4]">{summary.totalAssets}</p>
            <p className="text-sm text-[#c0c0c0] mt-1">
              {summary.dominantAsset?.symbol || 'N/A'} ({summary.dominantAsset?.percentage.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-[#8b005d]/30 text-[#f8e1f4]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="border-[#8b005d]/30 text-[#f8e1f4]"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardHeader>
            <CardTitle className="text-[#f8e1f4] flex items-center space-x-2">
              <Award className="w-5 h-5 text-[#d4308e]" />
              <span>Portfolio Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, index) => (
              <Alert key={index} className="bg-blue-500/10 border-blue-500/30">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-400">{insight}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1a0a14]/50 border border-[#8b005d]/20">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#f8e1f4]">Portfolio Value</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={timeRange === 7 ? 'default' : 'outline'}
                    onClick={() => setTimeRange(7)}
                    className={timeRange === 7 ? 'bg-[#8b005d]' : 'border-[#8b005d]/30 text-[#f8e1f4]'}
                  >
                    7D
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 30 ? 'default' : 'outline'}
                    onClick={() => setTimeRange(30)}
                    className={timeRange === 30 ? 'bg-[#8b005d]' : 'border-[#8b005d]/30 text-[#f8e1f4]'}
                  >
                    30D
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 90 ? 'default' : 'outline'}
                    onClick={() => setTimeRange(90)}
                    className={timeRange === 90 ? 'bg-[#8b005d]' : 'border-[#8b005d]/30 text-[#f8e1f4]'}
                  >
                    90D
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b005d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b005d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a2a34" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#c0c0c0"
                      tick={{ fill: '#c0c0c0' }}
                    />
                    <YAxis 
                      stroke="#c0c0c0"
                      tick={{ fill: '#c0c0c0' }}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a0a14', 
                        border: '1px solid #8b005d',
                        borderRadius: '8px',
                        color: '#f8e1f4'
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#d4308e" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-[#c0c0c0]">Not enough data yet. Check back later.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardHeader>
                <CardTitle className="text-[#f8e1f4] text-lg">Best Performer</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.profitLoss.bestPerformer ? (
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {summary.profitLoss.bestPerformer.symbol}
                    </p>
                    <p className="text-sm text-[#c0c0c0] mt-1">
                      {formatPercentage(summary.profitLoss.bestPerformer.change)}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#c0c0c0]">No data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardHeader>
                <CardTitle className="text-[#f8e1f4] text-lg">Worst Performer</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.profitLoss.worstPerformer ? (
                  <div>
                    <p className="text-2xl font-bold text-red-500">
                      {summary.profitLoss.worstPerformer.symbol}
                    </p>
                    <p className="text-sm text-[#c0c0c0] mt-1">
                      {formatPercentage(summary.profitLoss.worstPerformer.change)}
                    </p>
                  </div>
                ) : (
                  <p className="text-[#c0c0c0]">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-6">
          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {allocation.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={allocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ symbol, percentage }) => `${symbol} ${percentage.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {allocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a0a14', 
                          border: '1px solid #8b005d',
                          borderRadius: '8px',
                          color: '#f8e1f4'
                        }}
                        formatter={(value: number, name, props: any) => [
                          `${value.toFixed(2)}% (${formatCurrency(props.payload.valueUsd)})`,
                          props.payload.symbol
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {allocation.map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#0b0b0b]/50 border border-[#3a2a34]">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: asset.color }}
                          />
                          <div>
                            <p className="text-[#f8e1f4] font-semibold">{asset.symbol}</p>
                            <p className="text-[#c0c0c0] text-xs">{formatCurrency(asset.valueUsd)}</p>
                          </div>
                        </div>
                        <Badge className="bg-[#8b005d]/20 text-[#f8e1f4]">
                          {asset.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-[#c0c0c0]">No assets in portfolio</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardHeader>
              <CardTitle className="text-[#f8e1f4]">Holdings Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentSnapshot.tokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-[#0b0b0b]/50 border border-[#3a2a34]">
                    <div>
                      <p className="text-[#f8e1f4] font-semibold">{token.symbol}</p>
                      <p className="text-[#c0c0c0] text-sm">{token.amount.toFixed(4)} tokens</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#f8e1f4] font-semibold">{formatCurrency(token.valueUsd)}</p>
                      <p className="text-[#c0c0c0] text-sm">${token.priceUsd.toFixed(4)}/token</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
