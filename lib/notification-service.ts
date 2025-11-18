export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'transaction'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  link?: string
  txSignature?: string
}

export interface NotificationSettings {
  enabled: boolean
  transactionAlerts: boolean
  priceAlerts: boolean
  securityAlerts: boolean
  stakeRewards: boolean
  sound: boolean
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set()
  private notifications: Notification[] = []
  private settings: NotificationSettings = {
    enabled: true,
    transactionAlerts: true,
    priceAlerts: true,
    securityAlerts: true,
    stakeRewards: true,
    sound: true,
  }

  constructor() {
    this.loadNotifications()
    this.loadSettings()
  }

  private loadNotifications() {
    const stored = localStorage.getItem('solary_notifications')
    if (stored) {
      this.notifications = JSON.parse(stored)
    }
  }

  private saveNotifications() {
    localStorage.setItem('solary_notifications', JSON.stringify(this.notifications))
    this.notifyListeners()
  }

  private loadSettings() {
    const stored = localStorage.getItem('solary_notification_settings')
    if (stored) {
      this.settings = JSON.parse(stored)
    }
  }

  private saveSettings() {
    localStorage.setItem('solary_notification_settings', JSON.stringify(this.settings))
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.notifications))
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.add(listener)
    listener(this.notifications)
    return () => this.listeners.delete(listener)
  }

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    if (!this.settings.enabled) return

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      read: false,
    }

    this.notifications.unshift(newNotification)
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }

    this.saveNotifications()

    // Play sound if enabled
    if (this.settings.sound) {
      this.playNotificationSound(notification.type)
    }

    // Show browser notification if supported and permission granted
    this.showBrowserNotification(newNotification)
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.saveNotifications()
  }

  delete(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.saveNotifications()
  }

  clearAll() {
    this.notifications = []
    this.saveNotifications()
  }

  getAll(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  // Convenience methods for specific notification types
  notifyTransactionSent(txSignature: string, amount: number, to: string) {
    if (!this.settings.transactionAlerts) return
    
    this.add({
      type: 'transaction',
      title: 'Transaction Sent',
      message: `Sent ${amount} SOL to ${to.substring(0, 8)}...`,
      txSignature,
      link: `https://solscan.io/tx/${txSignature}`,
    })
  }

  notifyTransactionConfirmed(txSignature: string) {
    if (!this.settings.transactionAlerts) return
    
    this.add({
      type: 'success',
      title: 'Transaction Confirmed',
      message: 'Your transaction has been confirmed on the blockchain',
      txSignature,
      link: `https://solscan.io/tx/${txSignature}`,
    })
  }

  notifyTransactionFailed(error: string) {
    if (!this.settings.transactionAlerts) return
    
    this.add({
      type: 'error',
      title: 'Transaction Failed',
      message: error,
    })
  }

  notifyPriceAlert(token: string, price: number, direction: 'up' | 'down') {
    if (!this.settings.priceAlerts) return
    
    this.add({
      type: direction === 'up' ? 'success' : 'warning',
      title: `${token} Price ${direction === 'up' ? 'Increase' : 'Decrease'}`,
      message: `${token} is now at $${price.toFixed(2)}`,
    })
  }

  notifySecurityEvent(event: string) {
    if (!this.settings.securityAlerts) return
    
    this.add({
      type: 'warning',
      title: 'Security Alert',
      message: event,
    })
  }

  notifyStakeReward(amount: number) {
    if (!this.settings.stakeRewards) return
    
    this.add({
      type: 'success',
      title: 'Staking Reward',
      message: `You earned ${amount} SOL in staking rewards`,
    })
  }

  private playNotificationSound(type: NotificationType) {
    try {
      const audio = new Audio()
      // Different tones for different notification types
      const frequency = type === 'error' ? 300 : type === 'success' ? 800 : 600
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  private async showBrowserNotification(notification: Notification) {
    if (!('Notification' in window)) return
    
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/solana-logo.png',
        badge: '/solana-logo.png',
        tag: notification.id,
      })
    } else if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false
    }
    
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
}

export const notificationService = new NotificationService()
