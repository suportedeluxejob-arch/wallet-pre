'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle2, QrCode } from 'lucide-react'

interface ReceiveQRProps {
  publicKey: string
}

export default function ReceiveQR({ publicKey }: ReceiveQRProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataURL, setQrDataURL] = useState<string>('')

  useEffect(() => {
    generateQRCode()
  }, [publicKey])

  const generateQRCode = async () => {
    try {
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(publicKey, {
        width: 256,
        margin: 2,
        color: {
          dark: '#8b005d',
          light: '#f8e1f4',
        },
      })
      setQrDataURL(url)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
          <QrCode className="w-5 h-5 text-[#8b005d]" />
          Receive SOL
        </CardTitle>
        <CardDescription className="text-[#c0c0c0]">
          Share this address to receive Solana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrDataURL && (
          <div className="flex justify-center p-4 bg-[#f8e1f4] rounded-xl">
            <img src={qrDataURL || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-[#c0c0c0] font-semibold">Your Address</p>
          <div className="flex items-center gap-2 bg-[#0b0b0b]/70 border border-[#3a2a34] rounded-xl p-4">
            <code className="flex-1 text-sm font-mono text-[#8b005d] break-all">
              {publicKey}
            </code>
            <Button
              onClick={handleCopy}
              className="p-2 bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#8b005d]"
              variant="outline"
            >
              {copied ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-green-400 font-semibold">Copied to clipboard!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
