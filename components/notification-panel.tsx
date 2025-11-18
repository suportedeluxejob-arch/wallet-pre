'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Trash2, X, ExternalLink, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { notificationService, type Notification, type NotificationSettings } from '@/lib/notification-service'

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(notifs)
    })

    return unsubscribe
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const handleDelete = (id: string) => {
    notificationService.delete(id)
  }

  const handleClearAll = () => {
    notificationService.clearAll()
  }

  const handleUpdateSettings = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    notificationService.updateSettings({ [key]: value })
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'error':
        return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'transaction':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {showSettings ? (
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-sm">Notification Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled" className="text-sm">Enable Notifications</Label>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => handleUpdateSettings('enabled', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="transactions" className="text-sm">Transaction Alerts</Label>
                <Switch
                  id="transactions"
                  checked={settings.transactionAlerts}
                  onCheckedChange={(checked) => handleUpdateSettings('transactionAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="price" className="text-sm">Price Alerts</Label>
                <Switch
                  id="price"
                  checked={settings.priceAlerts}
                  onCheckedChange={(checked) => handleUpdateSettings('priceAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="security" className="text-sm">Security Alerts</Label>
                <Switch
                  id="security"
                  checked={settings.securityAlerts}
                  onCheckedChange={(checked) => handleUpdateSettings('securityAlerts', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="stake" className="text-sm">Staking Rewards</Label>
                <Switch
                  id="stake"
                  checked={settings.stakeRewards}
                  onCheckedChange={(checked) => handleUpdateSettings('stakeRewards', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="text-sm">Sound</Label>
                <Switch
                  id="sound"
                  checked={settings.sound}
                  onCheckedChange={(checked) => handleUpdateSettings('sound', checked)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowSettings(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-accent/50 transition-colors ${
                        !notification.read ? 'bg-accent/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.read ? 'bg-primary' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getNotificationColor(notification.type)}`}
                                >
                                  {notification.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                              <h4 className="font-medium text-sm mt-1">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                            {notification.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => window.open(notification.link, '_blank')}
                              >
                                View <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  notification.action?.onClick()
                                  setOpen(false)
                                }}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
