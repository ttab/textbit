import React, {
  createContext,
  useReducer,
  PropsWithChildren
} from 'react'

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
import { useTextbit } from '../Textbit'

/*
 * Empty plugin registry state
*/
const initialState: PluginRegistryProviderState = {
  plugins: [],
  leafComponents: new Map(),
  elementComponents: new Map(),
  actions: [],
  dispatch: () => { }
}

export const PluginRegistryContext = createContext(initialState)


/**
 * Plugin registry reducer
 * @param state
 * @param action
 * @returns
 */
const reducer = (state: PluginRegistryProviderState, message: PluginRegistryReducerAction): PluginRegistryProviderState => {
  const { action, plugin } = message
  const { verbose } = useTextbit()

  if (action === 'delete') {
    console.warn('Deleting plugins from plugin registry not implemented')
    return state
  }

  return {
    ...state,
    ...addPlugin(state, plugin, { verbose })
  }
}


// Create the context provider component
export const PluginRegistryContextProvider = ({ children, plugins }: PropsWithChildren & { plugins: Plugin.Definition[] }): JSX.Element => {
  const { verbose } = useTextbit()
  const initPlugins = initializePlugins(initialState, plugins, { verbose })
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
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
  leafComponents: Map<string, PluginRegistryComponent>
  elementComponents: Map<string, PluginRegistryComponent>
} {
  const plugins = registerPlugin(state.plugins, newPlugin, options)
  const actions = registerActions(plugins)

  const ceClass = newPlugin?.componentEntry?.class
  const leafComponents = (newPlugin?.componentEntry && ceClass === 'leaf')
    ? registerComponents(state.leafComponents, newPlugin.componentEntry?.type || newPlugin.name, newPlugin.componentEntry, options)
    : state.leafComponents
  const elementComponents = (newPlugin?.componentEntry && ceClass !== 'leaf')
    ? registerComponents(state.elementComponents, newPlugin.componentEntry?.type || newPlugin.name, newPlugin.componentEntry, options)
    : state.elementComponents

  return {
    plugins,
    actions,
    leafComponents,
    elementComponents
  }
}


// Initialize with all incoming plugins
function initializePlugins(state: PluginRegistryProviderState, plugins: Plugin.Definition[], options?: { verbose: boolean }): {
  plugins: Plugin.Definition[]
  actions: PluginRegistryAction[]
  leafComponents: Map<string, PluginRegistryComponent>
  elementComponents: Map<string, PluginRegistryComponent>
} {
  plugins.forEach(p => {
    state.plugins = registerPlugin(state.plugins, p, options)
    state.actions = registerActions(state.plugins)

    const ceClass = p?.componentEntry?.class

    if (p?.componentEntry && ceClass === 'leaf') {
      state.leafComponents = registerComponents(state.leafComponents, p.componentEntry?.type || p.name, p.componentEntry, options)
    } else if (p?.componentEntry && ceClass !== 'leaf') {
      state.elementComponents = registerComponents(state.elementComponents, p.componentEntry?.type || p.name, p.componentEntry, options)
    }
  })

  return {
    ...state
  }
}
