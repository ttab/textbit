import { type SpellingError } from '../types'
import { createContext } from 'react'
import { type NodeEntry, type BaseRange } from 'slate'

export interface ContextMenuHints {
  position: {
    x: number
    y: number
  }
  target: HTMLElement
  originalEvent: MouseEvent
  nodeEntry: NodeEntry
}

export interface ContextMenuSpellingHints extends SpellingError {
  range?: BaseRange
  apply: (replacement: string) => void
}

export interface ContextMenuHintsProviderState {
  menu?: ContextMenuHints
  spelling?: ContextMenuSpellingHints
  dispatch: React.Dispatch<Partial<ContextMenuHintsProviderState>>
}

export const initialState: ContextMenuHintsProviderState = {
  menu: undefined,
  spelling: undefined,
  dispatch: () => { }
}


// Create the context
export const ContextMenuHintsContext = createContext(initialState)
