import React, {
  createContext,
  useReducer,
  type PropsWithChildren
} from 'react'

export type PlaceholdersVisibility = 'none' | 'single' | 'multiple'

export interface TextbitProviderProps {
  verbose: boolean
  autoFocus: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  debounce?: number
  spellcheckDebounce?: number
  placeholder?: string
  placeholders?: PlaceholdersVisibility
}

export interface TextbitProviderState extends TextbitProviderProps {
  debounce: number
  spellcheckDebounce: number
  words: number
  characters: number
  dispatch: React.Dispatch<Partial<TextbitProviderState>>
}

const initialState: TextbitProviderState = {
  words: 0,
  characters: 0,
  autoFocus: false,
  onBlur: undefined,
  onFocus: undefined,
  verbose: false,
  debounce: 250,
  spellcheckDebounce: 1250,
  placeholders: 'none',
  dispatch: () => { }
}


// Create the context
export const TextbitContext = createContext(initialState)


// Define the reducer function
const reducer = (state: TextbitProviderState, action: Partial<TextbitProviderState>): TextbitProviderState => {
  const {
    words,
    characters,
    autoFocus,
    onBlur,
    onFocus,
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

  if (typeof autoFocus === 'boolean') {
    partialState.autoFocus = autoFocus
  }

  if (typeof onFocus === 'function') {
    partialState.onFocus = onFocus
  }

  if (typeof onBlur === 'function') {
    partialState.onBlur = onBlur
  }

  if (typeof debounce === 'number') {
    partialState.debounce = debounce
  }

  if (typeof placeholder === 'string') {
    partialState.placeholder = placeholder || undefined
  }

  if (['none', 'single', 'multiple'].includes(partialState.placeholders || '')) {
    partialState.placeholders = placeholders
  }

  return {
    ...state,
    ...partialState
  }
}


// Create the context provider component
export const TextbitContextProvider = ({ children, verbose, autoFocus, onBlur, onFocus, debounce, spellcheckDebounce, placeholder, placeholders }: PropsWithChildren & TextbitProviderProps): JSX.Element => {
  const initialPlaceholders: PlaceholdersVisibility = (!placeholders && !!placeholder)
    ? 'single'
    : (!placeholders)
      ? 'none'
      : placeholders

  if (verbose) {
    if (initialPlaceholders === 'none') {
      console.info('Setting placeholders to "none", no visible placeholders')
    } else if (initialPlaceholders === 'single') {
      console.info('Setting placeholders to "single", one visible placeholder for entire editor')
    } else {
      console.info('Setting placeholders to "multiple", one placeholder per text line')
    }
  }

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    verbose,
    autoFocus,
    onBlur,
    onFocus,
    debounce: typeof (debounce) === 'number' ? debounce : initialState.debounce,
    spellcheckDebounce: typeof (spellcheckDebounce) === 'number' ? spellcheckDebounce : initialState.spellcheckDebounce,
    placeholders: initialPlaceholders,
    placeholder: placeholder || undefined
  })

  return (
    <TextbitContext.Provider value={{ ...state, dispatch }}>
      {children}
    </TextbitContext.Provider>
  )
}
