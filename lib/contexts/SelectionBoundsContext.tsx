import { createContext, RefObject } from 'react'
import { Node, type NodeEntry } from 'slate'

export type SelectionBounds = Omit<DOMRect & {
  isCollapsed: boolean
  leafEntry?: NodeEntry<Node>
  blockEntry?: NodeEntry<Node>,
  box?: DOMRect
}, 'toJSON'>

export type SelectionBoundsCallback = (param: SelectionBounds | undefined) => void

export const SelectionBoundsContext = createContext<{
  boundsRef: RefObject<SelectionBounds | undefined>
  subscribe: (callback: SelectionBoundsCallback) => () => void
} | undefined>(undefined)
