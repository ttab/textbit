import type { Plugin } from '../../../types'
import type { PluginRegistryAction } from './types'
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
        const isHotkeyForAction = (typeof action.hotkey === 'string')
          ? isHotkey(action.hotkey)
          : () => false

        actions.push({
          plugin,
          isHotkey: isHotkeyForAction,
          ...action,
          name: `${plugin.name}/${action.name}`
        })
      })
    })

  return actions
}
