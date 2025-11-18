// Address book management for saved contacts

export interface Contact {
  id: string
  name: string
  address: string
  note?: string
  category?: 'personal' | 'business' | 'exchange' | 'other'
  isFavorite: boolean
  createdAt: number
  lastUsed?: number
}

class AddressBookManager {
  private storageKey = 'solary_address_book'

  // Get all contacts
  getContacts(): Contact[] {
    const data = localStorage.getItem(this.storageKey)
    if (!data) return []
    
    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  // Add new contact
  addContact(contact: Omit<Contact, 'id' | 'createdAt'>): Contact {
    const contacts = this.getContacts()
    
    // Check if address already exists
    if (contacts.some(c => c.address === contact.address)) {
      throw new Error('Contact with this address already exists')
    }
    
    const newContact: Contact = {
      ...contact,
      id: this.generateId(),
      createdAt: Date.now(),
    }
    
    contacts.push(newContact)
    localStorage.setItem(this.storageKey, JSON.stringify(contacts))
    
    return newContact
  }

  // Update contact
  updateContact(id: string, updates: Partial<Contact>): Contact | null {
    const contacts = this.getContacts()
    const index = contacts.findIndex(c => c.id === id)
    
    if (index === -1) return null
    
    contacts[index] = { ...contacts[index], ...updates }
    localStorage.setItem(this.storageKey, JSON.stringify(contacts))
    
    return contacts[index]
  }

  // Delete contact
  deleteContact(id: string): boolean {
    const contacts = this.getContacts()
    const filtered = contacts.filter(c => c.id !== id)
    
    if (filtered.length === contacts.length) return false
    
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    return true
  }

  // Get contact by address
  getContactByAddress(address: string): Contact | null {
    const contacts = this.getContacts()
    return contacts.find(c => c.address === address) || null
  }

  // Search contacts
  searchContacts(query: string): Contact[] {
    const contacts = this.getContacts()
    const lowerQuery = query.toLowerCase()
    
    return contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.address.toLowerCase().includes(lowerQuery) ||
      c.note?.toLowerCase().includes(lowerQuery)
    )
  }

  // Get favorites
  getFavorites(): Contact[] {
    return this.getContacts().filter(c => c.isFavorite)
  }

  // Update last used timestamp
  markAsUsed(address: string): void {
    const contacts = this.getContacts()
    const contact = contacts.find(c => c.address === address)
    
    if (contact) {
      contact.lastUsed = Date.now()
      localStorage.setItem(this.storageKey, JSON.stringify(contacts))
    }
  }

  // Export contacts as JSON
  exportContacts(): string {
    return JSON.stringify(this.getContacts(), null, 2)
  }

  // Import contacts from JSON
  importContacts(jsonData: string): number {
    try {
      const imported: Contact[] = JSON.parse(jsonData)
      const existing = this.getContacts()
      
      let addedCount = 0
      for (const contact of imported) {
        if (!existing.some(c => c.address === contact.address)) {
          existing.push({
            ...contact,
            id: this.generateId(),
            createdAt: Date.now(),
          })
          addedCount++
        }
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(existing))
      return addedCount
    } catch {
      throw new Error('Invalid contacts data')
    }
  }

  private generateId(): string {
    return `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const addressBook = new AddressBookManager()
