import isHotKey from 'is-hotkey'
import { Plugin } from '@/types'

export type RegistryComponent = {
  type: string
  class: string
  componentEntry: Plugin.ComponentEntry
  parent: Plugin.ComponentEntry | null
}

export type RegistryAction = Plugin.Action & {
  plugin: Plugin.Definition
  isHotkey: (action: any) => boolean
}

export interface RegistryInterface {
  // Main registry of plugins
  plugins: Plugin.Definition[]

  // Provides faster access in rendering cycles
  leafComponents: Map<string, RegistryComponent>
  elementComponents: Map<string, RegistryComponent>

  // Provides faster access to actions and keyboard shortcuts
  actions: RegistryAction[]

  // Output verbose info on console on what is happening
  verbose: boolean

  // Add one plugin
  addPlugin: (plugin: Plugin.Definition) => void

  // Initialize Registry and add all incoming plugins
  initialize: (Registry: RegistryInterface, plugins: Plugin.Definition[], verbose: boolean) => void
}

export const Registry: RegistryInterface = {
  plugins: [],
  leafComponents: new Map(),
  elementComponents: new Map(),
  actions: [],
  verbose: false,
  addPlugin,
  initialize
}

/**
 * Initalize a clean registry and register all plugins
 */
export function initialize(registry: RegistryInterface, plugins: Plugin.Definition[], verbose: boolean) {
  Registry.actions.length = 0
  Registry.plugins.length = 0
  Registry.leafComponents.clear()
  Registry.elementComponents.clear()
  Registry.verbose = verbose

  plugins.forEach(registry.addPlugin)
}

/**
 * Add plugin and register all it's functions/handlers.
 * Always replaces plugins with same name.
 *
 * @param plugin
 */
function addPlugin(plugin: Plugin.Definition) {
  if (Registry.verbose) {
    console.info(`Registering plugin ${plugin.name}`)
  }

  // 1. Create new list of plugins, override old instance of a plugin if already registered, preserve order
  const plugins = [...Registry.plugins]
  const idx = plugins.findIndex((existingPlugin => existingPlugin.name === plugin.name))
  if (idx !== -1) {
    console.info(`Overriding already registered plugin ${plugin.name}`)
    plugins[idx] = plugin
  }
  else {
    plugins.push(plugin)
  }

  // 2. Create component render functions maps
  try {
    registerComponents(plugin)
  }
  catch (ex: any) {
    console.warn(`Failed registering plugin <${plugin.name}>: ${ex?.message || 'unknown reason'}`)
    return
  }

  Registry.plugins = plugins
  Registry.actions = registerActions(plugins)
}


/**
 * Register a plugins components render functions for faster access in the rendering functionality.
 * Type and class of the topmost component can be derived from name and class of the plugin
 */
const registerComponents = (plugin: Plugin.Definition) => {
  const { componentEntry: entry = null } = plugin
  if (entry === null) {
    return
  }

  entry.type = entry?.type || plugin.name
  entry.class = entry?.class || plugin.class

  registerComponent(
    (entry.class === 'leaf') ? Registry.leafComponents : Registry.elementComponents,
    entry.type,
    entry
  )
}

const registerComponent = (components: Map<string, RegistryComponent>, compType: string, entry: Plugin.ComponentEntry, parent?: Plugin.ComponentEntry) => {

  if (components.has(compType)) {
    if (Registry.verbose) {
      console.info(`Already registered component ${compType} render function was replaced by another component render function with the same type!`)
    }
  }

  if (!entry.class) {
    console.info(`Component ${compType} is missing a class, using "text" as fallback type!`)
  }

  components.set(compType, {
    type: compType,
    class: entry.class || 'text',
    componentEntry: entry,
    parent: parent || null
  })

  const { children = [] } = entry
  children.forEach(childComponent => {
    if (!childComponent.type) {
      throw (new Error(`Child component of ${compType} is missing mandatory type!`))
    }

    registerComponent(
      components,
      `${compType}/${childComponent.type}`, // Aggregated type identifier (e.g. core/image/caption)
      childComponent,
      entry
    )
  })
}


/**
 * Register actions in an iterable array
 */
const registerActions = (plugins: Plugin.Definition[]) => {
  const actions: RegistryAction[] = []

  plugins
    .filter(plugin => Array.isArray(plugin.actions) && plugin.actions.length)
    .forEach((plugin) => {
      plugin.actions?.forEach(action => {
        actions.push({
          plugin,
          isHotkey: action.hotkey ? isHotKey(action.hotkey) : () => false,
          ...action
        })
      })
    })

  return actions
}
