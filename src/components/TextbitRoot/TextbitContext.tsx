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
  placeholder?: string
  placeholders: boolean
  dispatch: React.Dispatch<Partial<TextbitProviderState>>
}

const initialState: TextbitProviderState = {
  words: 0,
  characters: 0,
  verbose: false,
  debounce: 250,
  placeholders: false,
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
    placeholder,
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

  if (typeof placeholder === 'string') {
    partialState.placeholder = placeholder || undefined
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
export const TextbitContextProvider = ({ children, verbose, debounce, placeholder, placeholders }: PropsWithChildren & {
  verbose: boolean
  debounce?: number
  placeholder?: string
  placeholders?: boolean
}): JSX.Element => {
  if (!!placeholder && placeholders) {
    const log = verbose ? console.warn : console.info
    log('Warning: Setting a "placeholder" text and setting "placeholders" to true can lead to display and focus issues')
  }

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    verbose,
    debounce: typeof (debounce) === 'number' ? debounce : initialState.debounce,
    placeholders: typeof (placeholders) === 'boolean' ? placeholders : initialState.placeholders,
    placeholder: placeholder || undefined
  })

  return (
    <TextbitContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TextbitContext.Provider>
  )
}
