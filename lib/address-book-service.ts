// Address book management service
export interface Contact {
  id: string
  name: string
  address: string
  network: 'mainnet' | 'devnet' | 'testnet'
  memo?: string
  tags: string[]
  favorite: boolean
  createdAt: string
  lastUsed?: string
  transactionCount: number
  avatar?: string
}

export interface ContactGroup {
  id: string
  name: string
  color: string
  contactIds: string[]
  createdAt: string
}

class AddressBookService {
  private contactsKey = 'solary_address_book'
  private groupsKey = 'solary_contact_groups'

  // Get all contacts
  getContacts(): Contact[] {
    const contacts = localStorage.getItem(this.contactsKey)
    return contacts ? JSON.parse(contacts) : []
  }

  // Get contact by ID
  getContact(id: string): Contact | null {
    const contacts = this.getContacts()
    return contacts.find(c => c.id === id) || null
  }

  // Get contact by address
  getContactByAddress(address: string): Contact | null {
    const contacts = this.getContacts()
    return contacts.find(c => c.address.toLowerCase() === address.toLowerCase()) || null
  }

  // Add new contact
  addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'transactionCount'>): Contact {
    const contacts = this.getContacts()
    
    // Check if address already exists
    const existing = this.getContactByAddress(contact.address)
    if (existing) {
      throw new Error('Contact with this address already exists')
    }

    const newContact: Contact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      transactionCount: 0,
    }

    contacts.push(newContact)
    localStorage.setItem(this.contactsKey, JSON.stringify(contacts))
    
    return newContact
  }

  // Update contact
  updateContact(id: string, updates: Partial<Contact>): Contact {
    const contacts = this.getContacts()
    const index = contacts.findIndex(c => c.id === id)
    
    if (index === -1) {
      throw new Error('Contact not found')
    }

    // Check if updating address and it already exists elsewhere
    if (updates.address && updates.address !== contacts[index].address) {
      const existing = this.getContactByAddress(updates.address)
      if (existing && existing.id !== id) {
        throw new Error('Another contact with this address already exists')
      }
    }

    contacts[index] = { ...contacts[index], ...updates }
    localStorage.setItem(this.contactsKey, JSON.stringify(contacts))
    
    return contacts[index]
  }

  // Delete contact
  deleteContact(id: string): void {
    let contacts = this.getContacts()
    contacts = contacts.filter(c => c.id !== id)
    localStorage.setItem(this.contactsKey, JSON.stringify(contacts))

    // Remove from groups
    const groups = this.getGroups()
    groups.forEach(group => {
      group.contactIds = group.contactIds.filter(cid => cid !== id)
    })
    localStorage.setItem(this.groupsKey, JSON.stringify(groups))
  }

  // Record transaction with contact
  recordTransaction(address: string): void {
    const contact = this.getContactByAddress(address)
    if (contact) {
      contact.transactionCount++
      contact.lastUsed = new Date().toISOString()
      this.updateContact(contact.id, contact)
    }
  }

  // Search contacts
  searchContacts(query: string): Contact[] {
    const contacts = this.getContacts()
    const lowerQuery = query.toLowerCase()
    
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.address.toLowerCase().includes(lowerQuery) ||
      contact.memo?.toLowerCase().includes(lowerQuery) ||
      contact.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // Get favorite contacts
  getFavorites(): Contact[] {
    return this.getContacts().filter(c => c.favorite)
  }

  // Get recently used contacts
  getRecentlyUsed(limit: number = 5): Contact[] {
    return this.getContacts()
      .filter(c => c.lastUsed)
      .sort((a, b) => {
        const dateA = new Date(a.lastUsed!).getTime()
        const dateB = new Date(b.lastUsed!).getTime()
        return dateB - dateA
      })
      .slice(0, limit)
  }

  // Get most used contacts
  getMostUsed(limit: number = 5): Contact[] {
    return this.getContacts()
      .filter(c => c.transactionCount > 0)
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, limit)
  }

  // Groups management
  getGroups(): ContactGroup[] {
    const groups = localStorage.getItem(this.groupsKey)
    return groups ? JSON.parse(groups) : []
  }

  getGroup(id: string): ContactGroup | null {
    const groups = this.getGroups()
    return groups.find(g => g.id === id) || null
  }

  addGroup(name: string, color: string): ContactGroup {
    const groups = this.getGroups()
    
    const newGroup: ContactGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      contactIds: [],
      createdAt: new Date().toISOString(),
    }

    groups.push(newGroup)
    localStorage.setItem(this.groupsKey, JSON.stringify(groups))
    
    return newGroup
  }

  updateGroup(id: string, updates: Partial<ContactGroup>): ContactGroup {
    const groups = this.getGroups()
    const index = groups.findIndex(g => g.id === id)
    
    if (index === -1) {
      throw new Error('Group not found')
    }

    groups[index] = { ...groups[index], ...updates }
    localStorage.setItem(this.groupsKey, JSON.stringify(groups))
    
    return groups[index]
  }

  deleteGroup(id: string): void {
    let groups = this.getGroups()
    groups = groups.filter(g => g.id !== id)
    localStorage.setItem(this.groupsKey, JSON.stringify(groups))
  }

  addContactToGroup(contactId: string, groupId: string): void {
    const group = this.getGroup(groupId)
    if (!group) throw new Error('Group not found')

    if (!group.contactIds.includes(contactId)) {
      group.contactIds.push(contactId)
      this.updateGroup(groupId, group)
    }
  }

  removeContactFromGroup(contactId: string, groupId: string): void {
    const group = this.getGroup(groupId)
    if (!group) throw new Error('Group not found')

    group.contactIds = group.contactIds.filter(id => id !== contactId)
    this.updateGroup(groupId, group)
  }

  getContactsByGroup(groupId: string): Contact[] {
    const group = this.getGroup(groupId)
    if (!group) return []

    const contacts = this.getContacts()
    return contacts.filter(c => group.contactIds.includes(c.id))
  }

  // Validate Solana address
  isValidSolanaAddress(address: string): boolean {
    try {
      // Basic validation for Solana address (base58, 32-44 characters)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      return base58Regex.test(address)
    } catch {
      return false
    }
  }

  // Export contacts (for backup)
  exportContacts(): string {
    const data = {
      contacts: this.getContacts(),
      groups: this.getGroups(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
    return JSON.stringify(data, null, 2)
  }

  // Import contacts (from backup)
  importContacts(jsonData: string): { contacts: number; groups: number } {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.version !== '1.0') {
        throw new Error('Unsupported backup version')
      }

      const currentContacts = this.getContacts()
      const currentGroups = this.getGroups()

      // Merge contacts (avoid duplicates by address)
      const newContacts = [...currentContacts]
      let importedContacts = 0

      data.contacts.forEach((contact: Contact) => {
        if (!this.getContactByAddress(contact.address)) {
          newContacts.push(contact)
          importedContacts++
        }
      })

      // Merge groups
      const newGroups = [...currentGroups, ...data.groups]
      
      localStorage.setItem(this.contactsKey, JSON.stringify(newContacts))
      localStorage.setItem(this.groupsKey, JSON.stringify(newGroups))

      return {
        contacts: importedContacts,
        groups: data.groups.length,
      }
    } catch (error) {
      throw new Error('Invalid backup file')
    }
  }

  // Clear all data
  clearAll(): void {
    localStorage.removeItem(this.contactsKey)
    localStorage.removeItem(this.groupsKey)
  }

  // Get statistics
  getStats() {
    const contacts = this.getContacts()
    const groups = this.getGroups()

    return {
      totalContacts: contacts.length,
      totalGroups: groups.length,
      favoriteContacts: contacts.filter(c => c.favorite).length,
      contactsWithTransactions: contacts.filter(c => c.transactionCount > 0).length,
      totalTransactions: contacts.reduce((sum, c) => sum + c.transactionCount, 0),
    }
  }
}

export const addressBookService = new AddressBookService()
