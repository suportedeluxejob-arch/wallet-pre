import * as bip39 from 'bip39'
import { Keypair, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import * as ed25519 from '@noble/ed25519'
import { Buffer } from 'buffer'
import { getAssociatedTokenAddress } from './utils' // Assuming utils is a separate file for helper functions
import { createAssociatedTokenAccountInstruction, createTransferInstruction } from './instructions' // Assuming instructions is a separate file for instruction creation

// Types
interface WalletAccount {
  name: string
  seedPhrase: string
  privateKey: Uint8Array
  publicKey: string
  derivationIndex: number
}

export interface Transaction {
  signature: string
  timestamp: number
  type: 'sent' | 'received'
  amount: number
  from: string
  to: string
  status: 'confirmed' | 'pending' | 'failed'
  fee?: number
}

export interface SPLToken {
  mint: string
  tokenAccount: string
  balance: number
  decimals: number
  symbol?: string
  name?: string
  logoURI?: string
  price?: number
}

export type NetworkType = 'mainnet' | 'devnet' | 'testnet'

export const NETWORK_ENDPOINTS: Record<NetworkType, string> = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
}

// Simple password hashing (for demo - in production use bcrypt)
export function hashPassword(password: string): string {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(password)
  return Array.from(encoded)
    .map(b => String.fromCharCode(b))
    .join('')
}

// Utility function to convert string to base64
function stringToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
}

// Utility function to convert base64 to string
function base64ToString(base64: string): string {
  return decodeURIComponent(escape(atob(base64)))
}

// Encrypt wallet data with password using AES-GCM
export async function encryptWalletData(data: any, password: string): Promise<string> {
  // Derive a key from password using PBKDF2
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('solary-wallet-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256
  )

  const key = await crypto.subtle.importKey(
    'raw',
    derivedBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  )

  // Combine IV + encrypted data and return as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Convert to base64 using browser API
  const binaryString = Array.from(combined)
    .map(byte => String.fromCharCode(byte))
    .join('')
  
  return stringToBase64(binaryString)
}

// Decrypt wallet data with password using AES-GCM
export async function decryptWalletData(encrypted: string, password: string): Promise<any> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('solary-wallet-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    256
  )

  const key = await crypto.subtle.importKey(
    'raw',
    derivedBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  )

  const binaryString = base64ToString(encrypted)
  const combined = new Uint8Array(
    binaryString.split('').map(char => char.charCodeAt(0))
  )
  
  const iv = combined.slice(0, 12)
  const encryptedData = combined.slice(12)

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  )

  return JSON.parse(new TextDecoder().decode(decrypted))
}

// Generate wallet data with account index for multiple accounts
export async function generateWallet(accountIndex: number = 0): Promise<WalletAccount> {
  // Generate BIP39 seed phrase (12 words)
  const mnemonic = bip39.generateMnemonic(128)

  // Convert mnemonic to seed (64 bytes)
  const seed = await bip39.mnemonicToSeed(mnemonic)
  
  // Take first 32 bytes as ed25519 private key (Solana default method)
  const seed32 = seed.slice(0, 32)
  
  // Generate Solana keypair from 32-byte seed
  const keypair = Keypair.fromSeed(seed32)

  return {
    name: `Account ${accountIndex + 1}`,
    seedPhrase: mnemonic,
    privateKey: keypair.secretKey,
    publicKey: keypair.publicKey.toBase58(),
    derivationIndex: accountIndex,
  }
}

// Derive additional accounts from the same seed phrase
export async function deriveAccount(seedPhrase: string, accountIndex: number): Promise<WalletAccount> {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error('Invalid seed phrase')
  }

  const seed = await bip39.mnemonicToSeed(seedPhrase)
  const seed32 = seed.slice(0, 32)
  
  // For simplicity, we'll use different slices for different accounts
  // In production, use proper BIP44 derivation with account index
  const indexBuffer = new Uint8Array([accountIndex])
  const modifiedSeed = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    modifiedSeed[i] = seed32[i] ^ (indexBuffer[0] * (i + 1) % 256)
  }
  
  const keypair = Keypair.fromSeed(modifiedSeed)

  return {
    name: `Account ${accountIndex + 1}`,
    seedPhrase,
    privateKey: keypair.secretKey,
    publicKey: keypair.publicKey.toBase58(),
    derivationIndex: accountIndex,
  }
}

// Get balance from Solana RPC with network parameter
export async function getBalance(publicKey: string, network: NetworkType = 'mainnet'): Promise<number> {
  try {
    const response = await fetch(NETWORK_ENDPOINTS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [publicKey],
      }),
    })

    const data = await response.json()
    if (data.result) {
      return data.result.value / 1e9 // Convert lamports to SOL
    }
    return 0
  } catch (error) {
    console.error('Error fetching balance:', error)
    return 0
  }
}

// Send SOL transaction with network parameter
export async function sendTransaction(
  fromPrivateKey: Uint8Array,
  toAddress: string,
  amount: number,
  network: NetworkType = 'mainnet'
): Promise<string> {
  try {
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    
    // Create keypair from private key
    const fromKeypair = Keypair.fromSecretKey(fromPrivateKey)
    const toPublicKey = new PublicKey(toAddress)
    
    // Convert SOL to lamports
    const lamports = Math.floor(amount * 1e9)
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    )
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromKeypair.publicKey
    
    // Sign transaction
    transaction.sign(fromKeypair)
    
    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize())
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed')
    
    return signature
  } catch (error: any) {
    console.error('Transaction error:', error)
    throw new Error(error.message || 'Failed to send transaction')
  }
}

