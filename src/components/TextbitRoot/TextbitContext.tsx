import React, {
  createContext,
  useReducer,
  PropsWithChildren
} from 'react'


export interface TextbitProviderState {
  words: number
  characters: number
  verbose: boolean
  dispatch: React.Dispatch<Partial<TextbitProviderState>>
}

const initialState: TextbitProviderState = {
  words: 0,
  characters: 0,
  verbose: false,
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

  return {
    ...state,
    ...partialState
  }
}


// Create the context provider component
export const TextbitContextProvider = ({ children, verbose }: PropsWithChildren & { verbose: boolean }): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    verbose
  })

  return (
    <TextbitContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TextbitContext.Provider>
  )
}
