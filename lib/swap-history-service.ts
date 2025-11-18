// Swap History Service for persisting and managing swap transactions

export interface SwapHistoryEntry {
  id: string
  timestamp: number
  inputMint: string
  inputSymbol: string
  inputAmount: number
  outputMint: string
  outputSymbol: string
  outputAmount: number
  slippage: number
  priceImpact: number
  platformFee: number
  status: 'pending' | 'confirmed' | 'failed'
  signature?: string
  error?: string
  routePlan?: any[]
}

class SwapHistoryService {
  private historyKey = 'solary_swap_history'
  private listeners: Set<(history: SwapHistoryEntry[]) => void> = new Set()

  constructor() {
    this.loadHistory()
  }

  private loadHistory() {
    const stored = localStorage.getItem(this.historyKey)
    if (stored) {
      try {
        JSON.parse(stored)
      } catch (error) {
        console.error('Error parsing swap history:', error)
        localStorage.removeItem(this.historyKey)
      }
    }
  }

  subscribe(listener: (history: SwapHistoryEntry[]) => void) {
    this.listeners.add(listener)
    listener(this.getHistory())
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const history = this.getHistory()
    this.listeners.forEach((listener) => listener(history))
  }

  addEntry(entry: Omit<SwapHistoryEntry, 'id' | 'timestamp'>): SwapHistoryEntry {
    const history = this.getHistory()
    
    const newEntry: SwapHistoryEntry = {
      id: `swap_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      ...entry,
    }

    history.unshift(newEntry)

    // Keep only last 100 entries
    if (history.length > 100) {
      history.splice(100)
    }

    localStorage.setItem(this.historyKey, JSON.stringify(history))
    this.notifyListeners()

    return newEntry
  }

  updateEntry(id: string, updates: Partial<SwapHistoryEntry>) {
    const history = this.getHistory()
    const entry = history.find((e) => e.id === id)
    
    if (entry) {
      Object.assign(entry, updates)
      localStorage.setItem(this.historyKey, JSON.stringify(history))
      this.notifyListeners()
    }
  }

  getHistory(): SwapHistoryEntry[] {
    const stored = localStorage.getItem(this.historyKey)
    return stored ? JSON.parse(stored) : []
  }

  getById(id: string): SwapHistoryEntry | undefined {
    return this.getHistory().find((e) => e.id === id)
  }

  deleteEntry(id: string) {
    const history = this.getHistory().filter((e) => e.id !== id)
    localStorage.setItem(this.historyKey, JSON.stringify(history))
    this.notifyListeners()
  }

  clearHistory() {
    localStorage.removeItem(this.historyKey)
    this.notifyListeners()
  }

  getRecentSwaps(limit: number = 10): SwapHistoryEntry[] {
    return this.getHistory().slice(0, limit)
  }

  getSwapsByToken(tokenMint: string): SwapHistoryEntry[] {
    return this.getHistory().filter(
      (e) => e.inputMint === tokenMint || e.outputMint === tokenMint
    )
  }

  exportAsCSV(): string {
    const history = this.getHistory()
    const headers = [
      'Date',
      'From',
      'From Amount',
      'To',
      'To Amount',
      'Price Impact',
      'Platform Fee',
      'Status',
      'Signature',
    ]

    const rows = history.map((entry) => [
      new Date(entry.timestamp).toLocaleString(),
      entry.inputSymbol,
      entry.inputAmount.toString(),
      entry.outputSymbol,
      entry.outputAmount.toString(),
      entry.priceImpact.toFixed(2) + '%',
      entry.platformFee.toString(),
      entry.status,
      entry.signature || 'N/A',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    return csv
  }
}

export const swapHistoryService = new SwapHistoryService()
