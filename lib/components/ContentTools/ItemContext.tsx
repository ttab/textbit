import { createContext } from 'react'
import type { Action } from '../../types'

export const ItemContext = createContext<{
  isActive: boolean
  action?: Action
}>({
  isActive: false
})
