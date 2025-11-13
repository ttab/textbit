import {
  createContext,
  type RefObject
} from 'react'

export type GutterContextInterface = {
  triggerRef?: RefObject<HTMLElement | undefined>
}

export const GutterContext = createContext<GutterContextInterface>({
  triggerRef: undefined
})
