// Theme management system with dark/light mode and custom themes
export type ThemeMode = 'light' | 'dark' | 'system'

export interface CustomTheme {
  id: string
  name: string
  mode: 'light' | 'dark'
  colors: {
    background: string
    foreground: string
    primary: string
    primaryForeground: string
    secondary: string
    card: string
    border: string
    accent: string
  }
}

export const PRESET_THEMES: Record<string, CustomTheme> = {
  'solary-dark': {
    id: 'solary-dark',
    name: 'Solary Dark (Default)',
    mode: 'dark',
    colors: {
      background: '#0b0b0b',
      foreground: '#f8e1f4',
      primary: '#8b005d',
      primaryForeground: '#f8e1f4',
      secondary: '#2a1a24',
      card: '#1a0a14',
      border: '#3a2a34',
      accent: '#d4308e',
    },
  },
  'solary-light': {
    id: 'solary-light',
    name: 'Solary Light',
    mode: 'light',
    colors: {
      background: '#ffffff',
      foreground: '#1a0a14',
      primary: '#8b005d',
      primaryForeground: '#ffffff',
      secondary: '#f5e6f0',
      card: '#fef7fc',
      border: '#e5d4e0',
      accent: '#d4308e',
    },
  },
  'midnight': {
    id: 'midnight',
    name: 'Midnight Blue',
    mode: 'dark',
    colors: {
      background: '#0a0e1a',
      foreground: '#e0e7ff',
      primary: '#3b82f6',
      primaryForeground: '#ffffff',
      secondary: '#1e2a47',
      card: '#121826',
      border: '#2a3f5f',
      accent: '#60a5fa',
    },
  },
  'forest': {
    id: 'forest',
    name: 'Forest Green',
    mode: 'dark',
    colors: {
      background: '#0a1410',
      foreground: '#e0f2e9',
      primary: '#10b981',
      primaryForeground: '#ffffff',
      secondary: '#1a2e23',
      card: '#0f1f17',
      border: '#2a5f42',
      accent: '#34d399',
    },
  },
  'sunset': {
    id: 'sunset',
    name: 'Sunset Orange',
    mode: 'dark',
    colors: {
      background: '#1a0f0a',
      foreground: '#fff4e6',
      primary: '#f59e0b',
      primaryForeground: '#1a0f0a',
      secondary: '#2e1f1a',
      card: '#1f140f',
      border: '#5f3a2a',
      accent: '#fb923c',
    },
  },
  'ocean': {
    id: 'ocean',
    name: 'Ocean Breeze',
    mode: 'light',
    colors: {
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      card: '#ffffff',
      border: '#bae6fd',
      accent: '#38bdf8',
    },
  },
  'lavender': {
    id: 'lavender',
    name: 'Lavender Dreams',
    mode: 'light',
    colors: {
      background: '#faf5ff',
      foreground: '#581c87',
      primary: '#a855f7',
      primaryForeground: '#ffffff',
      secondary: '#f3e8ff',
      card: '#ffffff',
      border: '#e9d5ff',
      accent: '#c084fc',
    },
  },
}

class ThemeManager {
  private modeKey = 'solary_theme_mode'
  private themeKey = 'solary_custom_theme'

  // Get current theme mode
  getMode(): ThemeMode {
    if (typeof window === 'undefined') return 'dark'
    const mode = localStorage.getItem(this.modeKey)
    return (mode as ThemeMode) || 'dark'
  }

  // Set theme mode
  setMode(mode: ThemeMode): void {
    localStorage.setItem(this.modeKey, mode)
    this.applyMode(mode)
  }

  // Apply theme mode to document
  private applyMode(mode: ThemeMode): void {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const effectiveMode = mode === 'system' ? this.getSystemMode() : mode

    if (effectiveMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Get system preference
  private getSystemMode(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Get current custom theme
  getCurrentTheme(): CustomTheme {
    const saved = localStorage.getItem(this.themeKey)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return PRESET_THEMES['solary-dark']
      }
    }
    return PRESET_THEMES['solary-dark']
  }

  // Set custom theme
  setTheme(theme: CustomTheme): void {
    localStorage.setItem(this.themeKey, JSON.stringify(theme))
    this.applyTheme(theme)
  }

  // Apply theme colors to CSS variables
  private applyTheme(theme: CustomTheme): void {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      root.style.setProperty(cssVar, value)
    })

    // Apply mode
    if (theme.mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // Initialize theme on app load
  initialize(): void {
    const mode = this.getMode()
    const theme = this.getCurrentTheme()

    this.applyMode(mode)
    this.applyTheme(theme)

    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.getMode() === 'system') {
          this.applyMode('system')
        }
      })
    }
  }

  // Get all available themes
  getPresetThemes(): CustomTheme[] {
    return Object.values(PRESET_THEMES)
  }

  // Get themes by mode
  getThemesByMode(mode: 'light' | 'dark'): CustomTheme[] {
    return Object.values(PRESET_THEMES).filter(t => t.mode === mode)
  }

  // Reset to default theme
  resetToDefault(): void {
    this.setTheme(PRESET_THEMES['solary-dark'])
    this.setMode('dark')
  }
}

export const themeManager = new ThemeManager()
