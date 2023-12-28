import { useContext } from 'react'
import {
  TextbitContext,
  TextbitProviderContext
} from './TextbitContext'

/**
 * Registry hook
 *
 * @returns RegistryProviderState
 */
export const useTextbit = (): TextbitProviderContext => {
  const context = useContext(TextbitContext)

  if (!context) {
    throw new Error('useTextbit must be used within a <Textbit> component')
  }
  return context
}
