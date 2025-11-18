// Enhanced security service for biometric and advanced protection

import { encryptWalletData, decryptWalletData } from './wallet-utils'

export interface SecuritySettings {
  biometricEnabled: boolean
  twoFactorEnabled: boolean
  transactionApprovalRequired: boolean
  autoLockTimeout: number
  ipWhitelist: string[]
  deviceFingerprint: string
}

class SecurityService {
  private settings: Map<string, SecuritySettings> = new Map()

  // Check if biometric is available
  async isBiometricAvailable(): Promise<boolean> {
    if (!window.PublicKeyCredential) {
      return false
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return available
    } catch (error) {
      console.error('Error checking biometric availability:', error)
      return false
    }
  }

  // Generate device fingerprint
  generateDeviceFingerprint(): string {
    const navigator = window.navigator
    const screen = window.screen
    
    const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}`
    return btoa(fingerprint)
  }

  // Get or create security settings
  getSecuritySettings(walletAddress: string): SecuritySettings {
    if (!this.settings.has(walletAddress)) {
      this.settings.set(walletAddress, {
        biometricEnabled: false,
        twoFactorEnabled: false,
        transactionApprovalRequired: true,
        autoLockTimeout: 15, // minutes
        ipWhitelist: [],
        deviceFingerprint: this.generateDeviceFingerprint(),
      })
    }

    return this.settings.get(walletAddress)!
  }

  // Update security settings
  updateSecuritySettings(walletAddress: string, settings: Partial<SecuritySettings>): void {
    const current = this.getSecuritySettings(walletAddress)
    this.settings.set(walletAddress, { ...current, ...settings })
  }

  // Verify device fingerprint
  async verifyDeviceFingerprint(walletAddress: string): Promise<boolean> {
    const settings = this.getSecuritySettings(walletAddress)
    const currentFingerprint = this.generateDeviceFingerprint()
    
    return settings.deviceFingerprint === currentFingerprint
  }

  // Create transaction approval challenge
  async createApprovalChallenge(): Promise<string> {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    return Array.from(challenge)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

export const securityService = new SecurityService()
