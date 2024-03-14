import React, { createContext, useReducer, PropsWithChildren } from 'react'

import { registerPlugin } from './lib/registerPlugin'
import { registerComponents } from './lib/registerComponents'

import type {
  PluginRegistryComponent,
  PluginRegistryAction,
  PluginRegistryProviderState,
  PluginRegistryReducerAction
} from './lib/types'
import { registerActions } from './lib/registerAction'
import { Plugin } from '@/types'
import { TextbitPlugin } from '@/lib'

/*
 * Empty plugin registry state
*/
const initialState = (): PluginRegistryProviderState => {
  return {
    plugins: [],
    components: new Map(),
    actions: [],
    verbose: false,
    dispatch: () => { }
  }
}

export const PluginRegistryContext = createContext(initialState())


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
export const PluginRegistryContextProvider = ({ children, verbose, plugins }: PropsWithChildren & {
  verbose: boolean
  plugins: Plugin.Definition[]
}): JSX.Element => {
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
function addPlugin(state: PluginRegistryProviderState, newPlugin: Plugin.Definition, options?: { verbose: boolean }): {
  plugins: Plugin.Definition[]
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
} {
  const plugins = registerPlugin(state.plugins, newPlugin, options)
  const actions = registerActions(plugins)

  const components = (TextbitPlugin.isElementPlugin(newPlugin) && newPlugin?.componentEntry)
    ? registerComponents(state.components, newPlugin.componentEntry?.type || newPlugin.name, newPlugin.componentEntry, options)
    : state.components

  return {
    plugins,
    actions,
    components
  }
}


// Initialize with all incoming plugins
function initializePlugins(state: PluginRegistryProviderState, plugins: Plugin.Definition[], options?: { verbose: boolean }): {
  plugins: Plugin.Definition[]
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
} {
  plugins.forEach(p => {
    state.plugins = registerPlugin(state.plugins, p, options)
    state.actions = registerActions(state.plugins)

    if (TextbitPlugin.isElementPlugin(p) && p?.componentEntry) {
      const comp = registerComponents(state.components, p.componentEntry?.type || p.name, p.componentEntry, options)
      state.components = comp
    }
  })

  return {
    ...state
  }
}
