// Transaction categorization and labeling

export interface TransactionCategory {
  id: string
  name: string
  color: string
  icon: string
}

export interface TransactionLabel {
  signature: string
  category: string
  note?: string
  tags: string[]
  createdAt: number
}

export const DEFAULT_CATEGORIES: TransactionCategory[] = [
  { id: 'income', name: 'Income', color: '#10b981', icon: 'TrendingUp' },
  { id: 'expense', name: 'Expense', color: '#ef4444', icon: 'TrendingDown' },
  { id: 'investment', name: 'Investment', color: '#3b82f6', icon: 'LineChart' },
  { id: 'trading', name: 'Trading', color: '#f59e0b', icon: 'ArrowLeftRight' },
  { id: 'nft', name: 'NFT', color: '#8b5cf6', icon: 'Image' },
  { id: 'defi', name: 'DeFi', color: '#06b6d4', icon: 'Coins' },
  { id: 'transfer', name: 'Transfer', color: '#6366f1', icon: 'Send' },
  { id: 'other', name: 'Other', color: '#64748b', icon: 'MoreHorizontal' },
]

class TransactionCategoriesManager {
  private labelsKey = 'solary_transaction_labels'
  private categoriesKey = 'solary_transaction_categories'

  // Get all categories
  getCategories(): TransactionCategory[] {
    const data = localStorage.getItem(this.categoriesKey)
    if (!data) return DEFAULT_CATEGORIES
    
    try {
      return JSON.parse(data)
    } catch {
      return DEFAULT_CATEGORIES
    }
  }

  // Add custom category
  addCategory(category: Omit<TransactionCategory, 'id'>): TransactionCategory {
    const categories = this.getCategories()
    const newCategory: TransactionCategory = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, '-'),
    }
    
    categories.push(newCategory)
    localStorage.setItem(this.categoriesKey, JSON.stringify(categories))
    
    return newCategory
  }

  // Get all labels
  getLabels(): TransactionLabel[] {
    const data = localStorage.getItem(this.labelsKey)
    if (!data) return []
    
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  // Add label to transaction
  labelTransaction(label: Omit<TransactionLabel, 'createdAt'>): TransactionLabel {
    const labels = this.getLabels()
    
    // Remove existing label for this transaction
    const filtered = labels.filter(l => l.signature !== label.signature)
    
    const newLabel: TransactionLabel = {
      ...label,
      createdAt: Date.now(),
    }
    
    filtered.push(newLabel)
    localStorage.setItem(this.labelsKey, JSON.stringify(filtered))
    
    return newLabel
  }

  // Get label for transaction
  getLabel(signature: string): TransactionLabel | null {
    const labels = this.getLabels()
    return labels.find(l => l.signature === signature) || null
  }

  // Delete label
  deleteLabel(signature: string): boolean {
    const labels = this.getLabels()
    const filtered = labels.filter(l => l.signature !== signature)
    
    if (filtered.length === labels.length) return false
    
    localStorage.setItem(this.labelsKey, JSON.stringify(filtered))
    return true
  }

  // Get transactions by category
  getByCategory(category: string): TransactionLabel[] {
    return this.getLabels().filter(l => l.category === category)
  }

  // Get transactions by tag
  getByTag(tag: string): TransactionLabel[] {
    return this.getLabels().filter(l => l.tags.includes(tag))
  }

  // Export labels
  exportLabels(): string {
    return JSON.stringify(this.getLabels(), null, 2)
  }

  // Import labels
  importLabels(jsonData: string): number {
    try {
      const imported: TransactionLabel[] = JSON.parse(jsonData)
      const existing = this.getLabels()
      
      for (const label of imported) {
        const index = existing.findIndex(l => l.signature === label.signature)
        if (index >= 0) {
          existing[index] = label
        } else {
          existing.push(label)
        }
      }
      
      localStorage.setItem(this.labelsKey, JSON.stringify(existing))
      return imported.length
    } catch {
      throw new Error('Invalid labels data')
    }
  }
}

export const transactionCategories = new TransactionCategoriesManager()
