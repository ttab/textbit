import { useContext } from 'react'
import { AdjacentBlockContext, type AdjacentBlockState } from '../contexts/AdjacentBlockContext'

export function useAdjacentBlock(): AdjacentBlockState | null {
  return useContext(AdjacentBlockContext)
}
