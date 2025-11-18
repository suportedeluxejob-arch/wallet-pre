// Platform fees are hardcoded and non-negotiable
// This ensures Solary's revenue model is protected

export const PLATFORM_FEES = {
  SWAP: 0.0025, // 0.25% - fixed, not user-editable
  STAKING: 0, // No staking fee
  NFT_LISTING: 0.05, // 5% - fixed
  WITHDRAWAL: 0, // No withdrawal fee
} as const

// Network priority fees - user can choose these
export const NETWORK_PRIORITY_PRESETS = {
  economy: {
    name: 'Economy',
    description: 'Slower, cheapest option',
    computeUnitPrice: 1000, // microlamports per compute unit
    estimatedTime: '10-30 seconds',
    estimatedCost: '~5000 lamports',
  },
  standard: {
    name: 'Standard',
    description: 'Balanced speed and cost',
    computeUnitPrice: 5000,
    estimatedTime: '2-10 seconds',
    estimatedCost: '~25000 lamports',
  },
  priority: {
    name: 'Priority',
    description: 'Fast processing',
    computeUnitPrice: 15000,
    estimatedTime: '< 2 seconds',
    estimatedCost: '~75000 lamports',
  },
} as const

export function getPlatformFee(feeType: keyof typeof PLATFORM_FEES): number {
  return PLATFORM_FEES[feeType]
}

export function calculatePlatformFee(amount: number, feeType: keyof typeof PLATFORM_FEES): number {
  return amount * PLATFORM_FEES[feeType]
}
