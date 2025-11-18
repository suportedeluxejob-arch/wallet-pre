'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Download, FileText, Calendar } from 'lucide-react'
import { Transaction } from '@/lib/wallet-utils'
import { transactionExporter, ExportOptions } from '@/lib/transaction-export'

interface TransactionExportProps {
  transactions: Transaction[]
  walletAddress: string
}

export default function TransactionExport({ transactions, walletAddress }: TransactionExportProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [includeCategories, setIncludeCategories] = useState(true)
  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d' | 'custom'>('all')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    
    try {
      let startDate: number | undefined
      let endDate: number | undefined
      const now = Date.now()
      
      if (dateRange === '30d') {
        startDate = now - 30 * 24 * 60 * 60 * 1000
      } else if (dateRange === '90d') {
        startDate = now - 90 * 24 * 60 * 60 * 1000
      }
      
      const options: ExportOptions = {
        format,
        includeCategories,
        startDate,
        endDate,
      }
      
      const content = await transactionExporter.exportTransactions(transactions, options)
      const filename = transactionExporter.generateFilename(format, walletAddress)
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json'
      
      transactionExporter.downloadFile(content, filename, mimeType)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-[#f8e1f4] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#8b005d]" />
          Export Transactions
        </CardTitle>
        <CardDescription className="text-[#c0c0c0]">
          Download your transaction history for tax reporting or analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#c0c0c0]">Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="json">JSON (Data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[#c0c0c0]">Date Range</Label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0b0b0b]/70 rounded-lg border border-[#3a2a34]">
            <div className="flex-1">
              <Label htmlFor="include-categories" className="text-[#f8e1f4] font-semibold cursor-pointer">
                Include Categories & Notes
              </Label>
              <p className="text-xs text-[#c0c0c0] mt-1">
                Add custom labels and notes to export
              </p>
            </div>
            <Switch
              id="include-categories"
              checked={includeCategories}
              onCheckedChange={setIncludeCategories}
            />
          </div>
        </div>

        <div className="p-4 bg-[#8b005d]/10 border border-[#8b005d]/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-[#8b005d]">
            <Calendar className="w-4 h-4" />
            <p className="text-sm font-semibold">Export Preview</p>
          </div>
          <p className="text-xs text-[#c0c0c0]">
            {transactions.length} transactions will be exported
          </p>
          <p className="text-xs text-[#c0c0c0]">
            Format: {format.toUpperCase()}
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting || transactions.length === 0}
          className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
        >
          {exporting ? (
            <>Exporting...</>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export Transactions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
