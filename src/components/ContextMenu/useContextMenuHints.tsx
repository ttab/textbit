import { useContext } from 'react'
import { ContextMenuContext } from './ContextMenuContext'

export const useContextMenuHints = () => {
  const context = useContext(ContextMenuContext)

  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuContextProvider')
  }

  return {
    isOpen: !!context.menu,
    position: context.menu ? {
      x: context.menu.x,
      y: context.menu.y
    } : undefined,
    target: context.menu?.target,
    event: context.menu?.originalEvent,
    nodeEntry: context.menu?.nodeEntry,
    spelling: context.spelling
  }
}
