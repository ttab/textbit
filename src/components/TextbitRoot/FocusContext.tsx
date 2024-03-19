import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useState
} from 'react'

export interface FocusProviderState {
  focused: boolean,
  setFocused: Dispatch<SetStateAction<boolean>>
}

const initialState: FocusProviderState = {
  focused: false,
  setFocused: () => { }
}

export const FocusContext = createContext(initialState)

export const FocusContextProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [focused, setFocused] = useState<boolean>(false)

  return (
    <FocusContext.Provider value={{ focused, setFocused }}>
      {children}
    </FocusContext.Provider>
  )
}
