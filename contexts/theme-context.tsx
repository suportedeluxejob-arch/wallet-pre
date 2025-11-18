'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { themeManager, ThemeMode, CustomTheme, PRESET_THEMES } from '@/lib/theme-manager'

interface ThemeContextType {
  mode: ThemeMode
  currentTheme: CustomTheme
  setMode: (mode: ThemeMode) => void
  setTheme: (theme: CustomTheme) => void
  presetThemes: CustomTheme[]
  resetToDefault: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark')
  const [currentTheme, setCurrentThemeState] = useState<CustomTheme>(PRESET_THEMES['solary-dark'])

  useEffect(() => {
    // Initialize theme on mount
    themeManager.initialize()
    setModeState(themeManager.getMode())
    setCurrentThemeState(themeManager.getCurrentTheme())
  }, [])

  const setMode = (newMode: ThemeMode) => {
    themeManager.setMode(newMode)
    setModeState(newMode)
  }

  const setTheme = (theme: CustomTheme) => {
    themeManager.setTheme(theme)
    setCurrentThemeState(theme)
  }

  const resetToDefault = () => {
    themeManager.resetToDefault()
    setModeState('dark')
    setCurrentThemeState(PRESET_THEMES['solary-dark'])
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        currentTheme,
        setMode,
        setTheme,
        presetThemes: themeManager.getPresetThemes(),
        resetToDefault,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
