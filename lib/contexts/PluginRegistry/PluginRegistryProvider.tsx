import { useReducer } from 'react'

import { registerPlugin } from './lib/registerPlugin'
import { registerComponents } from './lib/registerComponents'

import type {
  PluginRegistryComponent,
  PluginRegistryAction,
  PluginRegistryProviderState,
  PluginRegistryReducerAction
} from './lib/types'
import { registerActions } from './lib/registerAction'
import { TextbitPlugin } from '../../utils/textbit-plugin'
import { PluginDefinition } from '../../types'
import { initialState, PluginRegistryContext } from './PluginRegistryContext'

/**
 * Plugin registry reducer
 * @param state
 * @param action
 * @returns
 */
const reducer = (state: PluginRegistryProviderState, message: PluginRegistryReducerAction): PluginRegistryProviderState => {
  const { action, plugin } = message

  if (action === 'delete') {
    console.warn('Deleting plugins from plugin registry not implemented')
    return state
  }

  return {
    ...state,
    ...addPlugin(state, plugin, { verbose: state.verbose })
  }
}


// Create the context provider component
export function PluginRegistryProvider({ children, verbose, plugins }: {
  verbose: boolean
  plugins: PluginDefinition[]
  children: React.ReactNode
}) {
  const initPlugins = initializePlugins(initialState(), plugins, { verbose })
  const [state, dispatch] = useReducer(reducer, {
    ...initialState(),
    ...initPlugins
  })

  return (
    <PluginRegistryContext.Provider value={{ ...state, dispatch }}>
      {children}
    </PluginRegistryContext.Provider>
  )
}


// Add one plugin
function addPlugin(state: PluginRegistryProviderState, newPlugin: PluginDefinition, options?: { verbose: boolean }): {
  plugins: PluginDefinition[]
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
} {
  const plugins = registerPlugin(state.plugins, newPlugin, options)
  const actions = registerActions(plugins)

  const components = (TextbitPlugin.isElementPlugin(newPlugin) && newPlugin?.componentEntry)
    ? registerComponents(
      state.components,
      newPlugin.componentEntry?.type || newPlugin.name,
      newPlugin.componentEntry,
      options,
      newPlugin.options
    )
    : state.components

  return {
    plugins,
    actions,
    components
  }
}


// Initialize with all incoming plugins
function initializePlugins(state: PluginRegistryProviderState, plugins: PluginDefinition[], options?: { verbose: boolean }): {
  plugins: PluginDefinition[]
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
} {
  plugins.forEach((p) => {
    state.plugins = registerPlugin(state.plugins, p, options)
    state.actions = registerActions(state.plugins)

    if (TextbitPlugin.isElementPlugin(p) && p?.componentEntry) {
      const comp = registerComponents(state.components, p.componentEntry?.type || p.name, p.componentEntry, options, p.options)
      state.components = comp
    }
  })

  return {
    ...state
  }
}
