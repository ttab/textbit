import { Plugin } from '@/types'
import { PluginRegistryComponent } from './types'
import { globals } from '@/lib/globals'

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
  entry: Plugin.ComponentEntry,
  options?: { verbose: boolean }
) => {
  const components: Map<string, PluginRegistryComponent> = new Map()
  currentComponents.forEach((entry, key) => {
    components.set(key, entry)
  })

  registerComponent(components, componentType, entry, options || {})
  return components
}

const registerComponent = (
  components: Map<string, PluginRegistryComponent>,
  componentType: string,
  entry: Plugin.ComponentEntry,
  options: {
    verbose?: boolean,
    parent?: Plugin.ComponentEntry
  }
) => {
  if (components.has(componentType)) {
    if (options.verbose) {
      console.info(
        `%c Component ${componentType} render function overrided by new render component with the same type`,
        globals.consoleInfoWarningCSS
      )
    }
  }

  if (!entry.class) {
    // Every component must have a class defined
    console.warn(`Component ${componentType} is missing a class, using "text" as fallback type`)
  }

  components.set(componentType, {
    type: componentType,
    class: entry.class || 'text',
    componentEntry: entry,
    parent: options?.parent || null
  })

  const { children = [] } = entry
  children.forEach(childComponent => {
    if (!childComponent.type) {
      throw (new Error(`Child component of ${componentType} is missing mandatory type`))
    }

    registerComponent(
      components,
      `${componentType}/${childComponent.type}`, // Aggregated type identifier (e.g. core/image/caption)
      childComponent,
      {
        verbose: options.verbose,
        parent: entry
      }
    )
  })
}
