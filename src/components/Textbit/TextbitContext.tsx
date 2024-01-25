import React, {
  createContext,
  useReducer,
  useContext,
  PropsWithChildren
} from 'react'


export interface TextbitProviderState {
  words: number
  characters: number
  dispatch: React.Dispatch<Partial<TextbitProviderState>>
}

const initialState: TextbitProviderState = {
  words: 0,
  characters: 0,
  dispatch: () => {}
}


// Create the context
export const TextbitContext = createContext(initialState)


// Define the reducer function
const reducer = (state: TextbitProviderState, action: Partial<TextbitProviderState>): TextbitProviderState => {
  const { words, characters } = action
  const partialState: Partial<TextbitProviderState> = {}

  if (typeof words === 'number') {
    partialState.words = words
  }

  if (typeof characters === 'number') {
    partialState.characters = characters
  }

  return {
    ...state,
    ...partialState
  }
}


// Create the context provider component
export const TextbitContextProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <TextbitContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TextbitContext.Provider>
  )
}
