import isHotKey from 'is-hotkey'

import { TBActionHandlerProps, TBComponent, TBPlugin, TBToolFunction } from '../../types/types'
import { Element } from 'slate'

export type RegistryComponent = {
  type: string
  class: string
  component: TBComponent
  parent: TBComponent | null
}

export type RegistryAction = {
  plugin: TBPlugin
  hotkey: string
  isHotkey: (action: any) => boolean
  title: string
  description: string
  tool: JSX.Element | Array<JSX.Element | TBToolFunction> | null
  handler: (props: TBActionHandlerProps) => void | boolean,
  visibility?: (element: Element, rootElement?: Element) => [boolean, boolean, boolean]
}

export interface RegistryInterface {
  // Main registry of plugins
  plugins: TBPlugin[]

  // Provides faster access in rendering cycles
  leafComponents: Map<string, RegistryComponent>
  elementComponents: Map<string, RegistryComponent>

  // Provides faster access to actions and keyboard shortcuts
  actions: RegistryAction[]

  // Output verbose info on console on what is happening
  verbose: boolean

  // Add one plugin
  addPlugin: (plugin: TBPlugin) => void

  // Initialize Registry and add all incoming plugins
  initialize: (Registry: RegistryInterface, plugins: TBPlugin[], verbose: boolean) => void
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
export function initialize(registry: RegistryInterface, plugins: TBPlugin[], verbose: boolean) {
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
function addPlugin(plugin: TBPlugin) {
  if (Registry.verbose) {
    console.info(`Registering plugin ${plugin.name}`)
  }

  // 1. Create new list of plugins, override old instance of a plugin if already registered, preserve order
  const plugins = [...Registry.plugins]
  const idx = plugins.findIndex((existingPlugin => existingPlugin.name === plugin.name))
  if (idx !== -1) {
    if (Registry.verbose) {
      console.warn(`Overriding already registered plugin ${plugin.name}`)
    }
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
    console.log(`Failed registering plugin <${plugin.name}>: ${ex?.message || 'unknown reason'}`)
    return
  }

  Registry.plugins = plugins
  Registry.actions = registerActions(plugins)
}


/**
 * Register a plugins components render functions for faster access in the rendering functionality.
 * Type and class of the topmost component can be derived from name and class of the plugin
 */
const registerComponents = (plugin: TBPlugin) => {
  const { component = null } = plugin
  if (component === null) {
    return
  }

  component.type = component?.type || plugin.name
  component.class = component?.class || plugin.class

  registerComponent(
    (component.class === 'leaf') ? Registry.leafComponents : Registry.elementComponents,
    component.type,
    component
  )
}

const registerComponent = (components: Map<string, RegistryComponent>, compType: string, component: TBComponent, parent?: TBComponent) => {
  const { children = [] } = component

  if (components.has(compType)) {
    console.warn(`Already registered component ${compType} render function was replaced by another component render function with the same type!`)
  }

  if (!component.class) {
    console.warn(`Component ${compType} is missing a class, using "text" as fallback type!`)
  }

  components.set(compType, {
    type: compType,
    class: component.class || 'text',
    component: component,
    parent: parent || null
  })

  children.forEach(childComponent => {
    if (!childComponent.type) {
      throw (new Error(`Child component of ${compType} is missing mandatory type!`))
    }

    registerComponent(
      components,
      `${compType}/${childComponent.type}`, // Aggregated type identifier (e.g. core/image/caption)
      childComponent,
      component
    )
  })
}


/**
 * Register actions in an iterable array
 */
const registerActions = (plugins: TBPlugin[]) => {
  const actions: RegistryAction[] = []

  plugins
    .filter(plugin => Array.isArray(plugin.actions) && plugin.actions.length)
    .forEach((plugin) => {
      actions.push(...(plugin.actions || []).map(action => {
        return {
          plugin,
          hotkey: action.hotkey || '',
          isHotkey: action.hotkey ? isHotKey(action.hotkey) : () => false,
          title: action?.title || '',
          description: action?.title || '',
          tool: action.tool || null,
          handler: action.handler,
          visibility: action.visibility
        }
      }))
    })

  return actions
}
