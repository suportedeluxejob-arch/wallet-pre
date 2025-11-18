// Portfolio analytics and tracking service
export interface PortfolioSnapshot {
  id: string
  timestamp: string
  totalValue: number // in USD
  totalValueSol: number // in SOL
  tokens: {
    symbol: string
    amount: number
    valueUsd: number
    priceUsd: number
  }[]
  solBalance: number
  percentageChange24h: number
}

export interface AssetAllocation {
  symbol: string
  percentage: number
  valueUsd: number
  color: string
}

export interface ProfitLossData {
  totalProfitLoss: number
  percentageChange: number
  bestPerformer: {
    symbol: string
    change: number
  } | null
  worstPerformer: {
    symbol: string
    change: number
  } | null
  realizedGains: number
  unrealizedGains: number
}

export interface PortfolioHistory {
  date: string
  value: number
  change: number
}

class PortfolioAnalyticsService {
  private snapshotsKey = 'solary_portfolio_snapshots'
  private transactionsKey = 'solary_portfolio_transactions'

  // Save portfolio snapshot
  saveSnapshot(snapshot: Omit<PortfolioSnapshot, 'id' | 'timestamp'>): void {
    const snapshots = this.getSnapshots()
    
    const newSnapshot: PortfolioSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...snapshot,
    }

    snapshots.unshift(newSnapshot)

    // Keep only last 365 snapshots (1 year)
    if (snapshots.length > 365) {
      snapshots.splice(365)
    }

