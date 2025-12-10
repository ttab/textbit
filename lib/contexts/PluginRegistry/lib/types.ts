import type { KeyboardEventLike } from 'is-hotkey'
import type { PluginDefinition, Action, ComponentEntry } from '../../../types'

/**
 * @type
 * A renderable component
 */
export type PluginRegistryComponent = {
  type: string
  class: string
  componentEntry: ComponentEntry
  parent: ComponentEntry | null
  pluginOptions: Record<string, unknown>
}

/**
 * @type
 * Hotkey registry
 */
export type PluginRegistryAction = Action & {
  plugin: PluginDefinition
  isHotkey: (action: KeyboardEventLike) => boolean
}

/**
 * @type
 * Plugin registry reducer action to add, or delete plugins
 */
export type PluginRegistryReducerAction = {
  action: 'add' | 'delete'
  plugin: PluginDefinition
}


/**
 * @interface
 * Plugin registry provider state
 */
export interface PluginRegistryProviderState {
  // Main plugin registry
  plugins: Array<PluginDefinition>

  // Component registries provide faster access in rendering cycles
  components: Map<string, PluginRegistryComponent>

  // Hotkey registry provides faster access to plugin actions
  actions: Array<PluginRegistryAction>

  verbose: boolean
  dispatch: React.Dispatch<PluginRegistryReducerAction>
}