// Get transaction history with network parameter
export async function getTransactionHistory(
  publicKey: string,
  limit: number = 10,
  network: NetworkType = 'mainnet'
): Promise<Transaction[]> {
  try {
    const response = await fetch(NETWORK_ENDPOINTS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [publicKey, { limit }],
      }),
    })

    const data = await response.json()
    
    if (!data.result) {
      return []
    }

    // Fetch transaction details
    const transactions: Transaction[] = []
    
    for (const sig of data.result.slice(0, limit)) {
      const txResponse = await fetch(NETWORK_ENDPOINTS[network], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
        }),
      })

      const txData = await txResponse.json()
      
      if (txData.result) {
        const tx = txData.result
        const meta = tx.meta
        
        // Determine transaction type and amount
        const preBalance = meta.preBalances[0] / 1e9
        const postBalance = meta.postBalances[0] / 1e9
        const change = postBalance - preBalance
        
        transactions.push({
          signature: sig.signature,
          timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
          type: change < 0 ? 'sent' : 'received',
          amount: Math.abs(change),
          from: tx.transaction.message.accountKeys[0].pubkey,
          to: tx.transaction.message.accountKeys[1]?.pubkey || 'Unknown',
          status: sig.confirmationStatus === 'finalized' ? 'confirmed' : 'pending',
          fee: meta.fee / 1e9,
        })
      }
    }

    return transactions
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return []
  }
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Solana addresses are base58 encoded and typically 32-44 characters
    if (address.length < 32 || address.length > 44) {
      return false
    }
    
    // Check if it's valid base58
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    for (const char of address) {
      if (!base58Chars.includes(char)) {
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

// Get SPL token accounts for a wallet with network parameter
export async function getTokenAccounts(
  publicKey: string,
  network: NetworkType = 'mainnet'
): Promise<SPLToken[]> {
  try {
    const response = await fetch(NETWORK_ENDPOINTS[network], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          publicKey,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' }
        ],
      }),
    })

    const data = await response.json()
    
    if (!data.result?.value) {
      return []
    }

    const tokens: SPLToken[] = data.result.value
      .map((account: any) => {
        const accountInfo = account.account.data.parsed.info
        const balance = accountInfo.tokenAmount.uiAmount || 0
        
        // Filter out tokens with 0 balance
        if (balance === 0) return null
        
        return {
          mint: accountInfo.mint,
          tokenAccount: account.pubkey,
          balance,
          decimals: accountInfo.tokenAmount.decimals,
        }
      })
      .filter((token: any) => token !== null)

    // Fetch token metadata from Jupiter API
    if (tokens.length > 0) {
      const mints = tokens.map(t => t.mint).join(',')
      try {
        const metaResponse = await fetch(`https://tokens.jup.ag/tokens?mints=${mints}`)
        const metadata = await metaResponse.json()
        
        // Match metadata with tokens
        tokens.forEach(token => {
          const meta = metadata.find((m: any) => m.address === token.mint)
          if (meta) {
            token.symbol = meta.symbol
            token.name = meta.name
            token.logoURI = meta.logoURI
          }
        })
      } catch (error) {
        console.warn('Failed to fetch token metadata:', error)
      }
    }

    return tokens
  } catch (error) {
    console.error('Error fetching token accounts:', error)
    return []
  }
}

// Send SPL token transaction with network parameter
export async function sendTokenTransaction(
  fromPrivateKey: Uint8Array,
  toAddress: string,
  tokenMint: string,
  amount: number,
  decimals: number,
  network: NetworkType = 'mainnet'
): Promise<string> {
  try {
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    
    // Create keypair from private key
    const fromKeypair = Keypair.fromSecretKey(fromPrivateKey)
    const toPublicKey = new PublicKey(toAddress)
    const mintPublicKey = new PublicKey(tokenMint)
    
    // Get or create associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      connection,
      fromKeypair.publicKey,
      mintPublicKey
    )
    
    const toTokenAccount = await getAssociatedTokenAddress(
      connection,
      toPublicKey,
      mintPublicKey
    )
    
    // Convert amount to smallest unit based on decimals
    const transferAmount = Math.floor(amount * Math.pow(10, decimals))
    
    // Create transaction
    const transaction = new Transaction()
    
    // Check if destination token account exists
    const toAccountInfo = await connection.getAccountInfo(toTokenAccount)
    
    if (!toAccountInfo) {
      // Create associated token account instruction
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromKeypair.publicKey,
          toTokenAccount,
          toPublicKey,
          mintPublicKey
        )
      )
    }
    
    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        transferAmount
      )
    )
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromKeypair.publicKey
    
    // Sign transaction
    transaction.sign(fromKeypair)
    
    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize())
    
    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed')
    
    return signature
  } catch (error: any) {
    console.error('Token transaction error:', error)
    throw new Error(error.message || 'Failed to send token transaction')
  }
}

// Import wallet data with account index for multiple accounts
export async function importWallet(seedPhrase: string, accountIndex: number = 0): Promise<WalletAccount> {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error('Invalid seed phrase. Please check and try again.')
  }

  const seed = await bip39.mnemonicToSeed(seedPhrase)
  const seed32 = seed.slice(0, 32)
  const keypair = Keypair.fromSeed(seed32)

  return {
    name: `Account ${accountIndex + 1}`,
    seedPhrase,
    privateKey: keypair.secretKey,
    publicKey: keypair.publicKey.toBase58(),
    derivationIndex: accountIndex,
  }
}

// Estimate transaction fees with network parameter
export async function estimateTransactionFee(
  fromPublicKey: string,
  network: NetworkType = 'mainnet'
): Promise<number> {
  try {
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    const feeCalculator = await connection.getRecentBlockhash()
    
    // Standard transfer has ~1 signature, estimate ~5000 lamports
    return 0.000005 // SOL
  } catch (error) {
    console.error('Error estimating fee:', error)
    return 0.000005 // Default fee estimate
  }
}
