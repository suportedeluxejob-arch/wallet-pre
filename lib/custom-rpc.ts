// Custom RPC endpoint management

import { NetworkType } from './wallet-utils'

export interface CustomRPCEndpoint {
  id: string
  name: string
  network: NetworkType
  url: string
  isDefault: boolean
  createdAt: number
}

class CustomRPCManager {
  private storageKey = 'solary_custom_rpc'

  // Get all custom endpoints
  getEndpoints(): CustomRPCEndpoint[] {
    const data = localStorage.getItem(this.storageKey)
    if (!data) return []
    
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  // Add custom endpoint
  addEndpoint(endpoint: Omit<CustomRPCEndpoint, 'id' | 'createdAt'>): CustomRPCEndpoint {
    const endpoints = this.getEndpoints()
    
    // Validate URL
    try {
      new URL(endpoint.url)
    } catch {
      throw new Error('Invalid RPC URL')
    }
    
    const newEndpoint: CustomRPCEndpoint = {
      ...endpoint,
      id: this.generateId(),
      createdAt: Date.now(),
    }
    
    endpoints.push(newEndpoint)
    localStorage.setItem(this.storageKey, JSON.stringify(endpoints))
    
    return newEndpoint
  }

  // Update endpoint
  updateEndpoint(id: string, updates: Partial<CustomRPCEndpoint>): CustomRPCEndpoint | null {
    const endpoints = this.getEndpoints()
    const index = endpoints.findIndex(e => e.id === id)
    
    if (index === -1) return null
    
    endpoints[index] = { ...endpoints[index], ...updates }
    localStorage.setItem(this.storageKey, JSON.stringify(endpoints))
    
    return endpoints[index]
  }

  // Delete endpoint
  deleteEndpoint(id: string): boolean {
    const endpoints = this.getEndpoints()
    const filtered = endpoints.filter(e => e.id !== id)
    
    if (filtered.length === endpoints.length) return false
    
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    return true
  }

  // Get default endpoint for network
  getDefaultEndpoint(network: NetworkType): CustomRPCEndpoint | null {
    const endpoints = this.getEndpoints()
    return endpoints.find(e => e.network === network && e.isDefault) || null
  }

  // Set as default
  setAsDefault(id: string): boolean {
    const endpoints = this.getEndpoints()
    const endpoint = endpoints.find(e => e.id === id)
    
    if (!endpoint) return false
    
    // Remove default from others in same network
    endpoints.forEach(e => {
      if (e.network === endpoint.network) {
        e.isDefault = false
      }
    })
    
    endpoint.isDefault = true
    localStorage.setItem(this.storageKey, JSON.stringify(endpoints))
    
    return true
  }

  // Test endpoint connectivity
  async testEndpoint(url: string): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
          params: [],
        }),
      })
      
      if (!response.ok) {
        return { success: false, error: 'Endpoint returned error status' }
      }
      
      const latency = Date.now() - startTime
      return { success: true, latency }
    } catch (error: any) {
      return { success: false, error: error.message || 'Connection failed' }
    }
  }

  private generateId(): string {
    return `rpc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const customRPC = new CustomRPCManager()
