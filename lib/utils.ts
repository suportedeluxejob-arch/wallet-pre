import { Connection, PublicKey } from '@solana/web3.js'

// SPL Token Program ID
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')

// Get Associated Token Address
export async function getAssociatedTokenAddress(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return address
}

// CN utility for class names (already exists in your project, but including for completeness)
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
