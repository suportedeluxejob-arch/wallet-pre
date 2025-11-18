'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Download, Trash2, ExternalLink } from 'lucide-react'
import { swapHistoryService, type SwapHistoryEntry } from '@/lib/swap-history-service'

export default function SwapHistoryPanel() {
  const [history, setHistory] = useState<SwapHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = swapHistoryService.subscribe((data) => {
      setHistory(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this swap record?')) {
      swapHistoryService.deleteEntry(id)
    }
  }

  const handleExportCSV = () => {
    const csv = swapHistoryService.exportAsCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solary-swap-history-${Date.now()}.csv`
    a.click()
  }

  const handleClearHistory = () => {
    if (window.confirm('Clear all swap history? This cannot be undone.')) {
      swapHistoryService.clearHistory()
    }
  }

  if (loading) {
    return (
      <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
        <CardContent className="py-8 text-center">
          <p className="text-[#c0c0c0]">Loading history...</p>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
        <CardContent className="py-8 text-center">
          <p className="text-[#c0c0c0]">No swap history yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#f8e1f4]">Swap History</h3>
          <p className="text-xs text-[#c0c0c0]">{history.length} total swaps</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="border-[#8b005d]/30 text-[#f8e1f4]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handleClearHistory}
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {history.map((entry) => (
          <Card key={entry.id} className="bg-[#1a0a14]/50 border-[#8b005d]/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-[#2a1a24] rounded-lg">
                    {entry.status === 'confirmed' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : entry.status === 'failed' ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[#f8e1f4] font-semibold">
                      {entry.inputAmount.toFixed(4)} {entry.inputSymbol} → {entry.outputAmount.toFixed(4)} {entry.outputSymbol}
                    </p>
                    <p className="text-xs text-[#c0c0c0]">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <Badge
                      variant={
                        entry.status === 'confirmed'
                          ? 'default'
                          : entry.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className={
                        entry.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : entry.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }
                    >
                      {entry.status}
                    </Badge>
                    <p className="text-xs text-[#c0c0c0] mt-1">
                      Impact: {entry.priceImpact.toFixed(2)}%
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {entry.signature && (
                      <Button
                        onClick={() =>
                          window.open(`https://solscan.io/tx/${entry.signature}`, '_blank')
                        }
                        variant="ghost"
                        size="sm"
                        className="text-[#8b005d] hover:text-[#d4308e]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(entry.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
