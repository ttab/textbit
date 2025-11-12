import {
  createContext,
  type Dispatch,
  type SetStateAction
} from 'react'

export type GutterContextInterface = {
  triggerBox?: DOMRect
  setTriggerBox: Dispatch<SetStateAction<DOMRect | undefined>>
}

export const GutterContext = createContext<GutterContextInterface>({
  triggerBox: undefined,
  setTriggerBox: () => { }
})
