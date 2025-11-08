import { useContext } from 'react'
import { TextbitContext, type TextbitState } from '../contexts/TextbitContext'

export const useTextbit = (): TextbitState => {
  const context = useContext(TextbitContext)

  if (!context) {
    throw new Error('useTextbit must be used within a TextbitProvider')
  }

  return context
}
