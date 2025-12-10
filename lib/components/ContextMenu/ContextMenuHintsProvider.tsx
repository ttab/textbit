import { useReducer, type PropsWithChildren } from 'react'
import { ContextMenuHintsContext, type ContextMenuHintsProviderState, initialState } from './ContextMenuHintsContext'

const reducer = (state: ContextMenuHintsProviderState, action: Partial<ContextMenuHintsProviderState>): ContextMenuHintsProviderState => {
  const { menu, spelling } = action
  const partialState: Partial<ContextMenuHintsProviderState> = {}

  partialState.menu = menu
  partialState.spelling = spelling

  return {
    ...state,
    ...partialState
  }
}

export function ContextMenuHintsProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, { ...initialState })
  const value = { ...state, dispatch }

  return (
    <ContextMenuHintsContext.Provider value={value}>
      {children}
    </ContextMenuHintsContext.Provider>
  )
}
