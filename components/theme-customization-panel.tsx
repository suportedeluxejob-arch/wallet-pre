'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Palette, Sun, Moon, Monitor, Check, RotateCcw } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { ThemeMode, CustomTheme } from '@/lib/theme-manager'
import { useLanguage } from '@/contexts/language-context'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ThemeCustomizationPanel() {
  const { t } = useLanguage()
  const { mode, currentTheme, setMode, setTheme, presetThemes, resetToDefault } = useTheme()
  const [success, setSuccess] = useState('')

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode)
    setSuccess(`Theme mode changed to ${newMode}`)
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleThemeChange = (theme: CustomTheme) => {
    setTheme(theme)
    setSuccess(`Theme changed to ${theme.name}`)
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleReset = () => {
    resetToDefault()
    setSuccess('Theme reset to default')
    setTimeout(() => setSuccess(''), 2000)
  }

  const modes: { value: ThemeMode; label: string; icon: any }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const lightThemes = presetThemes.filter(t => t.mode === 'light')
  const darkThemes = presetThemes.filter(t => t.mode === 'dark')

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Theme Mode Selection */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-primary" />
            <CardTitle className="text-foreground">Theme Mode</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Choose between light, dark, or system preference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {modes.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                onClick={() => handleModeChange(value)}
                variant={mode === value ? 'default' : 'outline'}
                className={`h-20 flex-col space-y-2 ${
                  mode === value
                    ? 'bg-primary text-primary-foreground'
                    : 'border-border text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dark Themes */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Moon className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">Dark Themes</CardTitle>
            </div>
            <Badge variant="secondary">{darkThemes.length} themes</Badge>
          </div>
          <CardDescription className="text-muted-foreground">
            Choose from our curated dark color schemes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {darkThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  currentTheme.id === theme.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-foreground font-semibold">{theme.name}</h3>
                  {currentTheme.id === theme.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex space-x-2">
                  <div
                    className="w-8 h-8 rounded-md border border-border"
                    style={{ backgroundColor: theme.colors.background }}
                  />
                  <div
                    className="w-8 h-8 rounded-md border border-border"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-md border border-border"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                  <div
                    className="w-8 h-8 rounded-md border border-border"
                    style={{ backgroundColor: theme.colors.card }}
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Light Themes */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-primary" />
              <CardTitle className="text-foreground">Light Themes</CardTitle>
            </div>
            <Badge variant="secondary">{lightThemes.length} themes</Badge>
          </div>
          <CardDescription className="text-muted-foreground">
            Choose from our curated light color schemes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lightThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  currentTheme.id === theme.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-foreground font-semibold">{theme.name}</h3>
                  {currentTheme.id === theme.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex space-x-2">
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300"
                    style={{ backgroundColor: theme.colors.background }}
                  />
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                  <div
                    className="w-8 h-8 rounded-md border border-gray-300"
                    style={{ backgroundColor: theme.colors.card }}
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <Card className="bg-card/50 border-border">
        <CardContent className="pt-6">
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default Theme
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
