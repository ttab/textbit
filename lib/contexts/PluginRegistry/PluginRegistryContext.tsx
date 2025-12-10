import { createContext } from 'react'

import type { PluginRegistryProviderState } from './lib/types'

export const initialState = (): PluginRegistryProviderState => {
  return {
    plugins: [],
    components: new Map(),
    actions: [],
    verbose: false,
    dispatch: () => { }
  }
}

export const PluginRegistryContext = createContext(initialState())
