'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { walletStorage } from '@/lib/wallet-storage'

interface WalletExportImportProps {
  wallet: any
}

export default function WalletExportImport({ wallet }: WalletExportImportProps) {
  const [mode, setMode] = useState<'export' | 'import' | null>(null)
  const [exportPassword, setExportPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [importFile, setImportFile] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExport = async () => {
    if (!exportPassword) {
      setMessage({ type: 'error', text: 'Please enter a password' })
      return
    }

    setLoading(true)
    try {
      const walletData = {
        seedPhrase: wallet.seedPhrase,
        publicKey: wallet.publicKey,
        privateKey: Array.from(wallet.privateKey),
      }

      const encrypted = await walletStorage.exportWallet(walletData, exportPassword)
      
      // Create downloadable file
      const dataStr = JSON.stringify({ encrypted, address: wallet.publicKey })
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `solary-wallet-${wallet.publicKey.slice(0, 8)}-backup.json`
      link.click()
      URL.revokeObjectURL(url)

      walletStorage.saveBackupMetadata(wallet.publicKey)
      setMessage({ type: 'success', text: 'Wallet exported successfully!' })
      setExportPassword('')
      setMode(null)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to export wallet' })
    } finally {
      setLoading(false)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        setImportFile(content)
        setMessage(null)
      } catch (err) {
        setMessage({ type: 'error', text: 'Invalid file format' })
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importFile || !importPassword) {
      setMessage({ type: 'error', text: 'Please select file and enter password' })
      return
    }

    setLoading(true)
    try {
      const data = JSON.parse(importFile)
      await walletStorage.importWallet(data.encrypted, importPassword)
      setMessage({ type: 'success', text: 'Wallet imported successfully!' })
      setImportPassword('')
      setImportFile('')
      setMode(null)
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to import wallet. Check password.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!mode && (
        <>
          <Button
            onClick={() => setMode('export')}
            className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Wallet Backup
          </Button>
          <Button
            onClick={() => setMode('import')}
            className="w-full bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Wallet Backup
          </Button>
        </>
      )}

      {mode === 'export' && (
        <Card className="border-[#3a2a34] bg-[#1a0a14]/80">
          <CardHeader>
            <CardTitle className="text-[#f8e1f4]">Export Wallet</CardTitle>
            <CardDescription className="text-[#c0c0c0]">Download encrypted backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#f8e1f4] mb-2">Password</label>
              <Input
                type="password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                placeholder="Enter password for backup"
                className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4]"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'} style={{fontSize: '0.875rem'}}>
                  {message.text}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setMode(null)}
                variant="ghost"
                className="flex-1 text-[#c0c0c0]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
              >
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'import' && (
        <Card className="border-[#3a2a34] bg-[#1a0a14]/80">
          <CardHeader>
            <CardTitle className="text-[#f8e1f4]">Import Wallet</CardTitle>
            <CardDescription className="text-[#c0c0c0]">Restore from backup file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#f8e1f4] mb-2">Backup File</label>
              <Input
                type="file"
                onChange={handleImportFile}
                accept=".json"
                className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4] file:text-[#8b005d]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#f8e1f4] mb-2">Password</label>
              <Input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Enter backup password"
                className="bg-[#0b0b0b] border-2 border-[#3a2a34] rounded-xl text-[#f8e1f4]"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={message.type === 'success' ? 'text-green-400' : 'text-red-400'} style={{fontSize: '0.875rem'}}>
                  {message.text}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setMode(null)}
                variant="ghost"
                className="flex-1 text-[#c0c0c0]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#8b005d] to-[#d4308e] text-[#f8e1f4]"
              >
                Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
