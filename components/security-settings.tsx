'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Lock, Shield, Fingerprint, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { securityService } from '@/lib/security-service'

interface SecuritySettingsProps {
  walletAddress: string
}

export default function SecuritySettings({ walletAddress }: SecuritySettingsProps) {
  const [settings, setSettings] = useState<any>(null)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeSettings()
  }, [walletAddress])

  const initializeSettings = async () => {
    try {
      setLoading(true)
      const available = await securityService.isBiometricAvailable()
      setBiometricAvailable(available)
      
      const secs = securityService.getSecuritySettings(walletAddress)
      setSettings(secs)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    securityService.updateSecuritySettings(walletAddress, { [key]: value })
  }

  if (loading) {
    return (
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[#3a2a34] rounded w-1/3"></div>
            <div className="h-4 bg-[#3a2a34] rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Biometric Security */}
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
            <Fingerprint className="w-5 h-5 text-[#8b005d]" />
            Biometric Authentication
          </CardTitle>
          <CardDescription className="text-[#c0c0c0]">
            {biometricAvailable ? 'Available on this device' : 'Not available on this device'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!biometricAvailable && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400">
                Biometric authentication is not available on this device
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between p-3 bg-[#0b0b0b]/70 rounded-lg border border-[#3a2a34]">
            <div>
              <p className="text-[#f8e1f4] font-semibold">Enable Biometric</p>
              <p className="text-xs text-[#c0c0c0]">Use fingerprint or face ID</p>
            </div>
            <Switch
              checked={settings.biometricEnabled && biometricAvailable}
              onCheckedChange={(value) => updateSetting('biometricEnabled', value)}
              disabled={!biometricAvailable}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transaction Security */}
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
            <Shield className="w-5 h-5 text-[#8b005d]" />
            Transaction Security
          </CardTitle>
          <CardDescription className="text-[#c0c0c0]">Require approval for transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#0b0b0b]/70 rounded-lg border border-[#3a2a34]">
            <div>
              <p className="text-[#f8e1f4] font-semibold">Require Approval</p>
              <p className="text-xs text-[#c0c0c0]">Confirm all transactions</p>
            </div>
            <Switch
              checked={settings.transactionApprovalRequired}
              onCheckedChange={(value) => updateSetting('transactionApprovalRequired', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-lock Settings */}
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
            <Clock className="w-5 h-5 text-[#8b005d]" />
            Auto-lock
          </CardTitle>
          <CardDescription className="text-[#c0c0c0]">Automatically lock after inactivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {[5, 10, 15, 30].map(minutes => (
              <button
                key={minutes}
                onClick={() => updateSetting('autoLockTimeout', minutes)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                  settings.autoLockTimeout === minutes
                    ? 'bg-gradient-to-r from-[#8b005d]/20 to-[#d4308e]/20 border-[#8b005d]'
                    : 'bg-[#0b0b0b]/70 border-[#3a2a34] hover:border-[#8b005d]/50'
                }`}
              >
                <span className={settings.autoLockTimeout === minutes ? 'text-[#f8e1f4] font-semibold' : 'text-[#c0c0c0]'}>
                  {minutes} minutes
                </span>
                {settings.autoLockTimeout === minutes && (
                  <CheckCircle2 className="w-4 h-4 text-[#8b005d]" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card className="border-green-500/30 bg-green-500/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
            <Lock className="w-5 h-5 text-green-400" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#c0c0c0]">Encryption</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#c0c0c0]">Device Verification</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Verified</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#c0c0c0]">Transaction Approval</span>
            <Badge className={settings.transactionApprovalRequired ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
              {settings.transactionApprovalRequired ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
