import { type Dispatch, type SetStateAction, createContext } from 'react'

export const MenuContext = createContext<[
  boolean,
  Dispatch<SetStateAction<boolean>>
]>([false, () => { }])
