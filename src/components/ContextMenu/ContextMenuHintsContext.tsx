import { SpellingError } from '@/types'
import React, {
  createContext,
  useReducer,
  PropsWithChildren
} from 'react'
import { NodeEntry, BaseRange } from 'slate'

export interface ContextMenuHints {
  position: {
    x: number
    y: number
  }
  target: HTMLElement
  originalEvent: MouseEvent
  nodeEntry: NodeEntry
}

export interface ContextMenuHintsProviderState {
  menu?: ContextMenuHints
  spelling?: SpellingError & {
    range?: BaseRange
    apply: (replacement: string) => void
  }
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
export const ContextMenuHintsProvider = ({ children }: PropsWithChildren): JSX.Element => {

  const [state, dispatch] = useReducer(reducer, { ...initialState })

  return (
    <ContextMenuHintsContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ContextMenuHintsContext.Provider>
  )
}
