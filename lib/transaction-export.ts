// Export transaction history for tax reporting

import { Transaction } from './wallet-utils'
import { transactionCategories } from './transaction-categories'

export interface ExportOptions {
  format: 'csv' | 'json'
  includeCategories: boolean
  startDate?: number
  endDate?: number
}

class TransactionExporter {
  // Export transactions
  async exportTransactions(
    transactions: Transaction[],
    options: ExportOptions
  ): Promise<string> {
    let filtered = transactions
    
    // Filter by date range
    if (options.startDate) {
      filtered = filtered.filter(tx => tx.timestamp >= options.startDate!)
    }
    if (options.endDate) {
      filtered = filtered.filter(tx => tx.timestamp <= options.endDate!)
    }
    
    if (options.format === 'csv') {
      return this.exportToCSV(filtered, options.includeCategories)
    } else {
      return this.exportToJSON(filtered, options.includeCategories)
    }
  }

  // Export to CSV
  private exportToCSV(transactions: Transaction[], includeCategories: boolean): string {
    const headers = [
      'Signature',
      'Date',
      'Type',
      'Amount (SOL)',
      'From',
      'To',
      'Status',
      'Fee (SOL)',
    ]
    
    if (includeCategories) {
      headers.push('Category', 'Tags', 'Note')
    }
    
    const rows = transactions.map(tx => {
      const date = new Date(tx.timestamp).toISOString()
      const row = [
        tx.signature,
        date,
        tx.type,
        tx.amount.toFixed(9),
        tx.from,
        tx.to,
        tx.status,
        (tx.fee || 0).toFixed(9),
      ]
      
      if (includeCategories) {
        const label = transactionCategories.getLabel(tx.signature)
        row.push(
          label?.category || '',
          label?.tags.join(';') || '',
          label?.note || ''
        )
      }
      
      return row.map(cell => `"${cell}"`).join(',')
    })
    
    return [headers.join(','), ...rows].join('\n')
  }

  // Export to JSON
  private exportToJSON(transactions: Transaction[], includeCategories: boolean): string {
    const data = transactions.map(tx => {
      const item: any = {
        ...tx,
        date: new Date(tx.timestamp).toISOString(),
      }
      
      if (includeCategories) {
        const label = transactionCategories.getLabel(tx.signature)
        if (label) {
          item.category = label.category
          item.tags = label.tags
          item.note = label.note
        }
      }
      
      return item
    })
    
    return JSON.stringify(data, null, 2)
  }

  // Download file
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Generate filename
  generateFilename(format: 'csv' | 'json', walletAddress: string): string {
    const date = new Date().toISOString().split('T')[0]
    const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    return `solary-transactions-${shortAddress}-${date}.${format}`
  }
}

export const transactionExporter = new TransactionExporter()
