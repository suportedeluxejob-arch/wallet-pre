'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ArrowLeft, ArrowRight, RefreshCw, Home, Lock, AlertTriangle, ExternalLink, Star, StarOff, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'

const POPULAR_DAPPS = [
  { name: 'Jupiter', url: 'https://jup.ag', icon: '🪐', category: 'DEX' },
  { name: 'Magic Eden', url: 'https://magiceden.io', icon: '✨', category: 'NFT' },
  { name: 'Raydium', url: 'https://raydium.io', icon: '⚡', category: 'DEX' },
  { name: 'Marinade', url: 'https://marinade.finance', icon: '🥩', category: 'Staking' },
  { name: 'Orca', url: 'https://www.orca.so', icon: '🐋', category: 'DEX' },
  { name: 'Solend', url: 'https://solend.fi', icon: '💰', category: 'Lending' },
  { name: 'Tensor', url: 'https://www.tensor.trade', icon: '📊', category: 'NFT' },
  { name: 'Phoenix', url: 'https://phoenix.trade', icon: '🔥', category: 'DEX' },
]

type Bookmark = {
  url: string
  title: string
  favicon?: string
  addedAt: number
}

export function DAppBrowser() {
  const [url, setUrl] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('solary_bookmarks')
    if (stored) {
      setBookmarks(JSON.parse(stored))
    }
  }, [])

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks)
    localStorage.setItem('solary_bookmarks', JSON.stringify(newBookmarks))
  }

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`)
      return true
    } catch {
      return false
    }
  }

  const normalizeUrl = (urlString: string): string => {
    if (!urlString) return ''
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      return urlString
    }
    return `https://${urlString}`
  }

  const navigate = (targetUrl: string) => {
    if (!targetUrl) return

    const normalized = normalizeUrl(targetUrl)
    if (!isValidUrl(normalized)) {
      alert('Invalid URL')
      return
    }

    setLoading(true)
    setCurrentUrl(normalized)
    setUrl(normalized)

    // Add to history
    const newHistory = [...history.slice(0, historyIndex + 1), normalized]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    setTimeout(() => setLoading(false), 1000)
  }

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const targetUrl = history[newIndex]
      setCurrentUrl(targetUrl)
      setUrl(targetUrl)
    }
  }

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const targetUrl = history[newIndex]
      setCurrentUrl(targetUrl)
      setUrl(targetUrl)
    }
  }

  const refresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl
    }
  }

  const goHome = () => {
    setCurrentUrl('')
    setUrl('')
  }

  const isBookmarked = currentUrl && bookmarks.some((b) => b.url === currentUrl)

  const toggleBookmark = () => {
    if (!currentUrl) return

    if (isBookmarked) {
      saveBookmarks(bookmarks.filter((b) => b.url !== currentUrl))
    } else {
      const newBookmark: Bookmark = {
        url: currentUrl,
        title: new URL(currentUrl).hostname,
        addedAt: Date.now(),
      }
      saveBookmarks([...bookmarks, newBookmark])
    }
  }

  const isSecure = currentUrl.startsWith('https://')

  return (
    <div className="flex flex-col h-[600px] bg-background border rounded-lg overflow-hidden">
      {/* Browser Controls */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            disabled={historyIndex <= 0}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="h-8 w-8"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={refresh} disabled={!currentUrl} className="h-8 w-8">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={goHome} className="h-8 w-8">
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center gap-2 relative">
          {currentUrl && (
            <div className="absolute left-3 flex items-center gap-1">
              {isSecure ? (
                <Lock className="h-3 w-3 text-green-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          )}
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(url)}
            placeholder="Enter DApp URL or search..."
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBookmark}
            disabled={!currentUrl}
            className="h-8 w-8"
          >
            {isBookmarked ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="h-8 w-8"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {currentUrl && (
        <Alert className="rounded-none border-l-0 border-r-0 border-t-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You are connecting to an external DApp. Always verify the URL and never share your seed phrase.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Area */}
      <div className="flex-1 relative">
        {currentUrl ? (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="DApp Browser"
          />
        ) : showBookmarks && bookmarks.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Bookmarks</h3>
              <div className="grid grid-cols-2 gap-3">
                {bookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.url}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(bookmark.url)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{bookmark.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Popular DApps</h3>
                <div className="grid grid-cols-2 gap-3">
                  {POPULAR_DAPPS.map((dapp) => (
                    <Card
                      key={dapp.url}
                      className="p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigate(dapp.url)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                          {dapp.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{dapp.name}</h4>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {dapp.category}
                          </Badge>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Security Tips
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Always verify the URL before connecting your wallet</li>
                  <li>Never share your seed phrase or private key</li>
                  <li>Review all transaction details before signing</li>
                  <li>Only connect to DApps you trust</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
