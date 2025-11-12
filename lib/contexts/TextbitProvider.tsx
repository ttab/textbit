import { useReducer } from 'react'
import { TextbitContext, type TextbitState, type PlaceholdersVisibility } from './TextbitContext'

interface TextbitProps {
  children: React.ReactNode
  verbose?: boolean
  readOnly?: boolean
  collaborative?: boolean
  dir?: 'ltr' | 'rtl'
  lang?: string
  debounce?: number
  spellcheckDebounce?: number
  placeholder?: string
  placeholders?: PlaceholdersVisibility
}

const reducer = (state: TextbitState, action: Partial<TextbitState>): TextbitState => {
  const {
    stats
  } = action
  const partialState: Partial<TextbitState> = {}

  if (stats) {
    partialState.stats = stats
  }

  return {
    ...state,
    ...partialState
  }
}

export function TextbitProvider({
  children,
  verbose,
  readOnly,
  collaborative,
  dir,
  lang,
  debounce,
  spellcheckDebounce,
  placeholder,
  placeholders
}: TextbitProps) {
  const [value, dispatch] = useReducer(reducer, {
    verbose: verbose ?? false,
    readOnly: readOnly ?? false,
    collaborative: collaborative ?? false,
    dir: dir ?? 'ltr',
    lang: lang ?? 'en',
    debounce: debounce ?? 250,
    spellcheckDebounce: spellcheckDebounce ?? 1250,
    placeholder: placeholder ?? '',
    placeholders: placeholders ?? 'none',
    stats: {
      full: { words: 0, characters: 0 },
      short: { words: 0, characters: 0 }
    },
    dispatch: () => { }
  })

  return (
    <TextbitContext.Provider value={{ ...value, dispatch }}>
      {children}
    </TextbitContext.Provider>
  )
}
