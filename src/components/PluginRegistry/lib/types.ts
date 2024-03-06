import { Plugin } from '../../../types'

/**
 * @type
 * A renderable component
 */
export type PluginRegistryComponent = {
  type: string
  class: string
  componentEntry: Plugin.ComponentEntry
  parent: Plugin.ComponentEntry | null
}

/**
 * @type
 * Hotkey registry
 */
export type PluginRegistryAction = Plugin.Action & {
  key: string
  plugin: Plugin.Definition
  isHotkey: (action: any) => boolean
}

/**
 * @type
 * Plugin registry reducer action to add, or delete plugins
 */
export type PluginRegistryReducerAction = {
  action: 'add' | 'delete'
  plugin: Plugin.Definition
}


/**
 * @interface
 * Plugin registry provider state
 */
export interface PluginRegistryProviderState {
  // Main plugin registry
  plugins: Array<Plugin.Definition>

  // Component registries provide faster access in rendering cycles
  leafComponents: Map<string, PluginRegistryComponent>
  elementComponents: Map<string, PluginRegistryComponent>

  // Hotkey registry provides faster access to plugin actions
  actions: Array<PluginRegistryAction>

  verbose: boolean
  dispatch: React.Dispatch<PluginRegistryReducerAction>
}
