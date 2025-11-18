// Advanced security management system
export interface SecuritySettings {
  autoLockEnabled: boolean
  autoLockTimeout: number // em minutos
  require2FA: boolean
  biometricEnabled: boolean
  sessionTimeout: number // em minutos
  maxLoginAttempts: number
  requirePasswordChange: boolean
  passwordChangeInterval: number // em dias
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'failed_attempt' | 'password_change' | 'settings_change' | 'auto_lock'
  timestamp: string
  details?: string
}

export interface TwoFactorAuth {
  enabled: boolean
  secret?: string
  backupCodes: string[]
  lastVerified?: string
}

class SecurityManager {
  private settingsKey = 'solary_security_settings'
  private eventsKey = 'solary_security_events'
  private twoFactorKey = 'solary_2fa'
  private loginAttemptsKey = 'solary_login_attempts'
  private lastActivityKey = 'solary_last_activity'

  // Default security settings
  getDefaultSettings(): SecuritySettings {
    return {
      autoLockEnabled: true,
      autoLockTimeout: 15, // 15 minutos
      require2FA: false,
      biometricEnabled: false,
      sessionTimeout: 60, // 1 hora
      maxLoginAttempts: 5,
      requirePasswordChange: false,
      passwordChangeInterval: 90, // 90 dias
    }
  }

  // Get current security settings
  getSettings(): SecuritySettings {
    const settings = localStorage.getItem(this.settingsKey)
    return settings ? JSON.parse(settings) : this.getDefaultSettings()
  }

  // Update security settings
  updateSettings(settings: Partial<SecuritySettings>): void {
    const currentSettings = this.getSettings()
    const updatedSettings = { ...currentSettings, ...settings }
    localStorage.setItem(this.settingsKey, JSON.stringify(updatedSettings))
    
    this.logSecurityEvent('settings_change', 'Security settings updated')
  }

  // Track last activity
  updateLastActivity(): void {
    localStorage.setItem(this.lastActivityKey, Date.now().toString())
  }

  // Get last activity timestamp
  getLastActivity(): number {
    const lastActivity = localStorage.getItem(this.lastActivityKey)
    return lastActivity ? parseInt(lastActivity) : Date.now()
  }

  // Check if wallet should auto-lock
  shouldAutoLock(): boolean {
    const settings = this.getSettings()
    if (!settings.autoLockEnabled) return false

    const lastActivity = this.getLastActivity()
    const now = Date.now()
    const timeoutMs = settings.autoLockTimeout * 60 * 1000

    return (now - lastActivity) > timeoutMs
  }

  // Log security event
  logSecurityEvent(type: SecurityEvent['type'], details?: string): void {
    const events = this.getSecurityEvents()
    const event: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date().toISOString(),
      details,
    }

    events.unshift(event)
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(100)
    }

    localStorage.setItem(this.eventsKey, JSON.stringify(events))
  }

  // Get security events
  getSecurityEvents(): SecurityEvent[] {
    const events = localStorage.getItem(this.eventsKey)
    return events ? JSON.parse(events) : []
  }

  // Track login attempts
  recordLoginAttempt(success: boolean): boolean {
    const attempts = this.getLoginAttempts()
    const settings = this.getSettings()

    if (success) {
      // Reset attempts on successful login
      localStorage.removeItem(this.loginAttemptsKey)
      this.logSecurityEvent('login', 'Successful login')
      return true
    } else {
      // Increment failed attempts
      const newAttempts = attempts + 1
      localStorage.setItem(this.loginAttemptsKey, newAttempts.toString())
      this.logSecurityEvent('failed_attempt', `Failed login attempt #${newAttempts}`)

      // Check if locked out
      if (newAttempts >= settings.maxLoginAttempts) {
        this.lockAccount()
        return false
      }
      return true
    }
  }

  // Get current login attempts
  getLoginAttempts(): number {
    const attempts = localStorage.getItem(this.loginAttemptsKey)
    return attempts ? parseInt(attempts) : 0
  }

  // Check if account is locked
  isAccountLocked(): boolean {
    const settings = this.getSettings()
    return this.getLoginAttempts() >= settings.maxLoginAttempts
  }

  // Lock account
  private lockAccount(): void {
    this.logSecurityEvent('auto_lock', 'Account locked due to too many failed attempts')
  }

  // Unlock account (requires manual intervention or time-based unlock)
  unlockAccount(): void {
    localStorage.removeItem(this.loginAttemptsKey)
    this.logSecurityEvent('login', 'Account unlocked')
  }

  // 2FA Management
  enable2FA(): { secret: string; backupCodes: string[] } {
    const secret = this.generate2FASecret()
    const backupCodes = this.generateBackupCodes()

    const twoFactor: TwoFactorAuth = {
      enabled: true,
      secret,
      backupCodes,
      lastVerified: new Date().toISOString(),
    }

    localStorage.setItem(this.twoFactorKey, JSON.stringify(twoFactor))
    this.updateSettings({ require2FA: true })

    return { secret, backupCodes }
  }

  // Disable 2FA
  disable2FA(): void {
    localStorage.removeItem(this.twoFactorKey)
    this.updateSettings({ require2FA: false })
  }

  // Get 2FA status
  get2FAStatus(): TwoFactorAuth {
    const twoFactor = localStorage.getItem(this.twoFactorKey)
    return twoFactor ? JSON.parse(twoFactor) : { enabled: false, backupCodes: [] }
  }

  // Verify 2FA code
  verify2FACode(code: string): boolean {
    const twoFactor = this.get2FAStatus()
    if (!twoFactor.enabled || !twoFactor.secret) return false

    // In production, use a proper TOTP library like 'otpauth'
    // For now, we'll check backup codes
    const codeIndex = twoFactor.backupCodes.indexOf(code)
    if (codeIndex !== -1) {
      // Remove used backup code
      twoFactor.backupCodes.splice(codeIndex, 1)
      localStorage.setItem(this.twoFactorKey, JSON.stringify(twoFactor))
      return true
    }

    return false
  }

  // Generate 2FA secret (base32)
  private generate2FASecret(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += charset[Math.floor(Math.random() * charset.length)]
    }
    return secret
  }

  // Generate backup codes
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  // Clear all security data
  clearSecurityData(): void {
    localStorage.removeItem(this.settingsKey)
    localStorage.removeItem(this.eventsKey)
    localStorage.removeItem(this.twoFactorKey)
    localStorage.removeItem(this.loginAttemptsKey)
    localStorage.removeItem(this.lastActivityKey)
  }

  // Get security summary
  getSecuritySummary() {
    const settings = this.getSettings()
    const twoFactor = this.get2FAStatus()
    const events = this.getSecurityEvents()
    const loginAttempts = this.getLoginAttempts()

    return {
      settings,
      twoFactorEnabled: twoFactor.enabled,
      recentEvents: events.slice(0, 10),
      isLocked: this.isAccountLocked(),
      loginAttempts,
      lastActivity: new Date(this.getLastActivity()).toISOString(),
    }
  }
}

export const securityManager = new SecurityManager()
