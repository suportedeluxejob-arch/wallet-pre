'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, LogOut, Eye, EyeOff, Lock, TrendingUp, RefreshCw, Shield, CheckCircle2, Globe } from 'lucide-react'
import { getBalance } from '@/lib/wallet-utils'
import { useSOLPrice } from '@/hooks/use-sol-price'
import WalletExportImport from './wallet-export-import'
import SendTransaction from './send-transaction'
import TransactionHistory from './transaction-history'
import TokenList from './token-list'
import SendToken from './send-token'
import NetworkSwitcher from './network-switcher'
import AccountManager from './account-manager'
import ReceiveQR from './receive-qr'
import SOLPriceDisplay from './sol-price-display'
import MarketDashboard from './market-dashboard'
import NFTGallery from './nft-gallery'
import TokenSwap from './token-swap'
import SecuritySettings from './security-settings'
import WalletLockScreen from './wallet-lock-screen'
import { useLanguage } from '@/contexts/language-context'
import LanguageSwitcher from './language-switcher'
import ThemeToggle from './theme-toggle'
import ThemeCustomizationPanel from './theme-customization-panel'
import StakingPanel from './staking-panel'
import AddressBookPanel from './address-book-panel'
import PortfolioAnalyticsPanel from './portfolio-analytics-panel'
import { DAppBrowser } from './dapp-browser'
import { DAppRequestHandler } from './dapp-request-handler'
import { NotificationPanel } from './notification-panel'
import { useSecurity } from '@/hooks/use-security'
import { securityManager } from '@/lib/security-enhanced'
import FeeConfigurationPanel from './fee-configuration-panel'
import RealTimeDashboard from './real-time-dashboard'
import type { SPLToken, NetworkType, WalletAccount } from '@/lib/wallet-utils'

interface WalletDashboardProps {
  wallet: WalletAccount
  onReset: () => void
}

const NETWORK_ENDPOINTS = {
  mainnet: 'api.mainnet-beta.solana.com',
  devnet: 'api.devnet.solana.com',
  testnet: 'api.testnet.solana.com'
}

