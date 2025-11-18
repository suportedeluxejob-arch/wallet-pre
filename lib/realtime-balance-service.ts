import { Connection, PublicKey } from '@solana/web3.js'
import { NETWORK_ENDPOINTS, type NetworkType } from './wallet-utils'

// Real-time balance updates using WebSocket
export class RealtimeBalanceService {
  private connection: Connection
  private subscriptions: Map<string, number> = new Map()
  private callbacks: Map<string, (balance: number) => void> = new Map()

  constructor(network: NetworkType = 'mainnet') {
    this.connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
  }

  // Subscribe to balance changes
  subscribe(publicKey: string, callback: (balance: number) => void): () => void {
    console.log(`[v0] Subscribing to balance updates for ${publicKey}`)

    const pubKey = new PublicKey(publicKey)
    
    // Store callback
    this.callbacks.set(publicKey, callback)

    // Subscribe to account changes
    const subscriptionId = this.connection.onAccountChange(
      pubKey,
      (accountInfo) => {
        const balance = accountInfo.lamports / 1e9
        console.log(`[v0] Balance updated: ${balance} SOL`)
        callback(balance)
      },
      'confirmed'
    )

    this.subscriptions.set(publicKey, subscriptionId)

    // Return unsubscribe function
    return () => {
      const subId = this.subscriptions.get(publicKey)
      if (subId !== undefined) {
        this.connection.removeAccountChangeListener(subId)
        this.subscriptions.delete(publicKey)
        this.callbacks.delete(publicKey)
        console.log(`[v0] Unsubscribed from balance updates for ${publicKey}`)
      }
    }
  }

  // Get current balance
  async getBalance(publicKey: string): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey)
      const balance = await this.connection.getBalance(pubKey)
      return balance / 1e9
    } catch (error) {
      console.error('[v0] Error fetching balance:', error)
      return 0
    }
  }

  // Unsubscribe all
  unsubscribeAll() {
    this.subscriptions.forEach((subId, publicKey) => {
      this.connection.removeAccountChangeListener(subId)
      console.log(`[v0] Unsubscribed from ${publicKey}`)
    })
    this.subscriptions.clear()
    this.callbacks.clear()
  }

  // Update network
  updateNetwork(network: NetworkType) {
    this.unsubscribeAll()
    this.connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
  }
}
