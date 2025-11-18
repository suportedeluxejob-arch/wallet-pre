import { Connection, PublicKey, Transaction, SystemProgram, Keypair, SendOptions } from '@solana/web3.js'
import { NETWORK_ENDPOINTS, type NetworkType } from './wallet-utils'

// Enhanced transaction service with retry logic and better error handling
export interface TransactionOptions {
  maxRetries?: number
  retryDelay?: number
  confirmationStrategy?: 'confirmed' | 'finalized'
  skipPreflight?: boolean
}

export class EnhancedTransactionService {
  private connection: Connection
  private network: NetworkType

  constructor(network: NetworkType = 'mainnet') {
    this.network = network
    this.connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
  }

  // Send transaction with retry logic
  async sendTransactionWithRetry(
    transaction: Transaction,
    signers: Keypair[],
    options: TransactionOptions = {}
  ): Promise<string> {
    const {
      maxRetries = 3,
      retryDelay = 2000,
      confirmationStrategy = 'confirmed',
      skipPreflight = false,
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[v0] Transaction attempt ${attempt + 1}/${maxRetries}`)

        // Get fresh blockhash for each attempt
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = signers[0].publicKey

        // Sign transaction
        transaction.sign(...signers)

        // Send transaction
        const signature = await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight,
            maxRetries: 0, // We handle retries ourselves
          }
        )

        console.log(`[v0] Transaction sent with signature: ${signature}`)

        // Confirm transaction with timeout
        const confirmation = await this.connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          confirmationStrategy
        )

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
        }

        console.log(`[v0] Transaction confirmed`)
        return signature
      } catch (error: any) {
        lastError = error
        console.error(`[v0] Transaction attempt ${attempt + 1} failed:`, error.message)

        // Don't retry on certain errors
        if (
          error.message?.includes('insufficient') ||
          error.message?.includes('Invalid') ||
          error.message?.includes('blockhash not found')
        ) {
          throw error
        }

        // Wait before retrying
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    throw lastError || new Error('Transaction failed after all retries')
  }

  // Estimate transaction fee more accurately
  async estimateFee(transaction: Transaction): Promise<number> {
    try {
      const { value: fee } = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      )
      return fee ? fee / 1e9 : 0.000005
    } catch (error) {
      console.error('[v0] Error estimating fee:', error)
      return 0.000005
    }
  }

  // Check if transaction was confirmed
  async isTransactionConfirmed(signature: string): Promise<boolean> {
    try {
      const status = await this.connection.getSignatureStatus(signature)
      return status?.value?.confirmationStatus === 'confirmed' || 
             status?.value?.confirmationStatus === 'finalized'
    } catch (error) {
      console.error('[v0] Error checking transaction status:', error)
      return false
    }
  }

  // Get transaction details
  async getTransactionDetails(signature: string) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      })
      return tx
    } catch (error) {
      console.error('[v0] Error fetching transaction details:', error)
      return null
    }
  }

  // Update connection to new network
  updateNetwork(network: NetworkType) {
    this.network = network
    this.connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
  }
}
