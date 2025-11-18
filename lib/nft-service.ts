import { Connection, PublicKey } from '@solana/web3.js'
import { NETWORK_ENDPOINTS, type NetworkType } from './wallet-utils'

export interface NFT {
  mint: string
  name: string
  symbol: string
  uri: string
  image?: string
  description?: string
  attributes?: Array<{ trait_type: string; value: string }>
  collection?: {
    name: string
    family: string
  }
  creators?: Array<{ address: string; share: number }>
  sellerFeeBasisPoints?: number
}

// Get NFTs owned by a wallet using Metaplex
export async function getNFTs(
  publicKey: string,
  network: NetworkType = 'mainnet'
): Promise<NFT[]> {
  try {
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    const ownerPublicKey = new PublicKey(publicKey)

    // Get token accounts owned by the wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      ownerPublicKey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    )

    const nfts: NFT[] = []

    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed.info
      
      // NFTs typically have 0 decimals and amount of 1
      if (parsedInfo.tokenAmount.decimals === 0 && parsedInfo.tokenAmount.uiAmount === 1) {
        try {
          const mintAddress = parsedInfo.mint
          
          // Try to get metadata from Metaplex standard
          const metadataPDA = await getMetadataPDA(mintAddress)
          const accountInfo = await connection.getAccountInfo(metadataPDA)
          
          if (accountInfo) {
            const metadata = decodeMetadata(accountInfo.data)
            
            // Fetch off-chain metadata if URI exists
            if (metadata.data.uri) {
              try {
                const uriResponse = await fetch(metadata.data.uri.replace(/\0/g, ''))
                if (uriResponse.ok) {
                  const uriData = await uriResponse.json()
                  
                  nfts.push({
                    mint: mintAddress,
                    name: uriData.name || metadata.data.name.replace(/\0/g, '') || 'Unknown NFT',
                    symbol: uriData.symbol || metadata.data.symbol.replace(/\0/g, '') || '',
                    uri: metadata.data.uri.replace(/\0/g, ''),
                    image: uriData.image,
                    description: uriData.description,
                    attributes: uriData.attributes,
                    collection: uriData.collection,
                  })
                }
              } catch (error) {
                console.warn(`Failed to fetch URI metadata for ${mintAddress}:`, error)
                // Add basic NFT info even if URI fetch fails
                nfts.push({
                  mint: mintAddress,
                  name: metadata.data.name.replace(/\0/g, '') || 'Unknown NFT',
                  symbol: metadata.data.symbol.replace(/\0/g, '') || '',
                  uri: metadata.data.uri.replace(/\0/g, ''),
                })
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to process NFT ${parsedInfo.mint}:`, error)
        }
      }
    }

    return nfts
  } catch (error) {
    console.error('Error fetching NFTs:', error)
    return []
  }
}

// Get NFT details by mint address
export async function getNFTDetails(
  mintAddress: string,
  network: NetworkType = 'mainnet'
): Promise<NFT | null> {
  try {
    const connection = new Connection(NETWORK_ENDPOINTS[network], 'confirmed')
    const metadataPDA = await getMetadataPDA(mintAddress)
    const accountInfo = await connection.getAccountInfo(metadataPDA)
    
    if (!accountInfo) return null
    
    const metadata = decodeMetadata(accountInfo.data)
    
    if (metadata.data.uri) {
      try {
        const uriResponse = await fetch(metadata.data.uri.replace(/\0/g, ''))
        if (uriResponse.ok) {
          const uriData = await uriResponse.json()
          
          return {
            mint: mintAddress,
            name: uriData.name || metadata.data.name.replace(/\0/g, '') || 'Unknown NFT',
            symbol: uriData.symbol || metadata.data.symbol.replace(/\0/g, '') || '',
            uri: metadata.data.uri.replace(/\0/g, ''),
            image: uriData.image,
            description: uriData.description,
            attributes: uriData.attributes,
            collection: uriData.collection,
          }
        }
      } catch (error) {
        console.warn('Failed to fetch URI metadata:', error)
      }
    }
    
    return null
  } catch (error) {
    console.error('Error fetching NFT details:', error)
    return null
  }
}

async function getMetadataPDA(mintAddress: string): Promise<PublicKey> {
  const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
  const mintPublicKey = new PublicKey(mintAddress)
  
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  )
  
  return metadataPDA
}

function decodeMetadata(data: Buffer): any {
  // Simple decoder for Metaplex metadata
  // This is a simplified version - production apps should use @metaplex-foundation/mpl-token-metadata
  const NAME_OFFSET = 1 + 32 + 32 + 4
  const SYMBOL_OFFSET = NAME_OFFSET + 36
  const URI_OFFSET = SYMBOL_OFFSET + 14
  
  return {
    data: {
      name: data.slice(NAME_OFFSET, NAME_OFFSET + 32).toString('utf8'),
      symbol: data.slice(SYMBOL_OFFSET, SYMBOL_OFFSET + 10).toString('utf8'),
      uri: data.slice(URI_OFFSET, URI_OFFSET + 200).toString('utf8'),
    }
  }
}
