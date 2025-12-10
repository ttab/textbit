import type { PluginDefinition } from '../../../types'

/**
 * Register a plugin, always replaces plugins with same name.
 *
 * @param registryPlugins PluginDefinition[]
 * @param plugin PluginDefinition[]
 * @returns PluginDefinition[]
 */
export function registerPlugin(registryPlugins: PluginDefinition[], plugin: PluginDefinition, options?: { verbose: boolean }) {
  if (options?.verbose) {
    console.info(`Registering plugin ${plugin.name}`)
  }

  const plugins = [...registryPlugins]
  const idx = plugins.findIndex((existingPlugin) => existingPlugin.name === plugin.name)
  if (idx !== -1) {
    console.warn(`%c Overriding already registered plugin ${plugin.name}`)
    plugins[idx] = plugin
  } else {
    plugins.push(plugin)
  }

  return plugins
}
