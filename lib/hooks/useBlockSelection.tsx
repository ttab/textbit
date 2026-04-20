import { useContext } from 'react'
import { BlockSelectionContext, type BlockSelectionState } from '../contexts/BlockSelectionContext'

export function useBlockSelection(): BlockSelectionState | null {
  return useContext(BlockSelectionContext)
}
