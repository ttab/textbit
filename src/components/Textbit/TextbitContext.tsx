import React, {
  createContext,
  useReducer,
  useMemo,
  PropsWithChildren,
  Dispatch
} from 'react'


interface TextbitProviderState {
  words: number
  characters: number
}

interface RegistryProviderAction {
  words?: number
  characters?: number
}

export interface TextbitProviderContext extends TextbitProviderState {
  dispatch: Dispatch<RegistryProviderAction>
}

const initialState: TextbitProviderState = {
  words: 0,
  characters: 0
}

/**
 * RegistryReducer
 *
 * @param state
 * @param action
 * @returns RegistryProviderState
 */
const reducer = (state: TextbitProviderState, action: RegistryProviderAction): TextbitProviderState => {
  const { words, characters } = action
  const newState = { ...state }

  if (typeof words === 'number') {
    newState.words = words
  }

  if (typeof characters === 'number') {
    newState.characters = characters
  }

  return newState
}


/**
 * Registry context
 */
export const TextbitContext = createContext<TextbitProviderContext>({
  ...initialState,
  dispatch: () => {}
})


/**
 * RegistryProvider
 *
 * @param children
 * @returns JSX.Element
 */
const TextbitProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Memoize the context value to avoid unnecessary re-renders
  const contextValue = useMemo((): TextbitProviderState => {
    return state
  }, [state])

  return <TextbitContext.Provider value={{
    ...contextValue,
    dispatch
  }}>
    {children}
  </TextbitContext.Provider>
}

export { TextbitProvider }
