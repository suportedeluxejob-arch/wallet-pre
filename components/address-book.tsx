'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BookUser, Plus, Trash2, Edit2, Star, Search, Copy, CheckCircle2 } from 'lucide-react'
import { addressBook, Contact } from '@/lib/address-book'
import { isValidSolanaAddress } from '@/lib/wallet-utils'

interface AddressBookProps {
  onSelectContact?: (address: string) => void
}

export default function AddressBook({ onSelectContact }: AddressBookProps) {
  const [contacts, setContacts] = useState<Contact[]>(addressBook.getContacts())
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    note: '',
    category: 'personal' as 'personal' | 'business' | 'exchange' | 'other',
    isFavorite: false,
  })
  const [formError, setFormError] = useState('')

  const refreshContacts = () => {
    setContacts(addressBook.getContacts())
  }

  const handleAddContact = () => {
    setFormError('')
    
    if (!formData.name || !formData.address) {
      setFormError('Name and address are required')
      return
    }
    
    if (!isValidSolanaAddress(formData.address)) {
      setFormError('Invalid Solana address')
      return
    }
    
    try {
      if (editingContact) {
        addressBook.updateContact(editingContact.id, formData)
        setEditingContact(null)
      } else {
        addressBook.addContact(formData)
      }
      
      refreshContacts()
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: any) {
      setFormError(error.message)
    }
  }

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      addressBook.deleteContact(id)
      refreshContacts()
    }
  }

  const handleToggleFavorite = (contact: Contact) => {
    addressBook.updateContact(contact.id, { isFavorite: !contact.isFavorite })
    refreshContacts()
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      address: contact.address,
      note: contact.note || '',
      category: contact.category || 'personal',
      isFavorite: contact.isFavorite,
    })
    setIsAddDialogOpen(true)
  }

  const handleCopyAddress = (contact: Contact) => {
    navigator.clipboard.writeText(contact.address)
    setCopiedId(contact.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      note: '',
      category: 'personal',
      isFavorite: false,
    })
    setFormError('')
  }

  const filteredContacts = searchQuery
    ? addressBook.searchContacts(searchQuery)
    : contacts

  const favorites = filteredContacts.filter(c => c.isFavorite)
  const regular = filteredContacts.filter(c => !c.isFavorite)

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#f8e1f4] flex items-center gap-2">
              <BookUser className="w-5 h-5 text-[#8b005d]" />
              Address Book
            </CardTitle>
            <CardDescription className="text-[#c0c0c0]">Manage your saved contacts</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              resetForm()
              setEditingContact(null)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]">
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a0a14] border-[#3a2a34]">
              <DialogHeader>
                <DialogTitle className="text-[#f8e1f4]">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </DialogTitle>
                <DialogDescription className="text-[#c0c0c0]">
                  {editingContact ? 'Update contact information' : 'Save a new contact to your address book'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {formError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-[#c0c0c0]">Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c0c0c0]">Address</Label>
                  <Input
                    placeholder="Solana address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                    disabled={!!editingContact}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c0c0c0]">Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="exchange">Exchange</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c0c0c0]">Note (Optional)</Label>
                  <Input
                    placeholder="Add a note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                  />
                </div>

                <Button onClick={handleAddContact} className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]">
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#c0c0c0]" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0b0b0b]/70 border-[#3a2a34] text-[#f8e1f4]"
          />
        </div>

        {favorites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#8b005d] uppercase">Favorites</p>
            {favorites.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onSelect={onSelectContact}
                onDelete={handleDeleteContact}
                onEdit={handleEditContact}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopyAddress}
                isCopied={copiedId === contact.id}
              />
            ))}
          </div>
        )}

        {regular.length > 0 && (
          <div className="space-y-2">
            {favorites.length > 0 && <p className="text-xs font-semibold text-[#c0c0c0] uppercase">All Contacts</p>}
            {regular.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onSelect={onSelectContact}
                onDelete={handleDeleteContact}
                onEdit={handleEditContact}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopyAddress}
                isCopied={copiedId === contact.id}
              />
            ))}
          </div>
        )}

        {filteredContacts.length === 0 && (
          <div className="text-center py-8 text-[#c0c0c0]">
            <BookUser className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No contacts found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ContactCard({
  contact,
  onSelect,
  onDelete,
  onEdit,
  onToggleFavorite,
  onCopy,
  isCopied,
}: {
  contact: Contact
  onSelect?: (address: string) => void
  onDelete: (id: string) => void
  onEdit: (contact: Contact) => void
  onToggleFavorite: (contact: Contact) => void
  onCopy: (contact: Contact) => void
  isCopied: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-lg hover:border-[#8b005d]/50 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[#f8e1f4] text-sm">{contact.name}</p>
          <span className="px-2 py-0.5 bg-[#8b005d]/20 text-[#8b005d] text-xs rounded capitalize">
            {contact.category}
          </span>
        </div>
        <p className="text-xs text-[#c0c0c0] font-mono truncate">{contact.address}</p>
        {contact.note && <p className="text-xs text-[#c0c0c0]/70 mt-1">{contact.note}</p>}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleFavorite(contact)}
          className={`p-2 rounded-lg transition-colors ${
            contact.isFavorite ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-[#c0c0c0] hover:bg-[#2a1a24]'
          }`}
        >
          <Star className="w-4 h-4" fill={contact.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => onCopy(contact)}
          className="p-2 text-[#c0c0c0] hover:bg-[#2a1a24] rounded-lg transition-colors"
        >
          {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
        {onSelect && (
          <button
            onClick={() => onSelect(contact.address)}
            className="px-3 py-1 bg-[#8b005d]/20 text-[#8b005d] hover:bg-[#8b005d]/30 rounded-lg text-xs font-semibold transition-colors"
          >
            Use
          </button>
        )}
        <button
          onClick={() => onEdit(contact)}
          className="p-2 text-[#c0c0c0] hover:bg-[#2a1a24] rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
