// Real-time reward monitoring and notification service

import { notificationService } from './notification-service'
import { swapHistoryService } from './swap-history-service'

export interface RewardMonitorConfig {
  enabled: boolean
  checkInterval: number // milliseconds
  notifyThreshold: number // Notify when rewards exceed this amount (SOL)
  autoCompound: boolean
}

export interface RewardData {
  stakedAmount: number
  accumulatedRewards: number
  lastCheckTime: number
  lastRewardTime?: number
  estimatedNextReward: number
}

class StakingRewardsMonitor {
  private monitors: Map<string, RewardData> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private storageKey = 'solary_reward_monitor'
  private config: RewardMonitorConfig = {
    enabled: true,
    checkInterval: 5 * 60 * 1000, // Check every 5 minutes
    notifyThreshold: 0.01, // Notify when 0.01 SOL earned
    autoCompound: false,
  }

  constructor() {
    this.loadMonitors()
  }

  private loadMonitors() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.monitors = new Map(Object.entries(data))
      }
    } catch (error) {
      console.error('Error loading reward monitors:', error)
    }
  }

  private saveMonitors() {
    const data = Object.fromEntries(this.monitors)
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  updateConfig(config: Partial<RewardMonitorConfig>) {
    this.config = { ...this.config, ...config }
  }

  startMonitoring(
    stakeAccountId: string,
    stakedAmount: number,
    apy: number
  ) {
    if (this.intervals.has(stakeAccountId)) {
      this.stopMonitoring(stakeAccountId)
    }

    const rewardData: RewardData = {
      stakedAmount,
      accumulatedRewards: 0,
      lastCheckTime: Date.now(),
      estimatedNextReward: this.estimateNextReward(stakedAmount, apy),
    }

    this.monitors.set(stakeAccountId, rewardData)
    this.saveMonitors()

    // Set up periodic check
    const interval = setInterval(() => {
      this.checkRewards(stakeAccountId, apy)
    }, this.config.checkInterval)

    this.intervals.set(stakeAccountId, interval)
    console.log(`[v0] Started monitoring rewards for ${stakeAccountId}`)
  }

  stopMonitoring(stakeAccountId: string) {
    const interval = this.intervals.get(stakeAccountId)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(stakeAccountId)
    }
    console.log(`[v0] Stopped monitoring rewards for ${stakeAccountId}`)
  }

  private checkRewards(stakeAccountId: string, apy: number) {
    const monitor = this.monitors.get(stakeAccountId)
    if (!monitor) return

    const now = Date.now()
    const timeSinceLastCheck = (now - monitor.lastCheckTime) / (1000 * 60 * 60 * 24) // days
    const dailyReward = monitor.stakedAmount * (apy / 100 / 365)
    const newRewards = dailyReward * timeSinceLastCheck

    monitor.accumulatedRewards += newRewards
    monitor.lastCheckTime = now

    // Notify if rewards exceed threshold
    if (newRewards >= this.config.notifyThreshold) {
      notificationService.notifyStakeReward(newRewards)
      console.log(`[v0] Reward milestone: +${newRewards.toFixed(6)} SOL`)
    }

    this.saveMonitors()
  }

  private estimateNextReward(stakedAmount: number, apy: number): number {
    const dailyReward = stakedAmount * (apy / 100 / 365)
    return dailyReward
  }

  getMonitoredStakes(): Map<string, RewardData> {
    return new Map(this.monitors)
  }

  getMonitorData(stakeAccountId: string): RewardData | undefined {
    return this.monitors.get(stakeAccountId)
  }

  // Stop all monitoring
  stopAllMonitoring() {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()
  }

  // Clear all monitoring data
  clearAllData() {
    this.stopAllMonitoring()
    this.monitors.clear()
    localStorage.removeItem(this.storageKey)
  }
}

export const stakingRewardsMonitor = new StakingRewardsMonitor()
