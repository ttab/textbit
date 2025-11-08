import { useContext, useEffect, useState } from 'react'
import { SelectionBoundsContext } from '../contexts/SelectionBoundsContext'

/**
 * Non reactive hook
 */
export const useTextbitSelectionBounds = () => {
  const context = useContext(SelectionBoundsContext)

  if (!context) {
    throw new Error('useSelectionBounds must be used within a SelectionBoundsProvider')
  }

  return context.boundsRef
}


/**
 * Reactive hook
 */
export const useTextbitSelectionBoundsState = () => {
  const context = useContext(SelectionBoundsContext)

  if (!context) {
    throw new Error('useTextbitSelectionBoundsState must be used within a TextbitSelectionBoundsProvider')
  }

  const [bounds, setBounds] = useState(context.boundsRef.current)

  useEffect(() => {
    return context.subscribe(setBounds)
  }, [context])

  return bounds
}
