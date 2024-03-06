import { useContext } from 'react'
import { TextbitContext, TextbitProviderState } from './TextbitContext'

export const useTextbit = (): TextbitProviderState => {
  const context = useContext(TextbitContext)

  if (!context) {
    throw new Error('useTextbit must be used within a TextbitContextProvider')
  }

  return context
}
