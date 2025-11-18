'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Image, Loader2, ExternalLink, Grid3x3 } from 'lucide-react'
import { getNFTs, type NFT } from '@/lib/nft-service'
import { type NetworkType } from '@/lib/wallet-utils'

interface NFTGalleryProps {
  publicKey: string
  network?: NetworkType
}

export default function NFTGallery({ publicKey, network = 'mainnet' }: NFTGalleryProps) {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)

  useEffect(() => {
    loadNFTs()
  }, [publicKey, network])

  const loadNFTs = async () => {
    try {
      setLoading(true)
      const fetchedNFTs = await getNFTs(publicKey, network)
      setNfts(fetchedNFTs)
    } catch (error) {
      console.error('Error loading NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#8b005d] animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (nfts.length === 0) {
    return (
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#8b005d]/20 flex items-center justify-center">
            <Image className="w-8 h-8 text-[#8b005d]" />
          </div>
          <p className="text-[#c0c0c0]">No NFTs found in this wallet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-[#3a2a34] bg-[#1a0a14]/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-[#f8e1f4] flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
            <Grid3x3 className="w-5 h-5 text-[#8b005d]" />
            NFT Collection
          </CardTitle>
          <CardDescription className="text-[#c0c0c0]">
            {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nfts.map((nft) => (
              <button
                key={nft.mint}
                onClick={() => setSelectedNFT(nft)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#0b0b0b]/70 border border-[#3a2a34] hover:border-[#8b005d] transition-all"
              >
                {nft.image ? (
                  <img
                    src={nft.image || "/placeholder.svg"}
                    alt={nft.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-12 h-12 text-[#8b005d]/50" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <p className="text-xs font-semibold text-[#f8e1f4] truncate">{nft.name}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NFT Details Dialog */}
      <Dialog open={selectedNFT !== null} onOpenChange={() => setSelectedNFT(null)}>
        <DialogContent className="bg-[#1a0a14] border-[#3a2a34] text-[#f8e1f4] max-w-2xl">
          {selectedNFT && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Poppins' }}>
                  {selectedNFT.name}
                </DialogTitle>
                {selectedNFT.collection && (
                  <DialogDescription className="text-[#c0c0c0]">
                    {selectedNFT.collection.name || selectedNFT.collection.family}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-4">
                {selectedNFT.image && (
                  <img
                    src={selectedNFT.image || "/placeholder.svg"}
                    alt={selectedNFT.name}
                    className="w-full rounded-xl"
                  />
                )}

                {selectedNFT.description && (
                  <p className="text-sm text-[#c0c0c0]">{selectedNFT.description}</p>
                )}

                {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-[#f8e1f4]">Attributes</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedNFT.attributes.map((attr, idx) => (
                        <div key={idx} className="p-2 bg-[#0b0b0b]/70 rounded-lg border border-[#3a2a34]">
                          <p className="text-xs text-[#c0c0c0]">{attr.trait_type}</p>
                          <p className="text-sm font-semibold text-[#f8e1f4]">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`https://solscan.io/token/${selectedNFT.mint}`, '_blank')}
                    className="flex-1 bg-[#8b005d] hover:bg-[#a0006b] text-[#f8e1f4]"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Solscan
                  </Button>
                  <Button
                    onClick={() => window.open(`https://magiceden.io/item-details/${selectedNFT.mint}`, '_blank')}
                    className="flex-1 bg-[#2a1a24] hover:bg-[#3a2a34] text-[#f8e1f4]"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Magic Eden
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
