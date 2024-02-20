import { Plugin } from '@/types'
import { PluginRegistryAction } from './types'
import { isHotkey } from 'is-hotkey'

/**
 * Register all actions and hotkeys with references to each hotkeys plugin
 *
 * @param plugins Plugin.Definition[]
 * @returns PluginRegistryAction[]
 */
export const registerActions = (plugins: Plugin.Definition[]) => {
  const actions: PluginRegistryAction[] = []

  plugins
    .filter(plugin => Array.isArray(plugin.actions) && plugin.actions.length)
    .forEach((plugin) => {
      plugin.actions?.forEach(action => {
        actions.push({
          plugin,
          isHotkey: action.hotkey ? isHotkey(action.hotkey) : () => false,
          ...action
        })
      })
    })

  return actions
}
