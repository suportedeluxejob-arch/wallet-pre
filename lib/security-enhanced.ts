// Enhanced security system with auto-lock, biometrics, and session management

export interface SecuritySettings {
  autoLockEnabled: boolean
  autoLockTimeout: number // in minutes
  biometricsEnabled: boolean
  requirePasswordOnSend: boolean
  showBalanceOnLock: boolean
}

export interface SecuritySession {
  id: string
  walletAddress: string
  createdAt: number
  lastActivityAt: number
  isLocked: boolean
  biometricsRegistered: boolean
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  autoLockEnabled: true,
  autoLockTimeout: 5, // 5 minutes
  biometricsEnabled: false,
  requirePasswordOnSend: true,
  showBalanceOnLock: false,
}

class SecurityManager {
  private sessionKey = 'solary_security_session'
  private settingsKey = 'solary_security_settings'
  private activityTimer: NodeJS.Timeout | null = null
  private lockCallbacks: Set<() => void> = new Set()

  // Initialize security session
  createSession(walletAddress: string): SecuritySession {
    const session: SecuritySession = {
      id: this.generateSessionId(),
      walletAddress,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      isLocked: false,
      biometricsRegistered: false,
    }
    
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    this.startActivityMonitor()
    return session
  }

  // Get current session
  getSession(): SecuritySession | null {
    const sessionData = sessionStorage.getItem(this.sessionKey)
    if (!sessionData) return null
    
    try {
      return JSON.parse(sessionData)
    } catch {
      return null
    }
  }

  // Update last activity time
  updateActivity(): void {
    const session = this.getSession()
    if (session && !session.isLocked) {
      session.lastActivityAt = Date.now()
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    }
  }

  // Lock wallet
  lockWallet(): void {
    const session = this.getSession()
    if (session) {
      session.isLocked = true
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
      this.notifyLockCallbacks()
    }
  }

  // Unlock wallet
  unlockWallet(): void {
    const session = this.getSession()
    if (session) {
      session.isLocked = false
      session.lastActivityAt = Date.now()
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
    }
  }

  // Check if wallet is locked
  isLocked(): boolean {
    const session = this.getSession()
    return session?.isLocked ?? true
  }

  // Register lock callback
  onLock(callback: () => void): () => void {
    this.lockCallbacks.add(callback)
    return () => this.lockCallbacks.delete(callback)
  }

  // Notify all lock callbacks
  private notifyLockCallbacks(): void {
    this.lockCallbacks.forEach(callback => callback())
  }

  // Start monitoring user activity
  startActivityMonitor(): void {
    this.stopActivityMonitor()
    
    const settings = this.getSettings()
    if (!settings.autoLockEnabled) return

    const checkActivity = () => {
      const session = this.getSession()
      if (!session || session.isLocked) return

      const timeSinceActivity = Date.now() - session.lastActivityAt
      const timeoutMs = settings.autoLockTimeout * 60 * 1000

      if (timeSinceActivity >= timeoutMs) {
        console.log('[v0] Auto-locking wallet due to inactivity')
        this.lockWallet()
      }
    }

    // Check every 30 seconds
    this.activityTimer = setInterval(checkActivity, 30000)
  }

  // Stop activity monitor
  stopActivityMonitor(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer)
      this.activityTimer = null
    }
  }

  // Get security settings
  getSettings(): SecuritySettings {
    const settingsData = localStorage.getItem(this.settingsKey)
    if (!settingsData) return DEFAULT_SECURITY_SETTINGS
    
    try {
      return { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(settingsData) }
    } catch {
      return DEFAULT_SECURITY_SETTINGS
    }
  }

  // Update security settings
  updateSettings(settings: Partial<SecuritySettings>): void {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(this.settingsKey, JSON.stringify(updated))
    
    // Restart activity monitor if auto-lock settings changed
    if ('autoLockEnabled' in settings || 'autoLockTimeout' in settings) {
      this.startActivityMonitor()
    }
  }

  // Check if Web Authentication API is available
  isBiometricsAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'credentials' in navigator && 
           'create' in navigator.credentials
  }

  // Register biometrics
  async registerBiometrics(walletAddress: string): Promise<boolean> {
    if (!this.isBiometricsAvailable()) {
      throw new Error('Biometrics not available on this device')
    }

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: 'Solary Wallet',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(walletAddress),
            name: walletAddress,
            displayName: 'Solary Wallet User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      })

      if (credential) {
        const session = this.getSession()
        if (session) {
          session.biometricsRegistered = true
          sessionStorage.setItem(this.sessionKey, JSON.stringify(session))
        }
        return true
      }
      return false
    } catch (error) {
      console.error('[v0] Biometrics registration failed:', error)
      return false
    }
  }

  // Authenticate with biometrics
  async authenticateWithBiometrics(): Promise<boolean> {
    if (!this.isBiometricsAvailable()) {
      throw new Error('Biometrics not available on this device')
    }

    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
        },
      })

      return credential !== null
    } catch (error) {
      console.error('[v0] Biometrics authentication failed:', error)
      return false
    }
  }

  // Destroy session
  destroySession(): void {
    this.stopActivityMonitor()
    sessionStorage.removeItem(this.sessionKey)
    this.lockCallbacks.clear()
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get time until auto-lock
  getTimeUntilLock(): number | null {
    const session = this.getSession()
    const settings = this.getSettings()
    
    if (!session || !settings.autoLockEnabled || session.isLocked) {
      return null
    }

    const timeSinceActivity = Date.now() - session.lastActivityAt
    const timeoutMs = settings.autoLockTimeout * 60 * 1000
    const timeRemaining = timeoutMs - timeSinceActivity
    
    return Math.max(0, Math.floor(timeRemaining / 1000)) // seconds
  }
}

export const securityManager = new SecurityManager()
