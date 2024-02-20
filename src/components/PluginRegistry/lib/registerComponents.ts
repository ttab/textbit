import { Plugin } from '@/types'
import { PluginRegistryComponent } from './types'

/**
 * Register a plugin component and it's component child components recursively
 *
 * @param components
 * @param componentType
 * @param entry
 * @returns Map<string, PluginRegistryComponent>
 */
export const registerComponents = (
  currentComponents: Map<string, PluginRegistryComponent>,
  componentType: string,
  entry: Plugin.ComponentEntry
) => {
  const components: Map<string, PluginRegistryComponent> = new Map()
  currentComponents.forEach((entry, key) => {
    components.set(key, entry)
  })

  registerComponent(components, componentType, entry)
  return components
}

const registerComponent = (
  components: Map<string, PluginRegistryComponent>,
  componentType: string,
  entry: Plugin.ComponentEntry, parent?: Plugin.ComponentEntry) => {
  if (components.has(componentType)) {
    // if (Registry.verbose) {
    //   console.info(`Already registered component ${compType} render function was replaced by another component render function with the same type!`)
    // }
  }

  if (!entry.class) {
    // Every component must have a class defined
    console.info(`Component ${componentType} is missing a class, using "text" as fallback type!`)
  }

  components.set(componentType, {
    type: componentType,
    class: entry.class || 'text',
    componentEntry: entry,
    parent: parent || null
  })

  const { children = [] } = entry
  children.forEach(childComponent => {
    if (!childComponent.type) {
      throw (new Error(`Child component of ${componentType} is missing mandatory type!`))
    }

    registerComponent(
      components,
      `${componentType}/${childComponent.type}`, // Aggregated type identifier (e.g. core/image/caption)
      childComponent,
      entry
    )
  })
}
