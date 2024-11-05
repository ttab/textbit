import { useContext } from 'react'
import { PluginRegistryContext } from './PluginRegistryContext'
import type { PluginRegistryProviderState } from './lib/types'


export const usePluginRegistry = (): PluginRegistryProviderState => {
  const context = useContext(PluginRegistryContext)

  if (!context) {
    throw new Error('useTextbit must be used within a PluginRegistryContextProvider')
  }

  return context
}
