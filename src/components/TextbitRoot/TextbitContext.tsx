import React, {
  createContext,
  useReducer,
  PropsWithChildren
} from 'react'


export interface TextbitProviderState {
  words: number
  characters: number
  verbose: boolean
  debounce: number
  placeholders: boolean
  dispatch: React.Dispatch<Partial<TextbitProviderState>>
}

const initialState: TextbitProviderState = {
  words: 0,
  characters: 0,
  verbose: false,
  debounce: 250,
  placeholders: true,
  dispatch: () => { }
}


// Create the context
export const TextbitContext = createContext(initialState)


// Define the reducer function
const reducer = (state: TextbitProviderState, action: Partial<TextbitProviderState>): TextbitProviderState => {
  const {
    words,
    characters,
    verbose,
    debounce,
    placeholders
  } = action
  const partialState: Partial<TextbitProviderState> = {}

  if (typeof words === 'number') {
    partialState.words = words
  }

  if (typeof characters === 'number') {
    partialState.characters = characters
  }

  if (typeof verbose === 'boolean') {
    partialState.verbose = verbose
  }

  if (typeof debounce === 'number') {
    partialState.debounce = debounce
  }

  if (typeof placeholders === 'boolean') {
    partialState.placeholders = placeholders
  }

  return {
    ...state,
    ...partialState
  }
}


// Create the context provider component
export const TextbitContextProvider = ({ children, verbose, debounce, placeholders }: PropsWithChildren & {
  verbose: boolean
  debounce?: number
  placeholders?: boolean
}): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    verbose,
    debounce: typeof (debounce) === 'number' ? debounce : initialState.debounce,
    placeholders: typeof (placeholders) === 'boolean' ? placeholders : initialState.placeholders
  })

  return (
    <TextbitContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TextbitContext.Provider>
  )
}
