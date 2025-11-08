import { type SpellingError } from '../../types'
import React, {
  createContext,
  useReducer,
  type PropsWithChildren
} from 'react'
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

const initialState: ContextMenuHintsProviderState = {
  menu: undefined,
  spelling: undefined,
  dispatch: () => { }
}


// Create the context
export const ContextMenuHintsContext = createContext(initialState)


// Define the reducer function
const reducer = (state: ContextMenuHintsProviderState, action: Partial<ContextMenuHintsProviderState>): ContextMenuHintsProviderState => {
  const {
    menu,
    spelling
  } = action
  const partialState: Partial<ContextMenuHintsProviderState> = {}

  partialState.menu = menu
  partialState.spelling = spelling

  return {
    ...state,
    ...partialState
  }
}


// Create the context provider component
export function ContextMenuHintsProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, { ...initialState })
  const value = { ...state, dispatch }

  return (
    <ContextMenuHintsContext.Provider value={value}>
      {children}
    </ContextMenuHintsContext.Provider>
  )
}