export default function WalletDashboard({ wallet: initialWallet, onReset }: WalletDashboardProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddress, setShowAddress] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'nfts' | 'swap' | 'send' | 'receive' | 'history' | 'market' | 'staking' | 'contacts' | 'analytics' | 'security' | 'theme' | 'settings' | 'browser' | 'fees' | 'monitor'>('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copyState, setCopyState] = useState<'address' | 'privatekey' | null>(null)
  const [selectedToken, setSelectedToken] = useState<SPLToken | null>(null)
  const [network, setNetwork] = useState<NetworkType>('mainnet')
  const [accounts, setAccounts] = useState<WalletAccount[]>([initialWallet])
  const [currentAccount, setCurrentAccount] = useState<WalletAccount>(initialWallet)
  const [tokens, setTokens] = useState<any[]>([])
  const { solPrice } = useSOLPrice()
  const { t } = useLanguage()
  
  const { isLocked, session } = useSecurity()
  const [showLockScreen, setShowLockScreen] = useState(false)

  useEffect(() => {
    securityManager.createSession(currentAccount.publicKey)
    return () => {
      securityManager.destroySession()
    }
  }, [currentAccount.publicKey])

  useEffect(() => {
    setShowLockScreen(isLocked)
  }, [isLocked])

  const handleUnlock = () => {
    setShowLockScreen(false)
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentAccount.publicKey)
    setCopyState('address')
    setTimeout(() => setCopyState(null), 2000)
  }

  const handleCopyPrivateKey = () => {
    const privateKeyHex = Array.from(currentAccount.privateKey)
      .map((byte: number) => byte.toString(16).padStart(2, '0'))
      .join('')
    navigator.clipboard.writeText(privateKeyHex)
    setCopyState('privatekey')
    setTimeout(() => setCopyState(null), 2000)
  }

  const handleSendToken = (token: SPLToken) => {
    setSelectedToken(token)
    setActiveTab('send')
  }

  const handleBackFromTokenSend = () => {
    setSelectedToken(null)
    setActiveTab('tokens')
  }

  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork)
  }

  const handleAccountSwitch = (account: WalletAccount) => {
    setCurrentAccount(account)
  }

  const handleAccountAdd = (account: WalletAccount) => {
    setAccounts([...accounts, account])
  }

  const loadBalance = async () => {
    try {
      setRefreshing(true)
      const bal = await getBalance(currentAccount.publicKey, network)
      setBalance(bal)
    } catch (error) {
      console.error('Error loading balance:', error)
      setBalance(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const displayAddress = showAddress 
    ? currentAccount.publicKey 
    : currentAccount.publicKey.slice(0, 6) + '...' + currentAccount.publicKey.slice(-6)

  const displayPrivateKey = showPrivateKey
    ? Array.from(currentAccount.privateKey).slice(0, 16).map((byte: number) => byte.toString(16).padStart(2, '0')).join('') + '...'
    : '••••••••••••••••••••••••••••••••'

  if (showLockScreen) {
    return <WalletLockScreen onUnlock={handleUnlock} walletAddress={currentAccount.publicKey} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4 md:p-8">
      <DAppRequestHandler />
      
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>{t.dashboard.title}</h1>
              <p className="text-xs text-muted-foreground">{t.dashboard.connected}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationPanel />
            <ThemeToggle />
            <LanguageSwitcher />
            <NetworkSwitcher 
              currentNetwork={network} 
              onNetworkChange={handleNetworkChange} 
            />
            <Button
              onClick={() => securityManager.lockWallet()}
              className="rounded-xl"
              variant="outline"
            >
              <Lock className="w-4 h-4 mr-2" />
              {t.dashboard.lock || 'Lock'}
            </Button>
            <Button
              onClick={onReset}
              className="rounded-xl"
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.dashboard.disconnect}
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-muted-foreground text-sm font-medium">{t.dashboard.totalBalance}</CardTitle>
                <Button
                  onClick={loadBalance}
                  disabled={refreshing}
                  className="w-8 h-8 p-0"
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  {loading ? '-' : balance?.toFixed(4)}
                </span>
                <span className="text-3xl text-muted-foreground font-semibold">SOL</span>
              </div>
              {solPrice && (
                <div className="text-sm text-muted-foreground">
                  ≈ ${(balance! * solPrice.price).toFixed(2)}
                </div>
              )}
              {loading && (
                <p className="text-muted-foreground text-sm animate-pulse">{t.dashboard.fetching}</p>
              )}
              {!loading && (
                <p className="text-muted-foreground text-sm">{t.dashboard.lastUpdated}</p>
              )}
            </CardContent>
          </Card>

          <SOLPriceDisplay />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-card/50 p-1 rounded-xl border border-border overflow-x-auto">
          {(['overview', 'tokens', 'nfts', 'swap', 'send', 'receive', 'history', 'market', 'staking', 'contacts', 'analytics', 'security', 'theme', 'browser', 'fees', 'monitor', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab !== 'send') setSelectedToken(null)
              }}
              className={`px-4 py-3 rounded-lg font-semibold transition-all capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'nfts' ? 'NFTs' : tab === 'fees' ? 'Fees' : tab === 'monitor' ? 'Monitor' : t.dashboard.tabs?.[tab] || tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground" style={{ fontFamily: 'Poppins' }}>{t.dashboard.overview.addressTitle}</CardTitle>
                <CardDescription className="text-muted-foreground">{t.dashboard.overview.addressDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 bg-background/70 border border-border rounded-xl p-4 group hover:border-primary/50 transition-all">
                  <code className="flex-1 text-sm font-mono text-primary break-all">
                    {displayAddress}
                  </code>
                  <button
                    onClick={() => setShowAddress(!showAddress)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                    title={showAddress ? 'Hide' : 'Show'}
                  >
                    {showAddress ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={handleCopyAddress}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"
                  >
                    {copyState === 'address' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {copyState === 'address' && (
                  <p className="text-xs text-green-400 font-semibold">{t.common.copied}</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.dashboard.overview.status}</p>
                  <p className="text-sm font-semibold text-foreground">{t.dashboard.overview.active}</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.dashboard.overview.network}</p>
                  <p className="text-sm font-semibold text-foreground capitalize">{network}</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 backdrop-blur-sm">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.dashboard.overview.securityStatus}</p>
                  <p className="text-sm font-semibold text-foreground">{t.dashboard.overview.encrypted}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <TokenList 
            publicKey={currentAccount.publicKey} 
            network={network}
            onSendToken={handleSendToken} 
          />
        )}

        {activeTab === 'nfts' && (
          <NFTGallery publicKey={currentAccount.publicKey} network={network} />
        )}

        {activeTab === 'swap' && (
          <TokenSwap 
            wallet={currentAccount}
            tokens={tokens} 
          />
        )}

        {activeTab === 'send' && (
          <>
            {selectedToken ? (
              <SendToken
                wallet={currentAccount}
                token={selectedToken}
                onBack={handleBackFromTokenSend}
                onSuccess={loadBalance}
              />
            ) : (
              <SendTransaction wallet={currentAccount} onSuccess={loadBalance} />
            )}
          </>
        )}

        {activeTab === 'receive' && (
          <ReceiveQR publicKey={currentAccount.publicKey} />
        )}

        {activeTab === 'history' && (
          <TransactionHistory publicKey={currentAccount.publicKey} />
        )}

        {activeTab === 'market' && (
          <MarketDashboard />
        )}

        {activeTab === 'staking' && (
          <StakingPanel wallet={currentAccount} network={network} />
        )}

        {activeTab === 'contacts' && (
          <AddressBookPanel />
        )}

        {activeTab === 'analytics' && (
          <PortfolioAnalyticsPanel 
            wallet={currentAccount}
            balance={balance || 0}
            tokens={tokens}
            solPrice={solPrice?.price || 0}
          />
        )}

        {activeTab === 'security' && (
          <SecuritySettings walletAddress={currentAccount.publicKey} />
        )}

        {activeTab === 'theme' && (
          <ThemeCustomizationPanel />
        )}

        {activeTab === 'browser' && (
          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                DApp Browser
              </CardTitle>
              <CardDescription>
                Navigate and interact with decentralized applications securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DAppBrowser />
            </CardContent>
          </Card>
        )}

        {activeTab === 'fees' && (
          <FeeConfigurationPanel />
        )}

        {activeTab === 'monitor' && (
          <RealTimeDashboard 
            walletAddress={currentAccount.publicKey}
            network={network}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <AccountManager
              accounts={accounts}
              currentAccount={currentAccount}
              onAccountSwitch={handleAccountSwitch}
              onAccountAdd={handleAccountAdd}
            />

            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground" style={{ fontFamily: 'Poppins' }}>{t.dashboard.settings.networkTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-background/70 rounded-lg border border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">{t.dashboard.settings.currentNetwork}</p>
                  <p className="text-xs text-muted-foreground">Solana {network.charAt(0).toUpperCase() + network.slice(1)}</p>
                </div>

                <div className="p-4 bg-background/70 rounded-lg border border-border">
                  <p className="text-sm font-semibold text-foreground mb-2">{t.dashboard.settings.rpcEndpoint}</p>
                  <p className="text-xs text-muted-foreground break-all">{NETWORK_ENDPOINTS[network]}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
