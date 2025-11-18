'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Server, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Star } from 'lucide-react'
import { customRPC, CustomRPCEndpoint } from '@/lib/custom-rpc'
import { NetworkType } from '@/lib/wallet-utils'

export default function CustomRPCSettings() {
  const [endpoints, setEndpoints] = useState<CustomRPCEndpoint[]>(customRPC.getEndpoints())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latency?: number; error?: string }>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    network: 'mainnet' as NetworkType,
    url: '',
  })
  const [formError, setFormError] = useState('')

  const refreshEndpoints = () => {
    setEndpoints(customRPC.getEndpoints())
  }

  const handleAddEndpoint = () => {
    setFormError('')
    
    if (!formData.name || !formData.url) {
      setFormError('Name and URL are required')
      return
    }
    
    try {
      customRPC.addEndpoint({ ...formData, isDefault: false })
      refreshEndpoints()
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error: any) {
      setFormError(error.message)
    }
  }

  const handleDeleteEndpoint = (id: string) => {
    if (confirm('Are you sure you want to delete this endpoint?')) {
      customRPC.deleteEndpoint(id)
      refreshEndpoints()
    }
  }

  const handleSetDefault = (id: string) => {
    customRPC.setAsDefault(id)
    refreshEndpoints()
  }

  const handleTestEndpoint = async (endpoint: CustomRPCEndpoint) => {
    setTesting(endpoint.id)
    const result = await customRPC.testEndpoint(endpoint.url)
    setTestResults({ ...testResults, [endpoint.id]: result })
    setTesting(null)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      network: 'mainnet',
      url: '',
    })
    setFormError('')
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#f8e1f4] flex items-center gap-2">
              <Server className="w-5 h-5 text-[#8b005d]" />
              Custom RPC Endpoints
            </CardTitle>
            <CardDescription className="text-[#c0c0c0]">Manage custom Solana RPC endpoints</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]">
                <Plus className="w-4 h-4 mr-2" />
                Add RPC
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a0a14] border-[#3a2a34]">
              <DialogHeader>
                <DialogTitle className="text-[#f8e1f4]">Add Custom RPC Endpoint</DialogTitle>
                <DialogDescription className="text-[#c0c0c0]">
                  Add a custom RPC endpoint for better performance or privacy
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
                    placeholder="My RPC"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c0c0c0]">Network</Label>
                  <Select value={formData.network} onValueChange={(value: NetworkType) => setFormData({ ...formData, network: value })}>
                    <SelectTrigger className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mainnet">Mainnet</SelectItem>
                      <SelectItem value="devnet">Devnet</SelectItem>
                      <SelectItem value="testnet">Testnet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c0c0c0]">RPC URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="bg-[#0b0b0b] border-[#3a2a34] text-[#f8e1f4]"
                  />
                </div>

                <Button onClick={handleAddEndpoint} className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]">
                  Add Endpoint
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {endpoints.length === 0 ? (
          <div className="text-center py-8 text-[#c0c0c0]">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No custom RPC endpoints</p>
            <p className="text-xs mt-1 opacity-70">Add custom endpoints for better performance</p>
          </div>
        ) : (
          endpoints.map(endpoint => (
            <div key={endpoint.id} className="p-3 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#f8e1f4] text-sm">{endpoint.name}</p>
                    {endpoint.isDefault && (
                      <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                    )}
                    <span className="px-2 py-0.5 bg-[#8b005d]/20 text-[#8b005d] text-xs rounded capitalize">
                      {endpoint.network}
                    </span>
                  </div>
                  <p className="text-xs text-[#c0c0c0] mt-1 break-all">{endpoint.url}</p>
                </div>
                <button
                  onClick={() => handleDeleteEndpoint(endpoint.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {testResults[endpoint.id] && (
                <div className={`p-2 rounded-lg flex items-center gap-2 text-xs ${
                  testResults[endpoint.id].success 
                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {testResults[endpoint.id].success ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Connected - Latency: {testResults[endpoint.id].latency}ms
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      {testResults[endpoint.id].error}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleTestEndpoint(endpoint)}
                  disabled={testing === endpoint.id}
                  size="sm"
                  className="flex-1 bg-[#8b005d]/20 text-[#8b005d] hover:bg-[#8b005d]/30"
                  variant="outline"
                >
                  {testing === endpoint.id ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                {!endpoint.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(endpoint.id)}
                    size="sm"
                    className="bg-[#8b005d]/20 text-[#8b005d] hover:bg-[#8b005d]/30"
                    variant="outline"
                  >
                    Set as Default
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
