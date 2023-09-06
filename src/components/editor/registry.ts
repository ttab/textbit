import isHotKey from 'is-hotkey'

import { MimerComponent, MimerPlugin, RenderElementFunction, RenderLeafFunction } from './types'

export type RegistryComponent = {
    type: string
    class: string
    component: MimerComponent
}

export interface Registry {
    plugins: MimerPlugin[]
    leafComponents: Map<string, RegistryComponent>
    elementComponents: Map<string, RegistryComponent>
    normalizers: Normalizer[]
    actions: Action[]
    events: EventHandler[]
    hooks: Hook[]
    addPlugin: (plugins: MimerPlugin) => void,
    registerHooks: (plugins: Hook[]) => void
}


/**
 * Add plugin and register all it's functions/handlers.
 * Always replaces plugins with same name.
 * 
 * @param plugin 
 */
const addPlugin = (plugin: MimerPlugin) => {
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
        [Registry.leafComponents, Registry.elementComponents] = registerComponents(plugins)
    }
    catch (ex: any) {
        console.log(`Failed registering plugin <${plugin.name}>: ${ex?.message || 'unknown reason'}`)
        return
    }



    const actions = registerActions(plugins)
    const normalizers = registerNormalizers(plugins)
    const eventHandlers = registerEventHandlers(plugins)

    // 2. Add normalizers for these renderers
    Registry.normalizers = normalizers

    // 3. Add events and actions to create nodes for above rendereres and normalizers
    Registry.events = eventHandlers
    Registry.actions = actions
    Registry.plugins = plugins
}

const registerHooks = (hooks: Hook[]) => {
    if (!Array.isArray(hooks)) {
        return
    }

    Registry.hooks = hooks.map((hook) => {
        return {
            on: hook.on,
            for: Array.isArray(hook.for) ? hook.for : [hook.for],
            handler: hook.handler
        }
    })
}

/**
 * Register a plugins components render functions for faster access in the rendering functionality.
 * Type and class of the topmost component can be derived from name and class of the plugin
 */
const registerComponents = (plugins: MimerPlugin[]) => {
    const leafs: Map<string, RegistryComponent> = new Map()
    const elems: Map<string, RegistryComponent> = new Map()

    plugins.forEach(plugin => {
        const { component = null } = plugin
        if (component === null) {
            return
        }

        component.type = component?.type || plugin.name
        component.class = component?.class || plugin.class

        registerComponent(
            (component.class === 'leaf') ? leafs : elems,
            component.type,
            component
        )
    })

    return [leafs, elems]
}

const registerComponent = (renderers: Map<string, RegistryComponent>, compType: string, component: MimerComponent) => {
    const { components = [] } = component

    if (renderers.has(compType)) {
        console.warn(`Already registered component ${compType} render function was replaced by another component render function with the same type!`)
    }

    if (!component.class) {
        throw (new Error(`Component ${compType} is missing a class!`))
    }

    renderers.set(compType, {
        type: compType,
        class: component.class,
        component: component
    })

    components.forEach(childComponent => {
        if (!childComponent.class || !childComponent.type) {
            throw (new Error(`Child component of ${compType} is missing mandatory type and/or class!`))
        }

        registerComponent(
            renderers,
            `${compType}/${childComponent.type}`, // Aggregated type identifier (e.g. core/image/caption)
            childComponent
        )
    })
}


// const registerRenderers = (plugins: MimerPlugin[]): [MimerRegistryRenderer[], MimerRegistryRenderer[]] => {
//     const leafRenderers: MimerRegistryRenderer[] = []
//     const elementRenderers: MimerRegistryRenderer[] = []


//     // Register leaf renderers
//     plugins
//         .filter(plugin => plugin.class === 'leaf')
//         .forEach(plugin => {
//             // If no leaf renderer exists create a default one that returns
//             // undefined and thus will fallback to default leaf renderer.
//             // FIXME: This could make bold/italic/etc work even when not registered.
//             registerLeafRenderer(plugin, leafRenderers)
//         })

//     // Register element renderers
//     plugins
//         .filter(plugin => {
//             return plugin.class !== 'leaf' && Array.isArray(plugin.components) && plugin.components.length
//         })
//         .forEach(plugin => {
//             (plugin.components || []).forEach(component => {
//                 const isParent = !component.type
//                 elementRenderers.push({
//                     type: isParent ? plugin.name : `${plugin.name}/${component.type}`,
//                     placeholder: plugin.placeholder || '',
//                     class: component.class ? component.class : plugin.class,
//                     render: component.render
//                 })
//             })
//         })

//     return [leafRenderers, elementRenderers]
// }

const registerNormalizers = (plugins: MimerPlugin[]) => {
    const normalizers: Normalizer[] = []

    plugins.forEach(plugin => {
        if (!plugin.normalize) {
            return
        }

        normalizers.push({
            name: plugin.name,
            class: plugin.class,
            normalize: plugin.normalize
        })
    })

    return normalizers
}

const registerActions = (plugins: MimerPlugin[]) => {
    const actions: Action[] = []

    plugins
        .filter(plugin => Array.isArray(plugin.actions) && plugin.actions.length)
        .forEach((plugin) => {
            actions.push(...(plugin.actions || []).map(action => {
                return {
                    name: plugin.name,
                    class: plugin.class,
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

const registerEventHandlers = (plugins: MimerPlugin[]) => {
    const eventHandlers: EventHandler[] = []

    plugins
        .filter(plugin => Array.isArray(plugin.events) && plugin.events.length)
        .forEach((plugin) => {
            eventHandlers.push(...(plugin.events || []).map(({ on, handler, match = undefined }) => {
                return {
                    name: plugin.name,
                    class: plugin.class,
                    on,
                    handler,
                    match
                }
            }))
        })

    return eventHandlers
}


export const Registry: Registry = {
    plugins: <MimerPlugin[]>[],
    leafComponents: <Renderer[]>[],
    elementComponents: <Renderer[]>[],
    normalizers: <Normalizer[]>[],
    actions: <Action[]>[],
    events: <EventHandler[]>[],
    hooks: <Hook[]>[],
    addPlugin,
    registerHooks
}

function registerLeafRenderer(plugin: MimerPlugin, leafRenderers: MimerRegistryRenderer[]) {
    if (!Array.isArray(plugin.components) || !plugin.components.length) {
        leafRenderers.push({
            type: plugin.name,
            class: plugin.class,
            render: () => undefined
        })
    }

    // Register all normal leaf renderers, always "leaf" as class!
    (plugin.components || []).forEach(component => {
        const isParent = !component.type || component.type === plugin.name
        Registry.leafComponents.push({
            type: isParent ? plugin.name : `${plugin.name}/${component.type}`,
            class: plugin.class,
            render: component.render
        })
    })
}
