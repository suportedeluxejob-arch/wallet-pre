'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Globe } from 'lucide-react'
import type { NetworkType } from '@/lib/wallet-utils'

interface NetworkSwitcherProps {
  currentNetwork: NetworkType
  onNetworkChange: (network: NetworkType) => void
}

export default function NetworkSwitcher({ currentNetwork, onNetworkChange }: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const networks: { value: NetworkType; label: string; color: string }[] = [
    { value: 'mainnet', label: 'Mainnet Beta', color: 'text-green-400' },
    { value: 'devnet', label: 'Devnet', color: 'text-blue-400' },
    { value: 'testnet', label: 'Testnet', color: 'text-yellow-400' },
  ]

  const currentNetworkData = networks.find(n => n.value === currentNetwork)

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-xl bg-[#8b005d]/20 hover:bg-[#8b005d]/30 text-[#f8e1f4] border border-[#8b005d]/30"
        variant="outline"
      >
        <Globe className="w-4 h-4 mr-2" />
        <span className={currentNetworkData?.color}>{currentNetworkData?.label}</span>
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-56 border-[#3a2a34] bg-[#1a0a14] z-50">
          <CardContent className="p-2 space-y-1">
            {networks.map((network) => (
              <button
                key={network.value}
                onClick={() => {
                  onNetworkChange(network.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  currentNetwork === network.value
                    ? 'bg-[#8b005d]/20 text-[#f8e1f4]'
                    : 'hover:bg-[#2a1a24] text-[#c0c0c0]'
                }`}
              >
                <span className={network.color}>{network.label}</span>
                {currentNetwork === network.value && (
                  <Check className="w-4 h-4 text-[#8b005d]" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
