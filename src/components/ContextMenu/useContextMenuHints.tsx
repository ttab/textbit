import { useContext } from 'react'
import { ContextMenuHintsContext, ContextMenuHintsProviderState } from './ContextMenuHintsContext'

export type ContextMenuState = Omit<ContextMenuHintsProviderState, 'dispatch'>

export const useContextMenuHints = (): ContextMenuState => {
  const context = useContext(ContextMenuHintsContext)

  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuContextProvider')
  }

  return {
    menu: context.menu,
    spelling: context.spelling
  }
}
