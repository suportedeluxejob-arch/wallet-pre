// Firebase configuration and utilities for wallet data persistence
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, push, child, query, orderByChild, limitToLast } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDdAtOCsRr8twAiKxf9b5G9Spy2xsNdT6Y',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'play-to-earn-60a17.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://play-to-earn-60a17-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'play-to-earn-60a17',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'play-to-earn-60a17.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '361850830685',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:361850830685:web:4000236d54e4bb3d6172b4',
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)

// Save transaction to Firebase
export async function saveTransaction(walletAddress: string, transaction: any) {
  try {
    const db = database
    const transactionsRef = ref(db, `wallets/${walletAddress}/transactions`)
    const newTransactionRef = push(transactionsRef)
    
    await set(newTransactionRef, {
      ...transaction,
      timestamp: Date.now(),
    })
    
    console.log('Transaction saved to Firebase')
  } catch (error) {
    console.error('Error saving transaction:', error)
  }
}

// Get transaction history from Firebase
export async function getTransactionHistoryFromFirebase(walletAddress: string, limit: number = 50) {
  try {
    const db = database
    const transactionsRef = ref(db, `wallets/${walletAddress}/transactions`)
    const transactionsQuery = query(transactionsRef, orderByChild('timestamp'), limitToLast(limit))
    
    const snapshot = await get(transactionsQuery)
    
    if (snapshot.exists()) {
      const transactions = []
      snapshot.forEach((childSnapshot) => {
        transactions.unshift(childSnapshot.val())
      })
      return transactions
    }
    
    return []
  } catch (error) {
    console.error('Error fetching transactions from Firebase:', error)
    return []
  }
}

// Save price history for analytics
export async function savePriceHistory(token: string, price: number) {
  try {
    const db = database
    const priceRef = ref(db, `prices/${token}`)
    const newPriceRef = push(priceRef)
    
    await set(newPriceRef, {
      price,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Error saving price history:', error)
  }
}

// Get price history from Firebase
export async function getPriceHistoryFromFirebase(token: string, limit: number = 100) {
  try {
    const db = database
    const priceRef = ref(db, `prices/${token}`)
    const priceQuery = query(priceRef, orderByChild('timestamp'), limitToLast(limit))
    
    const snapshot = await get(priceQuery)
    
    if (snapshot.exists()) {
      const prices = []
      snapshot.forEach((childSnapshot) => {
        prices.unshift(childSnapshot.val())
      })
      return prices
    }
    
    return []
  } catch (error) {
    console.error('Error fetching price history from Firebase:', error)
    return []
  }
}
