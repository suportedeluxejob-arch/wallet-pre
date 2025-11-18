import { Transaction, VersionedTransaction, PublicKey, SendOptions } from '@solana/web3.js'
import bs58 from 'bs58'

export interface SolanaProvider {
  isPhantom: boolean
  isSolary: boolean
  publicKey: PublicKey | null
  isConnected: boolean
  autoApprove: boolean
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction,
    options?: SendOptions
  ) => Promise<{ signature: string; publicKey: PublicKey }>
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
  signAllTransactions: (
    transactions: (Transaction | VersionedTransaction)[]
  ) => Promise<(Transaction | VersionedTransaction)[]>
  signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array; publicKey: PublicKey }>
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback: (...args: any[]) => void) => void
  request: (args: { method: string; params?: any }) => Promise<any>
}

export type DAppPermission = {
  origin: string
  name: string
  icon?: string
  permissions: string[]
  connectedAt: number
  lastUsed: number
  autoApprove: boolean
}

export type PendingRequest = {
  id: string
  origin: string
  dappName: string
  dappIcon?: string
  type: 'connect' | 'signTransaction' | 'signAllTransactions' | 'signMessage'
  data: any
  timestamp: number
  resolve: (value: any) => void
  reject: (reason?: any) => void
}

class DAppProviderService {
  private permissions: Map<string, DAppPermission> = new Map()
  private pendingRequests: PendingRequest[] = []
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()
  private currentWallet: { publicKey: PublicKey; signTransaction: (tx: any) => Promise<any> } | null = null
  private requestListeners: Set<(requests: PendingRequest[]) => void> = new Set()

  constructor() {
    this.loadPermissions()
  }

  private loadPermissions() {
    const stored = localStorage.getItem('solary_dapp_permissions')
    if (stored) {
      const perms = JSON.parse(stored) as DAppPermission[]
      perms.forEach((perm) => this.permissions.set(perm.origin, perm))
    }
  }

  private savePermissions() {
    const perms = Array.from(this.permissions.values())
    localStorage.setItem('solary_dapp_permissions', JSON.stringify(perms))
  }

  setWallet(wallet: { publicKey: PublicKey; signTransaction: (tx: any) => Promise<any> } | null) {
    this.currentWallet = wallet
    
    if (wallet) {
      this.emit('connect', wallet.publicKey)
    } else {
      this.emit('disconnect')
    }
  }

  hasPermission(origin: string): boolean {
    return this.permissions.has(origin)
  }

  getPermission(origin: string): DAppPermission | undefined {
    return this.permissions.get(origin)
  }

  getAllPermissions(): DAppPermission[] {
    return Array.from(this.permissions.values())
  }

  grantPermission(permission: Omit<DAppPermission, 'connectedAt' | 'lastUsed'>) {
    const perm: DAppPermission = {
      ...permission,
      connectedAt: Date.now(),
      lastUsed: Date.now(),
    }
    this.permissions.set(permission.origin, perm)
    this.savePermissions()
  }

  revokePermission(origin: string) {
    this.permissions.delete(origin)
    this.savePermissions()
    this.emit('disconnect')
  }

  updateLastUsed(origin: string) {
    const perm = this.permissions.get(origin)
    if (perm) {
      perm.lastUsed = Date.now()
      this.savePermissions()
    }
  }

  subscribeToPendingRequests(listener: (requests: PendingRequest[]) => void) {
    this.requestListeners.add(listener)
    listener(this.pendingRequests)
    return () => this.requestListeners.delete(listener)
  }

  private notifyRequestListeners() {
    this.requestListeners.forEach((listener) => listener([...this.pendingRequests]))
  }

