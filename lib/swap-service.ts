// Swap service for token exchanges using Jupiter API

export const PLATFORM_FEE_PERCENTAGE = 0.0025 // 0.25%
export const PLATFORM_FEE_WALLET = '2gNsFkvySmj3JVuabfy6W9u8sbyLbqePp7wgGeFaxr46' // Solary fee collection wallet

export interface SwapQuote {
  inputMint: string
  outputMint: string
  inputAmount: number
  outputAmount: number
  slippageBps: number
  priceImpactPct: number
  routePlan: any[]
  swapMode: 'ExactIn' | 'ExactOut'
}

export interface SwapTransaction {
  swapTransaction: string
  lastValidBlockHeight: number
}

export interface SwapFees {
  platformFee: number // In input token
  platformFeeUSD: number
  networkFee: number // In SOL
  jupiterFee: number // In input token
  totalFees: number // In input token
  totalFeesUSD: number
}

// Fetch swap quote from Jupiter
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    })

    const response = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`)
    const quote = await response.json()

    return {
      inputMint,
      outputMint,
      inputAmount: amount,
      outputAmount: parseInt(quote.outAmount),
      slippageBps,
      priceImpactPct: quote.priceImpactPct,
      routePlan: quote.routePlan,
      swapMode: 'ExactIn',
    }
  } catch (error) {
    console.error('Error fetching swap quote:', error)
    return null
  }
}

// Format swap output amount considering decimals
export function formatSwapAmount(amount: number, decimals: number): number {
  return amount / Math.pow(10, decimals)
}

// Calculate price impact
export function calculatePriceImpact(quote: SwapQuote): string {
  const impact = Math.abs(quote.priceImpactPct)
  return `${impact.toFixed(2)}%`
}

export function calculateSwapFees(
  inputAmount: number,
  inputDecimals: number,
  inputPriceUSD: number = 0,
  networkFeeSOL: number = 0.00025
): SwapFees {
  const platformFee = inputAmount * PLATFORM_FEE_PERCENTAGE
  const jupiterFee = inputAmount * 0.001 // Jupiter charges ~0.1%
  const networkFee = networkFeeSOL
  
  const totalFees = platformFee + jupiterFee
  
  return {
    platformFee,
    platformFeeUSD: platformFee * inputPriceUSD / Math.pow(10, inputDecimals),
    networkFee,
    jupiterFee,
    totalFees,
    totalFeesUSD: (totalFees * inputPriceUSD / Math.pow(10, inputDecimals)) + (networkFee * inputPriceUSD),
  }
}

export function getAmountAfterPlatformFee(amount: number): number {
  return amount * (1 - PLATFORM_FEE_PERCENTAGE)
}

export function getPlatformFeeAmount(amount: number): number {
  return amount * PLATFORM_FEE_PERCENTAGE
}

export function formatFee(fee: number, decimals: number): string {
  return (fee / Math.pow(10, decimals)).toFixed(decimals)
}

export async function executeSwapWithFee(
  userPrivateKey: Uint8Array,
  inputMint: string,
  outputMint: string,
  inputAmount: number,
  slippageBps: number,
  network: string = 'mainnet-beta'
): Promise<{ signature: string; outputAmount: number }> {
  try {
    const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js')
    
    const connection = new Connection(`https://api.${network}.solana.com`, 'confirmed')
    const userKeypair = Keypair.fromSecretKey(userPrivateKey)
    const feeWallet = new PublicKey(PLATFORM_FEE_WALLET)
    
    // Step 1: Calculate platform fee
    const platformFeeAmount = getPlatformFeeAmount(inputAmount)
    const swapAmount = inputAmount - Math.floor(platformFeeAmount)
    
    console.log('[v0] Swap breakdown:', {
      inputAmount,
      platformFeeAmount: Math.floor(platformFeeAmount),
      swapAmount,
      feePercentage: PLATFORM_FEE_PERCENTAGE * 100 + '%'
    })
    
    // Step 2: Create transaction with multiple instructions
    const transaction = new Transaction()
    
    // Instruction 1: Transfer platform fee to Solary wallet
    if (inputMint === 'So11111111111111111111111111111111111111112') {
      // For SOL transfers
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userKeypair.publicKey,
          toPubkey: feeWallet,
          lamports: Math.floor(platformFeeAmount),
        })
      )
      console.log('[v0] Added SOL fee transfer:', Math.floor(platformFeeAmount) / LAMPORTS_PER_SOL, 'SOL')
    } else {
      // For SPL token transfers, we need to transfer tokens
      const { getAssociatedTokenAddress, createTransferInstruction } = await import('@solana/spl-token')
      
      const inputMintPubkey = new PublicKey(inputMint)
      const userTokenAccount = await getAssociatedTokenAddress(inputMintPubkey, userKeypair.publicKey)
      const feeTokenAccount = await getAssociatedTokenAddress(inputMintPubkey, feeWallet)
      
      // Check if fee wallet has associated token account, create if not
      const feeAccountInfo = await connection.getAccountInfo(feeTokenAccount)
      if (!feeAccountInfo) {
        const { createAssociatedTokenAccountInstruction } = await import('@solana/spl-token')
        transaction.add(
          createAssociatedTokenAccountInstruction(
            userKeypair.publicKey,
            feeTokenAccount,
            feeWallet,
            inputMintPubkey
          )
        )
        console.log('[v0] Creating associated token account for fee wallet')
      }
      
      transaction.add(
        createTransferInstruction(
          userTokenAccount,
          feeTokenAccount,
          userKeypair.publicKey,
          Math.floor(platformFeeAmount)
        )
      )
      console.log('[v0] Added SPL token fee transfer:', Math.floor(platformFeeAmount))
    }
    
    // Step 3: Get Jupiter swap transaction for remaining amount
    const quoteResponse = await fetch(
      `https://quote-api.jup.ag/v6/quote?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${Math.floor(swapAmount)}&` +
      `slippageBps=${slippageBps}`
    )
    
    const quoteData = await quoteResponse.json()
    
    if (!quoteData || quoteData.error) {
      throw new Error('Failed to get swap quote from Jupiter')
    }
    
    console.log('[v0] Jupiter quote received:', {
      inAmount: quoteData.inAmount,
      outAmount: quoteData.outAmount,
      priceImpact: quoteData.priceImpactPct
    })
    
    // Instruction 2: Get swap transaction from Jupiter
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: userKeypair.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      }),
    })
    
    const swapData = await swapResponse.json()
    
    if (!swapData.swapTransaction) {
      throw new Error('Failed to get swap transaction from Jupiter')
    }
    
    // Deserialize Jupiter transaction and add to our transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64')
    const jupiterTx = Transaction.from(swapTransactionBuf)
    
    // Add Jupiter swap instructions to our transaction
    jupiterTx.instructions.forEach(ix => transaction.add(ix))
    
    // Step 4: Set transaction metadata
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')
    transaction.recentBlockhash = blockhash
    transaction.lastValidBlockHeight = lastValidBlockHeight
    transaction.feePayer = userKeypair.publicKey
    
    // Step 5: Sign and send transaction
    transaction.sign(userKeypair)
    
    console.log('[v0] Sending combined transaction (fee + swap)...')
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })
    
    console.log('[v0] Transaction sent:', signature)
    
    // Step 6: Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed')
    
    if (confirmation.value.err) {
      throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err))
    }
    
    console.log('[v0] Transaction confirmed:', signature)
    
    return {
      signature,
      outputAmount: parseInt(quoteData.outAmount),
    }
  } catch (error: any) {
    console.error('[v0] Swap execution error:', error)
    throw new Error(error.message || 'Failed to execute swap')
  }
}
