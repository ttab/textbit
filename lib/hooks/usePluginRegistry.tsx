import { useContext } from 'react'
import { PluginRegistryContext } from '../contexts/PluginRegistry/PluginRegistryContext'
import type { PluginRegistryProviderState } from '../contexts/PluginRegistry/lib/types'

export function usePluginRegistry(): PluginRegistryProviderState {
  const context = useContext(PluginRegistryContext)

  if (!context) {
    throw new Error('useTextbit must be used within a PluginRegistryContextProvider')
  }

  return context
}