  async requestConnect(origin: string, dappName: string, dappIcon?: string): Promise<PublicKey> {
    // Check if already has permission
    const existingPerm = this.permissions.get(origin)
    if (existingPerm && this.currentWallet) {
      this.updateLastUsed(origin)
      return this.currentWallet.publicKey
    }

    // Create pending request
    return new Promise((resolve, reject) => {
      const request: PendingRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        origin,
        dappName,
        dappIcon,
        type: 'connect',
        data: {},
        timestamp: Date.now(),
        resolve: (publicKey: PublicKey) => {
          this.removePendingRequest(request.id)
          resolve(publicKey)
        },
        reject: (reason?: any) => {
          this.removePendingRequest(request.id)
          reject(reason)
        },
      }

      this.pendingRequests.push(request)
      this.notifyRequestListeners()
    })
  }

  async requestSignTransaction(
    origin: string,
    dappName: string,
    transaction: Transaction | VersionedTransaction,
    dappIcon?: string
  ): Promise<Transaction | VersionedTransaction> {
    if (!this.hasPermission(origin)) {
      throw new Error('DApp not connected')
    }

    const perm = this.permissions.get(origin)!
    
    // Auto-approve if enabled
    if (perm.autoApprove && this.currentWallet) {
      this.updateLastUsed(origin)
      return await this.currentWallet.signTransaction(transaction)
    }

    return new Promise((resolve, reject) => {
      const request: PendingRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        origin,
        dappName,
        dappIcon,
        type: 'signTransaction',
        data: { transaction },
        timestamp: Date.now(),
        resolve,
        reject,
      }

      this.pendingRequests.push(request)
      this.notifyRequestListeners()
    })
  }

  async requestSignAllTransactions(
    origin: string,
    dappName: string,
    transactions: (Transaction | VersionedTransaction)[],
    dappIcon?: string
  ): Promise<(Transaction | VersionedTransaction)[]> {
    if (!this.hasPermission(origin)) {
      throw new Error('DApp not connected')
    }

    return new Promise((resolve, reject) => {
      const request: PendingRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        origin,
        dappName,
        dappIcon,
        type: 'signAllTransactions',
        data: { transactions },
        timestamp: Date.now(),
        resolve,
        reject,
      }

      this.pendingRequests.push(request)
      this.notifyRequestListeners()
    })
  }

  async requestSignMessage(
    origin: string,
    dappName: string,
    message: Uint8Array,
    display?: string,
    dappIcon?: string
  ): Promise<{ signature: Uint8Array; publicKey: PublicKey }> {
    if (!this.hasPermission(origin)) {
      throw new Error('DApp not connected')
    }

    return new Promise((resolve, reject) => {
      const request: PendingRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        origin,
        dappName,
        dappIcon,
        type: 'signMessage',
        data: { message, display },
        timestamp: Date.now(),
        resolve,
        reject,
      }

      this.pendingRequests.push(request)
      this.notifyRequestListeners()
    })
  }

  getPendingRequests(): PendingRequest[] {
    return [...this.pendingRequests]
  }

  removePendingRequest(id: string) {
    this.pendingRequests = this.pendingRequests.filter((r) => r.id !== id)
    this.notifyRequestListeners()
  }

  approveRequest(id: string, result: any) {
    const request = this.pendingRequests.find((r) => r.id === id)
    if (request) {
      request.resolve(result)
    }
  }

  rejectRequest(id: string, reason?: string) {
    const request = this.pendingRequests.find((r) => r.id === id)
    if (request) {
      request.reject(new Error(reason || 'User rejected request'))
    }
  }

  createProvider(origin: string, dappName: string, dappIcon?: string): SolanaProvider {
    const provider: SolanaProvider = {
      isPhantom: false,
      isSolary: true,
      publicKey: this.currentWallet?.publicKey || null,
      isConnected: this.hasPermission(origin),
      autoApprove: this.getPermission(origin)?.autoApprove || false,

      connect: async (opts?: { onlyIfTrusted?: boolean }) => {
        if (opts?.onlyIfTrusted && !this.hasPermission(origin)) {
          throw new Error('Not trusted')
        }

        const publicKey = await this.requestConnect(origin, dappName, dappIcon)
        provider.publicKey = publicKey
        provider.isConnected = true
        return { publicKey }
      },

      disconnect: async () => {
        this.revokePermission(origin)
        provider.publicKey = null
        provider.isConnected = false
      },

      signAndSendTransaction: async (transaction, options) => {
        const signedTx = await this.requestSignTransaction(origin, dappName, transaction, dappIcon)
        // In a real implementation, this would send the transaction
        // For now, we'll simulate it
        const signature = bs58.encode(Buffer.from(Array(64).fill(0).map(() => Math.floor(Math.random() * 256))))
        return { signature, publicKey: provider.publicKey! }
      },

      signTransaction: async (transaction) => {
        return await this.requestSignTransaction(origin, dappName, transaction, dappIcon)
      },

      signAllTransactions: async (transactions) => {
        return await this.requestSignAllTransactions(origin, dappName, transactions, dappIcon)
      },

      signMessage: async (message, display?) => {
        return await this.requestSignMessage(origin, dappName, message, display, dappIcon)
      },

      on: (event, callback) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)!.add(callback)
      },

      off: (event, callback) => {
        this.eventListeners.get(event)?.delete(callback)
      },

      request: async (args) => {
        switch (args.method) {
          case 'connect':
            return await provider.connect()
          case 'disconnect':
            return await provider.disconnect()
          default:
            throw new Error(`Method ${args.method} not supported`)
        }
      },
    }

    return provider
  }

  private emit(event: string, ...args: any[]) {
    this.eventListeners.get(event)?.forEach((callback) => callback(...args))
  }
}

export const dappProviderService = new DAppProviderService()
