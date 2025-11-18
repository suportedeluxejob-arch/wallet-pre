export type Language = 'en' | 'pt' | 'es'

export interface Translations {
  common: {
    back: string
    copy: string
    copied: string
    loading: string
    error: string
    success: string
    cancel: string
    confirm: string
    save: string
  }
  auth: {
    title: string
    subtitle: string
    createNew: string
    importExisting: string
    securityTitle: string
    securityDesc: string
    or: string
  }
  import: {
    placeholder: string
    button: string
    importing: string
    invalidSeed: string
    enterSeed: string
  }
  creation: {
    steps: {
      generate: string
      backup: string
      verify: string
      password: string
    }
    step1: {
      title: string
      desc: string
      securityTitle: string
      securityDesc: string
      button: string
      generating: string
    }
    step2: {
      title: string
      desc: string
      seedTitle: string
      copyButton: string
      savedButton: string
    }
    step3: {
      title: string
      desc: string
      wordLabel: string
      placeholder: string
      verifyButton: string
    }
    step4: {
      title: string
      desc: string
      passwordLabel: string
      passwordPlaceholder: string
      confirmLabel: string
      confirmPlaceholder: string
      createButton: string
    }
  }
  unlock: {
    title: string
    subtitle: string
    passwordLabel: string
    passwordPlaceholder: string
    unlockButton: string
    unlocking: string
    invalidPassword: string
    enterPassword: string
    noWallet: string
    useBiometrics?: string
    biometricsFailed?: string
    biometricsError?: string
  }
  dashboard: {
    title: string
    connected: string
    disconnect: string
    lock?: string
    totalBalance: string
    lastUpdated: string
    fetching: string
    tabs: {
      overview: string
      tokens: string
      nfts: string
      swap: string
      send: string
      receive: string
      history: string
      market: string
      security: string
      settings: string
      staking?: string
      contacts?: string
      analytics?: string
      theme?: string
    }
    overview: {
      addressTitle: string
      addressDesc: string
      status: string
      network: string
      securityStatus: string
      active: string
      encrypted: string
    }
    security: {
      privateKeyTitle: string
      privateKeyWarning: string
      privateKeyCopied: string
      securityStatusTitle: string
      clientEncryption: string
      serverStorage: string
      keyProtection: string
      enabled: string
      disabled: string
      autoLock?: string
      autoLockDesc?: string
      enableAutoLock?: string
      lockTimeout?: string
      minute?: string
      minutes?: string
      hour?: string
      lockingIn?: string
      biometrics?: string
      biometricsDesc?: string
      enableBiometrics?: string
      setupBiometrics?: string
      biometricsSuccess?: string
      biometricsError?: string
      transactionSecurity?: string
      transactionSecurityDesc?: string
      passwordOnSend?: string
      showBalanceOnLock?: string
    }
    settings: {
      networkTitle: string
      currentNetwork: string
      rpcEndpoint: string
    }
    theme?: {
      title: string
      currentTheme: string
      mode: string
      light: string
      dark: string
      system: string
      presetThemes: string
      customizeColors: string
      primary: string
      background: string
      foreground: string
      accent: string
      muted: string
      applyTheme: string
      resetToDefault: string
    }
  }
}
