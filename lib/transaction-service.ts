// Transaction service for handling, storing, and retrieving transaction history

import { saveTransaction, getTransactionHistoryFromFirebase } from './firebase-config'

export interface TransactionRecord {
  id: string
  walletAddress: string
  signature: string
  type: 'send' | 'receive' | 'swap'
  amount: number
  token: string
  tokenSymbol?: string
  recipient?: string
  sender?: string
  fee: number
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  blockNumber?: number
  explorerUrl?: string
  notes?: string
}

class TransactionService {
  private localHistory: Map<string, TransactionRecord[]> = new Map()
  private syncTimeout: NodeJS.Timeout | null = null

  // Record a new transaction
  async recordTransaction(
    walletAddress: string,
    transaction: Omit<TransactionRecord, 'id' | 'timestamp'>
  ): Promise<TransactionRecord> {
    const record: TransactionRecord = {
      ...transaction,
      id: `${walletAddress}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    // Save to local cache
    if (!this.localHistory.has(walletAddress)) {
      this.localHistory.set(walletAddress, [])
    }
    this.localHistory.get(walletAddress)?.unshift(record)

    // Save to Firebase in background
    try {
      await saveTransaction(walletAddress, record)
    } catch (error) {
      console.error('Error saving to Firebase:', error)
    }

    return record
  }

  // Get local history
  getLocalHistory(walletAddress: string): TransactionRecord[] {
    return this.localHistory.get(walletAddress) || []
  }

  // Sync with Firebase
  async syncWithFirebase(walletAddress: string): Promise<TransactionRecord[]> {
    try {
      const firebaseHistory = await getTransactionHistoryFromFirebase(walletAddress)
      
      if (firebaseHistory.length > 0) {
        this.localHistory.set(walletAddress, firebaseHistory)
      }

      return firebaseHistory
    } catch (error) {
      console.error('Error syncing with Firebase:', error)
      return this.localHistory.get(walletAddress) || []
    }
  }

  // Get combined history (local + Firebase)
  async getCombinedHistory(walletAddress: string): Promise<TransactionRecord[]> {
    const localHistory = this.getLocalHistory(walletAddress)
    const firebaseHistory = await this.syncWithFirebase(walletAddress)

    // Merge and deduplicate
    const merged = new Map<string, TransactionRecord>()

    firebaseHistory.forEach(tx => merged.set(tx.id, tx))
    localHistory.forEach(tx => merged.set(tx.id, tx))

    return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  // Update transaction status
  async updateTransactionStatus(
    walletAddress: string,
    transactionId: string,
    status: 'confirmed' | 'failed'
  ): Promise<void> {
    const history = this.localHistory.get(walletAddress)
    if (history) {
      const tx = history.find(t => t.id === transactionId)
      if (tx) {
        tx.status = status
        // TODO: Update in Firebase
      }
    }
  }

  // Clear history for wallet
  clearHistory(walletAddress: string): void {
    this.localHistory.delete(walletAddress)
  }
}

export const transactionService = new TransactionService()
