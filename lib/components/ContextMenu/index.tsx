import { Menu as Root } from './Menu'
import { Group } from './Group'
import { Item } from './Item'

// FIXME: Restructure and refactor
export const ContextMenu = {
  Root,
  Group,
  Item
}

export { useContextMenuHints } from './useContextMenuHints'
export { ContextMenuHintsProvider as ContextMenuProvider } from './ContextMenuHintsContext'
