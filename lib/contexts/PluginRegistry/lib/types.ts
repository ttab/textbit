import type { KeyboardEventLike } from 'is-hotkey'
import type { PluginDefinition, Action, ChildComponentEntry } from '../../../types'

/**
 * @type
 * A renderable component.
 *
 * `componentEntry` / `parent` are typed as `ChildComponentEntry` — the widest
 * of the two entry types — so this field can store both top-level and child
 * entries. A top-level `ComponentEntry` is structurally assignable to
 * `ChildComponentEntry` because its `min`/`max` are typed `never` (a subtype
 * of `number`). Internal code can read `constraints?.min` / `constraints?.max`
 * through this field.
 */
export type PluginRegistryComponent = {
  type: string
  class: string
  componentEntry: ChildComponentEntry
  parent: ChildComponentEntry | null
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
