import { useContext } from 'react'
import { PendingDropsContext, type PendingDrop } from '../contexts/PendingDropsContext'

/**
 * Read the current pending drops in this editor session. Returns an empty
 * array outside a `PendingDropsProvider`. Consumer re-renders when a drop
 * is added or removed.
 */
export function usePendingDrops(): PendingDrop[] {
  const ctx = useContext(PendingDropsContext)
  return ctx?.drops ?? []
}