    localStorage.setItem(this.snapshotsKey, JSON.stringify(snapshots))
  }

  // Get all snapshots
  getSnapshots(): PortfolioSnapshot[] {
    const snapshots = localStorage.getItem(this.snapshotsKey)
    return snapshots ? JSON.parse(snapshots) : []
  }

  // Get snapshots for a specific time range
  getSnapshotsInRange(days: number): PortfolioSnapshot[] {
    const snapshots = this.getSnapshots()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return snapshots.filter(s => new Date(s.timestamp) >= cutoffDate)
  }

  // Calculate portfolio history for charts
  getPortfolioHistory(days: number = 30): PortfolioHistory[] {
    const snapshots = this.getSnapshotsInRange(days)
    
    if (snapshots.length === 0) return []

    // Group by day and calculate average
    const dailyData = new Map<string, number[]>()

    snapshots.forEach(snapshot => {
      const date = new Date(snapshot.timestamp).toISOString().split('T')[0]
      if (!dailyData.has(date)) {
        dailyData.set(date, [])
      }
      dailyData.get(date)!.push(snapshot.totalValue)
    })

    const history: PortfolioHistory[] = []
    let previousValue = 0

    Array.from(dailyData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, values]) => {
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
        const change = previousValue > 0 ? ((avgValue - previousValue) / previousValue) * 100 : 0
        
        history.push({
          date,
          value: avgValue,
          change,
        })

        previousValue = avgValue
      })

    return history
  }

  // Calculate asset allocation
  calculateAssetAllocation(snapshot: PortfolioSnapshot): AssetAllocation[] {
    const total = snapshot.totalValue
    
    if (total === 0) return []

    const colors = [
      '#8b005d',
      '#d4308e',
      '#ff6b9d',
      '#ffa6c1',
      '#ffcfe0',
      '#6a4c93',
      '#8b80f9',
      '#a79aff',
    ]

    const allocations: AssetAllocation[] = []

    // Add SOL
    const solValue = snapshot.solBalance * (snapshot.tokens.find(t => t.symbol === 'SOL')?.priceUsd || 0)
    if (solValue > 0) {
      allocations.push({
        symbol: 'SOL',
        percentage: (solValue / total) * 100,
        valueUsd: solValue,
        color: colors[0],
      })
    }

    // Add other tokens
    snapshot.tokens.forEach((token, index) => {
      if (token.symbol !== 'SOL' && token.valueUsd > 0) {
        allocations.push({
          symbol: token.symbol,
          percentage: (token.valueUsd / total) * 100,
          valueUsd: token.valueUsd,
          color: colors[(index + 1) % colors.length],
        })
      }
    })

    return allocations.sort((a, b) => b.percentage - a.percentage)
  }

  // Calculate profit/loss
  calculateProfitLoss(currentSnapshot: PortfolioSnapshot, daysAgo: number = 30): ProfitLossData {
    const history = this.getSnapshotsInRange(daysAgo)
    
    if (history.length === 0) {
      return {
        totalProfitLoss: 0,
        percentageChange: 0,
        bestPerformer: null,
        worstPerformer: null,
        realizedGains: 0,
        unrealizedGains: 0,
      }
    }

    const oldestSnapshot = history[history.length - 1]
    const currentValue = currentSnapshot.totalValue
    const oldValue = oldestSnapshot.totalValue

    const totalProfitLoss = currentValue - oldValue
    const percentageChange = oldValue > 0 ? ((currentValue - oldValue) / oldValue) * 100 : 0

    // Find best and worst performers
    const tokenPerformance = new Map<string, number>()

    currentSnapshot.tokens.forEach(currentToken => {
      const oldToken = oldestSnapshot.tokens.find(t => t.symbol === currentToken.symbol)
      if (oldToken && oldToken.priceUsd > 0) {
        const change = ((currentToken.priceUsd - oldToken.priceUsd) / oldToken.priceUsd) * 100
        tokenPerformance.set(currentToken.symbol, change)
      }
    })

    let bestPerformer: { symbol: string; change: number } | null = null
    let worstPerformer: { symbol: string; change: number } | null = null

    tokenPerformance.forEach((change, symbol) => {
      if (!bestPerformer || change > bestPerformer.change) {
        bestPerformer = { symbol, change }
      }
      if (!worstPerformer || change < worstPerformer.change) {
        worstPerformer = { symbol, change }
      }
    })

    return {
      totalProfitLoss,
      percentageChange,
      bestPerformer,
      worstPerformer,
      realizedGains: 0, // Would need transaction history
      unrealizedGains: totalProfitLoss,
    }
  }

  // Get portfolio summary
  getPortfolioSummary(currentSnapshot: PortfolioSnapshot) {
    const history30d = this.getPortfolioHistory(30)
    const history7d = this.getPortfolioHistory(7)
    const profitLoss30d = this.calculateProfitLoss(currentSnapshot, 30)
    const profitLoss7d = this.calculateProfitLoss(currentSnapshot, 7)
    const allocation = this.calculateAssetAllocation(currentSnapshot)

    return {
      currentValue: currentSnapshot.totalValue,
      change24h: currentSnapshot.percentageChange24h,
      change7d: profitLoss7d.percentageChange,
      change30d: profitLoss30d.percentageChange,
      history30d,
      history7d,
      profitLoss: profitLoss30d,
      allocation,
      totalAssets: currentSnapshot.tokens.length,
      dominantAsset: allocation[0] || null,
    }
  }

  // Calculate diversification score (0-100)
  calculateDiversificationScore(allocation: AssetAllocation[]): number {
    if (allocation.length === 0) return 0
    if (allocation.length === 1) return 20 // Low diversification

    // Calculate Herfindahl index (concentration measure)
    const herfindahl = allocation.reduce((sum, asset) => {
      return sum + Math.pow(asset.percentage / 100, 2)
    }, 0)

    // Convert to diversification score (inverse of concentration)
    // 1 = fully concentrated, 0 = perfectly diversified
    const diversificationScore = (1 - herfindahl) * 100

    // Normalize to 0-100 scale with reasonable bounds
    return Math.min(100, Math.max(0, diversificationScore * 1.5))
  }

  // Get portfolio insights
  getInsights(currentSnapshot: PortfolioSnapshot): string[] {
    const insights: string[] = []
    const allocation = this.calculateAssetAllocation(currentSnapshot)
    const diversification = this.calculateDiversificationScore(allocation)
    const profitLoss = this.calculateProfitLoss(currentSnapshot, 30)

    // Diversification insights
    if (diversification < 30) {
      insights.push('Your portfolio is heavily concentrated. Consider diversifying across more assets.')
    } else if (diversification > 70) {
      insights.push('Your portfolio is well diversified across multiple assets.')
    }

    // Performance insights
    if (profitLoss.percentageChange > 10) {
      insights.push('Great performance! Your portfolio is up significantly this month.')
    } else if (profitLoss.percentageChange < -10) {
      insights.push('Your portfolio has declined this month. Consider reviewing your holdings.')
    }

    // Dominant asset
    if (allocation[0] && allocation[0].percentage > 50) {
      insights.push(`${allocation[0].symbol} represents over 50% of your portfolio. High concentration risk.`)
    }

    // Best performer
    if (profitLoss.bestPerformer && profitLoss.bestPerformer.change > 20) {
      insights.push(`${profitLoss.bestPerformer.symbol} is your best performer with +${profitLoss.bestPerformer.change.toFixed(1)}%`)
    }

    return insights
  }

  // Clear all analytics data
  clearAllData(): void {
    localStorage.removeItem(this.snapshotsKey)
    localStorage.removeItem(this.transactionsKey)
  }

  // Export analytics data
  exportData(): string {
    return JSON.stringify({
      snapshots: this.getSnapshots(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2)
  }
}

export const portfolioAnalytics = new PortfolioAnalyticsService()
