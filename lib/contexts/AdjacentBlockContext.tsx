import { createContext } from 'react'

export interface AdjacentBlockState {
  blockId: string
  direction: 'before' | 'after' // 'before' = cursor arrived from preceding block, 'after' = from following block
}

export const AdjacentBlockContext = createContext<AdjacentBlockState | null>(null)
