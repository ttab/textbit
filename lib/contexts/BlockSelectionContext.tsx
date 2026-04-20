import { createContext } from 'react'

export interface BlockSelectionState {
  anchorIndex: number  // Fixed end — where selection started
  focusIndex: number   // Moving end — extends with Shift+Up/Down
}

export const BlockSelectionContext = createContext<BlockSelectionState | null>(null)
