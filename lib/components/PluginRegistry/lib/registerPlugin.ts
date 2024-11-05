import type { Plugin } from '../../../types'
import { globals } from '../../../lib/globals'

/**
 * Register a plugin, always replaces plugins with same name.
 *
 * @param registryPlugins Plugin.Definition[]
 * @param plugin Plugin.Definition[]
 * @returns Plugin.Definition[]
 */
export function registerPlugin(registryPlugins: Plugin.Definition[], plugin: Plugin.Definition, options?: { verbose: boolean }) {
  if (options?.verbose) {
    console.info(`Registering plugin ${plugin.name}`)
  }

  const plugins = [...registryPlugins]
  const idx = plugins.findIndex((existingPlugin => existingPlugin.name === plugin.name))
  if (idx !== -1) {
    console.info(
      `%c Overriding already registered plugin ${plugin.name}`,
      globals.consoleInfoWarningCSS
    )
    plugins[idx] = plugin
  }
  else {
    plugins.push(plugin)
  }

  return plugins
}
