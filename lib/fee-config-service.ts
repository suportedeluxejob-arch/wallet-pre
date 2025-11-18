// Advanced fee configuration and management service

import { NETWORK_PRIORITY_PRESETS, getPlatformFee } from './platform-fees'

export interface FeeStructure {
  id: string
  name: string
  enabled: boolean
  swapFee: number // percentage
  stakingFee: number // percentage
  nftListingFee: number // percentage
  withdrawalFee: number // SOL
  description: string
}

export interface NetworkPriority {
  mode: 'economy' | 'standard' | 'priority'
  computeUnitPrice: number
  customComputeUnitPrice?: number
}

export interface RpcConfiguration {
  endpoint: string
  name: string
  isCustom: boolean
  status: 'connected' | 'disconnected' | 'testing'
  priority: number
  requestsPerSecond: number
}

export interface PlatformConfig {
  networkPriority: NetworkPriority
  rpcConfig: RpcConfiguration
  autoCompound: boolean
  notificationsEnabled: boolean
}

class FeeConfigService {
  private storageKey = 'solary_fee_config'
  private rpcStorageKey = 'solary_rpc_config'

  private defaultNetworkPriority: NetworkPriority = {
    mode: 'standard',
    computeUnitPrice: 5000,
  }

  private defaultRpcConfig: RpcConfiguration = {
    endpoint: 'https://api.mainnet-beta.solana.com',
    name: 'Solana RPC (Public)',
    isCustom: false,
    status: 'connected',
    priority: 0,
    requestsPerSecond: 40,
  }

  private config: PlatformConfig = {
    networkPriority: this.defaultNetworkPriority,
    rpcConfig: this.defaultRpcConfig,
    autoCompound: false,
    notificationsEnabled: true,
  }

  constructor() {
    this.loadConfig()
  }

  private loadConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.config = { ...this.config, ...parsed }
      }
    } catch (error) {
      console.error('Error loading fee config:', error)
    }
  }

  private saveConfig() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.config))
  }

  getPlatformFees() {
    return {
      swap: getPlatformFee('SWAP'),
      staking: getPlatformFee('STAKING'),
      nftListing: getPlatformFee('NFT_LISTING'),
      withdrawal: getPlatformFee('WITHDRAWAL'),
    }
  }

  getNetworkPriority(): NetworkPriority {
    return { ...this.config.networkPriority }
  }

  setNetworkPriority(mode: 'economy' | 'standard' | 'priority', customPrice?: number) {
    const preset = NETWORK_PRIORITY_PRESETS[mode]
    this.config.networkPriority = {
      mode,
      computeUnitPrice: customPrice || preset.computeUnitPrice,
      customComputeUnitPrice: customPrice,
    }
    this.saveConfig()
  }

  getRpcConfig(): RpcConfiguration {
    return { ...this.config.rpcConfig }
  }

  setCustomRpc(endpoint: string, name: string) {
    this.config.rpcConfig = {
      endpoint,
      name,
      isCustom: true,
      status: 'testing',
      priority: 10,
      requestsPerSecond: 100,
    }
    this.saveConfig()
  }

  resetToDefaultRpc() {
    this.config.rpcConfig = { ...this.defaultRpcConfig }
    this.saveConfig()
  }

  getFullConfig(): PlatformConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  updateFullConfig(newConfig: Partial<PlatformConfig>) {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
  }

  getNetworkPriorityPresets() {
    return NETWORK_PRIORITY_PRESETS
  }

  async validateRpcEndpoint(endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot',
        }),
      })
      return response.ok
    } catch (error) {
      console.error('RPC validation failed:', error)
      return false
    }
  }

  setAutoCompound(enabled: boolean) {
    this.config.autoCompound = enabled
    this.saveConfig()
  }

  getAutoCompound(): boolean {
    return this.config.autoCompound
  }
}

export const feeConfigService = new FeeConfigService()
