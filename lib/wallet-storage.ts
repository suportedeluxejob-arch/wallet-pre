// Secure wallet storage and management utilities
import { encryptWalletData, decryptWalletData } from './wallet-utils'

export interface WalletSession {
  id: string
  walletAddress: string
  createdAt: string
  lastAccessedAt: string
}

export interface WalletBackup {
  walletAddress: string
  createdAt: string
  encrypted: boolean
  exportedAt: string
}

class WalletStorageManager {
  private sessionKey = 'solary_session_id'
  private backupPrefix = 'solary_backup_'

  // Create a new session
  createSession(walletAddress: string): WalletSession {
    const session: WalletSession = {
      id: this.generateSessionId(),
      walletAddress,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    }
    
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    return session
  }

  // Get current session
  getSession(): WalletSession | null {
    const session = sessionStorage.getItem(this.sessionKey)
    return session ? JSON.parse(session) : null
  }

  // Update last accessed time
  updateSessionAccess(): void {
    const session = this.getSession()
    if (session) {
      session.lastAccessedAt = new Date().toISOString()
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    }
  }

  // Destroy session
  destroySession(): void {
    sessionStorage.removeItem(this.sessionKey)
  }

  // Save wallet backup metadata
  saveBackupMetadata(walletAddress: string): WalletBackup {
    const backup: WalletBackup = {
      walletAddress,
      createdAt: new Date().toISOString(),
      encrypted: true,
      exportedAt: new Date().toISOString(),
    }
    
    const backupKey = `${this.backupPrefix}${walletAddress}`
    localStorage.setItem(backupKey, JSON.stringify(backup))
    return backup
  }

  // Get backup metadata
  getBackupMetadata(walletAddress: string): WalletBackup | null {
    const backupKey = `${this.backupPrefix}${walletAddress}`
    const backup = localStorage.getItem(backupKey)
    return backup ? JSON.parse(backup) : null
  }

  // List all wallets
  listWallets(): string[] {
    const wallets: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.backupPrefix)) {
        const walletAddress = key.replace(this.backupPrefix, '')
        wallets.push(walletAddress)
      }
    }
    return wallets
  }

  // Export wallet for backup
  async exportWallet(walletData: any, password: string): Promise<string> {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: walletData,
    }
    
    const encrypted = await encryptWalletData(backup, password)
    return encrypted
  }

  // Import wallet from backup
  async importWallet(encrypted: string, password: string): Promise<any> {
    return await decryptWalletData(encrypted, password)
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Clear all wallet data (destructive)
  clearAllData(): void {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('solary_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    this.destroySession()
  }

  // Get wallet security stats
  getSecurityStats() {
    return {
      storageType: 'localStorage',
      encryptionMethod: 'AES-GCM',
      keyDerivation: 'PBKDF2',
      iterations: 100000,
      serverSync: 'disabled',
      clientSideOnly: true,
    }
  }
}

export const walletStorage = new WalletStorageManager()
