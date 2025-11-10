import {
  createContext,
  type Dispatch,
  type SetStateAction
} from 'react'

export type GutterContextInterface = {
  triggerSize: number
  setTriggerSize: Dispatch<SetStateAction<number>>
  gutterBox?: DOMRect
  setGutterBox: React.Dispatch<React.SetStateAction<DOMRect | undefined>>
}

export const GutterContext = createContext<GutterContextInterface>({
  triggerSize: 0,
  setTriggerSize: () => { },
  gutterBox: undefined,
  setGutterBox: () => { }
})
