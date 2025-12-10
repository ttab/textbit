import {
  createContext,
  type RefObject
} from 'react'

export type GutterContextInterface = {
  triggerRef?: RefObject<HTMLElement | undefined>
  updateTriggerRef: (e: HTMLElement) => void
}

export const GutterContext = createContext<GutterContextInterface>({
  triggerRef: undefined,
  updateTriggerRef: () => {}
})
