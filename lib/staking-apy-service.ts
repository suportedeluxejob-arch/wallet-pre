// Real-time APY and rewards calculation service for Solana staking

import { Connection, PublicKey } from '@solana/web3.js'

export interface APYData {
  currentAPY: number
  historicalAPY: number[]
  averageAPY: number
  minAPY: number
  maxAPY: number
  lastUpdated: number
  confidence: number // 0-1, how confident is this data
}

export interface RewardEstimate {
  dailyReward: number
  weeklyReward: number
  monthlyReward: number
  yearlyReward: number
  compoundedYearlyReward: number
}

class StakingAPYService {
  private connection: Connection
  private apyCache: Map<string, APYData> = new Map()
  private apyCacheExpiry = 60 * 60 * 1000 // 1 hour
  private listeners: Set<(apy: APYData) => void> = new Set()

  constructor(endpoint: string) {
    this.connection = new Connection(endpoint, 'confirmed')
  }

  subscribe(listener: (apy: APYData) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(apy: APYData) {
    this.listeners.forEach((listener) => listener(apy))
  }

  async getRealAPY(): Promise<APYData> {
    const cacheKey = 'solana_apy'
    const cached = this.apyCache.get(cacheKey)

    // Return cached if not expired
    if (cached && Date.now() - cached.lastUpdated < this.apyCacheExpiry) {
      return cached
    }

    try {
      const apy = await this.fetchOnChainAPY()
      this.apyCache.set(cacheKey, apy)
      this.notifyListeners(apy)
      return apy
    } catch (error) {
      console.error('Error fetching real APY, using fallback:', error)
      return this.getFallbackAPY()
    }
  }

  private async fetchOnChainAPY(): Promise<APYData> {
    try {
      // Fetch inflation data from Solana RPC
      const inflationRate = await this.connection.getInflationRate()
      
      // Get validator APY estimate (simplified)
      // Real APY = Network Inflation Rate - Commission
      // Average validator commission is ~8-10%
      const networkAPY = (inflationRate?.total || 0.08) * 100
      const averageCommission = 9 // 9% average
      const estimatedAPY = networkAPY - averageCommission
      
      // Fetch vote accounts for validator diversity data
      const voteAccounts = await this.connection.getVoteAccounts()
      const commissions = voteAccounts.current.map(v => v.commission)
      const avgCommission = commissions.reduce((a, b) => a + b, 0) / commissions.length
      
      const realAPY = Math.max(0, (networkAPY - avgCommission))

      return {
        currentAPY: Math.max(3, Math.min(12, realAPY)), // Clamp between 3-12%
        historicalAPY: [realAPY, 6.8, 6.5, 7.2, 7.5], // Mock historical data
        averageAPY: 7.0,
        minAPY: Math.max(3, realAPY - 1),
        maxAPY: Math.min(12, realAPY + 1),
        lastUpdated: Date.now(),
        confidence: 0.9, // 90% confident in on-chain data
      }
    } catch (error) {
      console.error('Error in fetchOnChainAPY:', error)
      throw error
    }
  }

  private getFallbackAPY(): APYData {
    return {
      currentAPY: 7.2,
      historicalAPY: [7.2, 6.8, 6.5, 7.2, 7.5],
      averageAPY: 7.0,
      minAPY: 6.2,
      maxAPY: 8.2,
      lastUpdated: Date.now(),
      confidence: 0.5, // Low confidence in fallback
    }
  }

  calculateRewardEstimates(
    stakedAmount: number,
    apy: APYData
  ): RewardEstimate {
    const yearlyReward = stakedAmount * (apy.currentAPY / 100)
    const dailyReward = yearlyReward / 365
    const weeklyReward = dailyReward * 7
    const monthlyReward = dailyReward * 30

    // Compound rewards annually
    const compoundedYearlyReward = stakedAmount * (Math.pow(1 + apy.currentAPY / 100, 1) - 1)

    return {
      dailyReward,
      weeklyReward,
      monthlyReward,
      yearlyReward,
      compoundedYearlyReward,
    }
  }

  projectBalance(
    initialStake: number,
    years: number,
    apy: APYData
  ): number[] {
    const projections: number[] = []
    let balance = initialStake

    for (let i = 0; i <= years * 12; i++) {
      projections.push(balance)
      balance = balance * Math.pow(1 + apy.currentAPY / 100, 1 / 12)
    }

    return projections
  }

  async getValidatorAPYComparison(): Promise<Array<{ name: string; apy: number; commission: number }>> {
    try {
      const voteAccounts = await this.connection.getVoteAccounts()
      
      const validatorData = voteAccounts.current
        .slice(0, 10) // Top 10 validators
        .map((account) => ({
          name: account.nodePubkey.slice(0, 8),
          commission: account.commission,
          apy: 7.2 - (account.commission / 100), // Rough estimate
        }))

      return validatorData
    } catch (error) {
      console.error('Error fetching validator APY comparison:', error)
      return []
    }
  }

  estimateRewardsByEpoch(
    stakedAmount: number,
    apy: APYData,
    epochDays: number = 2.96 // Average Solana epoch length
  ): number {
    const rewardsPerYear = stakedAmount * (apy.currentAPY / 100)
    const rewardsPerDay = rewardsPerYear / 365
    const rewardsPerEpoch = rewardsPerDay * epochDays
    return rewardsPerEpoch
  }
}

export const createStakingAPYService = (endpoint: string) => new StakingAPYService(endpoint)
