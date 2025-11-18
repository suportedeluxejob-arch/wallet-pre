'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, Plus, Search, Star, Edit, Trash2, Download, Upload, UserPlus, Tag, Clock, TrendingUp, Folder, FolderPlus } from 'lucide-react'
import { addressBookService, Contact, ContactGroup } from '@/lib/address-book-service'
import { useLanguage } from '@/contexts/language-context'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

export default function AddressBookPanel() {
  const { t } = useLanguage()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formMemo, setFormMemo] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formFavorite, setFormFavorite] = useState(false)
  const [formNetwork, setFormNetwork] = useState<'mainnet' | 'devnet' | 'testnet'>('mainnet')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setContacts(addressBookService.getContacts())
    setGroups(addressBookService.getGroups())
  }

  const filteredContacts = searchQuery
    ? addressBookService.searchContacts(searchQuery)
    : contacts

  const resetForm = () => {
    setFormName('')
    setFormAddress('')
    setFormMemo('')
    setFormTags('')
    setFormFavorite(false)
    setFormNetwork('mainnet')
  }

  const handleAddContact = () => {
    try {
      setError('')
      setSuccess('')

      if (!formName || !formAddress) {
        setError('Name and address are required')
        return
      }

      if (!addressBookService.isValidSolanaAddress(formAddress)) {
        setError('Invalid Solana address')
        return
      }

      const tags = formTags.split(',').map(t => t.trim()).filter(t => t)

      addressBookService.addContact({
        name: formName,
        address: formAddress,
        network: formNetwork,
        memo: formMemo,
        tags,
        favorite: formFavorite,
      })

      setSuccess('Contact added successfully')
      setShowAddDialog(false)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to add contact')
    }
  }

  const handleEditContact = () => {
    if (!editingContact) return

    try {
      setError('')
      setSuccess('')

      if (!formName || !formAddress) {
        setError('Name and address are required')
        return
      }

      if (!addressBookService.isValidSolanaAddress(formAddress)) {
        setError('Invalid Solana address')
        return
      }

      const tags = formTags.split(',').map(t => t.trim()).filter(t => t)

      addressBookService.updateContact(editingContact.id, {
        name: formName,
        address: formAddress,
        network: formNetwork,
        memo: formMemo,
        tags,
        favorite: formFavorite,
      })

      setSuccess('Contact updated successfully')
      setShowEditDialog(false)
      setEditingContact(null)
      resetForm()
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to update contact')
    }
  }

  const handleDeleteContact = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      addressBookService.deleteContact(id)
      setSuccess('Contact deleted successfully')
      loadData()
    }
  }

  const handleToggleFavorite = (contact: Contact) => {
    addressBookService.updateContact(contact.id, { favorite: !contact.favorite })
    loadData()
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormName(contact.name)
    setFormAddress(contact.address)
    setFormMemo(contact.memo || '')
    setFormTags(contact.tags.join(', '))
    setFormFavorite(contact.favorite)
    setFormNetwork(contact.network)
    setShowEditDialog(true)
  }

  const handleExport = () => {
    const data = addressBookService.exportContacts()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `solary-contacts-${Date.now()}.json`
    a.click()
    setSuccess('Contacts exported successfully')
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string
        const result = addressBookService.importContacts(data)
        setSuccess(`Imported ${result.contacts} contacts and ${result.groups} groups`)
        loadData()
      } catch (err: any) {
        setError(err.message || 'Failed to import contacts')
      }
    }
    reader.readAsText(file)
  }

  const stats = addressBookService.getStats()
  const favorites = addressBookService.getFavorites()
  const recentlyUsed = addressBookService.getRecentlyUsed()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#d4308e]" />
              <div>
                <p className="text-2xl font-bold text-[#f8e1f4]">{stats.totalContacts}</p>
                <p className="text-xs text-[#c0c0c0]">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-[#f8e1f4]">{stats.favoriteContacts}</p>
                <p className="text-xs text-[#c0c0c0]">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-[#f8e1f4]">{stats.totalGroups}</p>
                <p className="text-xs text-[#c0c0c0]">Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-[#f8e1f4]">{stats.totalTransactions}</p>
                <p className="text-xs text-[#c0c0c0]">Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-500/10 border-green-500/30">
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c0c0c0]" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
          />
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
        <Button
          onClick={handleExport}
          variant="outline"
          className="border-[#8b005d]/30 text-[#f8e1f4]"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          onClick={() => document.getElementById('import-file')?.click()}
          variant="outline"
          className="border-[#8b005d]/30 text-[#f8e1f4]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        <input
          id="import-file"
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1a0a14]/50 border border-[#8b005d]/20">
          <TabsTrigger value="all">All Contacts</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        {/* All Contacts */}
        <TabsContent value="all" className="space-y-4">
          {filteredContacts.length === 0 ? (
            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardContent className="py-8 text-center">
                <UserPlus className="w-12 h-12 text-[#c0c0c0] mx-auto mb-4" />
                <p className="text-[#c0c0c0]">No contacts found</p>
              </CardContent>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="bg-[#1a0a14]/50 border-[#8b005d]/20 hover:border-[#8b005d]/40 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-[#f8e1f4] font-semibold text-lg">{contact.name}</h3>
                        {contact.favorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <p className="text-[#c0c0c0] text-sm font-mono mb-2">
                        {contact.address.slice(0, 8)}...{contact.address.slice(-8)}
                      </p>
                      {contact.memo && (
                        <p className="text-[#c0c0c0] text-xs mb-2">{contact.memo}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {contact.network}
                        </Badge>
                        {contact.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {contact.transactionCount > 0 && (
                        <p className="text-[#c0c0c0] text-xs">
                          {contact.transactionCount} transactions
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFavorite(contact)}
                        className="text-[#c0c0c0] hover:text-yellow-500"
                      >
                        <Star className={`w-4 h-4 ${contact.favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(contact)}
                        className="text-[#c0c0c0] hover:text-[#f8e1f4]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-[#c0c0c0] hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites" className="space-y-4">
          {favorites.length === 0 ? (
            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardContent className="py-8 text-center">
                <Star className="w-12 h-12 text-[#c0c0c0] mx-auto mb-4" />
                <p className="text-[#c0c0c0]">No favorite contacts yet</p>
              </CardContent>
            </Card>
          ) : (
            favorites.map((contact) => (
              <Card key={contact.id} className="bg-[#1a0a14]/50 border-[#8b005d]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[#f8e1f4] font-semibold">{contact.name}</h3>
                      <p className="text-[#c0c0c0] text-sm font-mono">
                        {contact.address.slice(0, 12)}...
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(contact)}
                      className="text-[#c0c0c0]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Recent */}
        <TabsContent value="recent" className="space-y-4">
          {recentlyUsed.length === 0 ? (
            <Card className="bg-[#1a0a14]/50 border-[#8b005d]/20">
              <CardContent className="py-8 text-center">
                <Clock className="w-12 h-12 text-[#c0c0c0] mx-auto mb-4" />
                <p className="text-[#c0c0c0]">No recent contacts</p>
              </CardContent>
            </Card>
          ) : (
            recentlyUsed.map((contact) => (
              <Card key={contact.id} className="bg-[#1a0a14]/50 border-[#8b005d]/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[#f8e1f4] font-semibold">{contact.name}</h3>
                      <p className="text-[#c0c0c0] text-sm font-mono">
                        {contact.address.slice(0, 12)}...
                      </p>
                      <p className="text-[#c0c0c0] text-xs mt-1">
                        Last used: {new Date(contact.lastUsed!).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(contact)}
                      className="text-[#c0c0c0]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#1a0a14] border-[#8b005d]/30">
          <DialogHeader>
            <DialogTitle className="text-[#f8e1f4]">Add New Contact</DialogTitle>
            <DialogDescription className="text-[#c0c0c0]">
              Save a contact for easier transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[#f8e1f4]">Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="John Doe"
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-[#f8e1f4]">Solana Address *</Label>
              <Input
                id="address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Enter Solana address"
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="memo" className="text-[#f8e1f4]">Memo (Optional)</Label>
              <Textarea
                id="memo"
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                placeholder="Add a note about this contact"
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
              />
            </div>

            <div>
              <Label htmlFor="tags" className="text-[#f8e1f4]">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="friend, work, family"
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="favorite"
                checked={formFavorite}
                onCheckedChange={setFormFavorite}
              />
              <Label htmlFor="favorite" className="text-[#f8e1f4]">Add to favorites</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAddContact}
              className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#1a0a14] border-[#8b005d]/30">
          <DialogHeader>
            <DialogTitle className="text-[#f8e1f4]">Edit Contact</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-[#f8e1f4]">Name *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
              />
            </div>

            <div>
              <Label htmlFor="edit-address" className="text-[#f8e1f4]">Solana Address *</Label>
              <Input
                id="edit-address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4] font-mono"
              />
            </div>

            <div>
              <Label htmlFor="edit-memo" className="text-[#f8e1f4]">Memo</Label>
              <Textarea
                id="edit-memo"
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
              />
            </div>

            <div>
              <Label htmlFor="edit-tags" className="text-[#f8e1f4]">Tags</Label>
              <Input
                id="edit-tags"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-favorite"
                checked={formFavorite}
                onCheckedChange={setFormFavorite}
              />
              <Label htmlFor="edit-favorite" className="text-[#f8e1f4]">Favorite</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleEditContact}
              className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
