import React, {
  createContext,
  useReducer,
  PropsWithChildren
} from 'react'
import { NodeEntry, Range } from 'slate'

export interface ContextMenuHints {
  x: number
  y: number
  target: HTMLElement
  originalEvent: MouseEvent
  nodeEntry: NodeEntry
}

export interface SpellingHint {
  text: string
  suggestions: string[]
  range?: Range
}

export interface ContextMenuProviderState {
  menu?: ContextMenuHints
  spelling?: SpellingHint
  dispatch: React.Dispatch<Partial<ContextMenuProviderState>>
}

const initialState: ContextMenuProviderState = {
  menu: undefined,
  spelling: undefined,
  dispatch: () => { }
}


// Create the context
export const ContextMenuContext = createContext(initialState)


// Define the reducer function
const reducer = (state: ContextMenuProviderState, action: Partial<ContextMenuProviderState>): ContextMenuProviderState => {
  const {
    menu,
    spelling
  } = action
  const partialState: Partial<ContextMenuProviderState> = {}

  partialState.menu = menu
  partialState.spelling = spelling

  return {
    ...state,
    ...partialState
  }
}


// Create the context provider component
export const ContextMenuProvider = ({ children }: PropsWithChildren): JSX.Element => {

  const [state, dispatch] = useReducer(reducer, { ...initialState })

  return (
    <ContextMenuContext.Provider value={{ ...state, dispatch }}>
      {children}
    </ContextMenuContext.Provider>
  )
}
