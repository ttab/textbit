import { useContext } from 'react'
import { ContextMenuHintsContext } from './ContextMenuHintsContext'

export function useContextMenuHints() {
  const context = useContext(ContextMenuHintsContext)
  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuContextProvider')
  }

  return {
    menu: context.menu,
    spelling: context.spelling
  }
}
