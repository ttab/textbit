import { useContext } from 'react'
import { FocusContext } from './FocusContext'

export const useFocused = (): boolean => {
  const { focused } = useContext(FocusContext)

  if (typeof (focused) !== 'boolean') {
    throw new Error('useFocused must be used within a FocusContextProvider')
  }

  return focused
}
