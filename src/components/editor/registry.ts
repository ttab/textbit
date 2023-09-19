import isHotKey from 'is-hotkey'

import { MimerActionHandlerProps, MimerComponent, MimerPlugin, ToolFunction } from './types'

export type RegistryComponent = {
    type: string
    class: string
    component: MimerComponent
}

// export type RegistryEvent = {
//     handler: () => Promise<any[]>, // FIXME: How should this handler look, should it be a promise for both plugin/component event handlers?
//     plugin?: MimerPlugin
//     component?: MimerComponent
// }

export type RegistryAction = {
    plugin: MimerPlugin
    hotkey: string
    isHotkey: (action: any) => boolean
    title: string
    tool: JSX.Element | Array<JSX.Element | ToolFunction> | null
    handler: (props: MimerActionHandlerProps) => void | boolean
}

export interface RegistryInterface {
    // Main registry of plugins
    plugins: MimerPlugin[]

    // Provides faster access in rendering cycles
    leafComponents: Map<string, RegistryComponent>
    elementComponents: Map<string, RegistryComponent>

    // Provides faster access to the right receiver when events fire
    // events: Map<string, RegistryEvent>

    // Provides faster access to actions and keyboard shortcuts
    actions: RegistryAction[],

    addPlugin: (plugin: MimerPlugin) => void

    getConsumers: (plugins: MimerPlugin[], data: any, intent?: string) =>
        Array<{
            plugin: MimerPlugin
            produces: string | null
        }>
}

export const Registry: RegistryInterface = {
    plugins: [],
    leafComponents: new Map(),
    elementComponents: new Map(),
    actions: [],
    addPlugin,
    getConsumers
}

/**
 * Add plugin and register all it's functions/handlers.
 * Always replaces plugins with same name.
 * 
 * @param plugin 
 */
function addPlugin(plugin: MimerPlugin) {
    // 1. Create new list of plugins, override old instance of a plugin if already registered, preserve order
    const plugins = [...Registry.plugins]
    const idx = plugins.findIndex((existingPlugin => existingPlugin.name === plugin.name))
    if (idx !== -1) {
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
const registerComponents = (plugin: MimerPlugin) => {
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

const registerComponent = (components: Map<string, RegistryComponent>, compType: string, component: MimerComponent) => {
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
        component: component
    })

    children.forEach(childComponent => {
        if (!childComponent.type) {
            throw (new Error(`Child component of ${compType} is missing mandatory type!`))
        }

        registerComponent(
            components,
            `${compType}/${childComponent.type}`, // Aggregated type identifier (e.g. core/image/caption)
            childComponent
        )
    })
}


/**
 * Register actions in an iterable array
 */
const registerActions = (plugins: MimerPlugin[]) => {
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
                    tool: action.tool || null,
                    handler: action.handler
                }
            }))
        })


    return actions
}

// const registerNormalizers = (plugins: MimerPlugin[]) => {
//     const normalizers: Normalizer[] = []

//     plugins.forEach(plugin => {
//         if (!plugin.normalize) {
//             return
//         }

//         normalizers.push({
//             name: plugin.name,
//             class: plugin.class,
//             normalize: plugin.normalize
//         })
//     })

//     return normalizers
// }


// const registerEventHandlers = (plugins: MimerPlugin[]) => {
//     const eventHandlers: EventHandler[] = []

//     plugins
//         .filter(plugin => Array.isArray(plugin.events) && plugin.events.length)
//         .forEach((plugin) => {
//             eventHandlers.push(...(plugin.events || []).map(({ on, handler, match = undefined }) => {
//                 return {
//                     name: plugin.name,
//                     class: plugin.class,
//                     on,
//                     handler,
//                     match
//                 }
//             }))
//         })

//     return eventHandlers
// }

/**
 * Return a list of consumers for the specified indata
 */
function getConsumers(plugins: MimerPlugin[], data: any, intent?: string) {
    const consumers: Array<{
        plugin: MimerPlugin
        produces: string | null
    }> = []

    plugins.forEach(plugin => {
        if (typeof plugin.consumer?.consumes !== 'function' || typeof plugin.consumer?.consume !== 'function') {
            return
        }

        const [match, produces = undefined] = plugin.consumer.consumes({ input: data, intent })
        if (match) {
            consumers.push({
                plugin,
                produces: produces || null
            })
        }
    })

    return Array.from(consumers)
}