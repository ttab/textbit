import isHotKey from 'is-hotkey'

import {
    MimerPlugin,
    NormalizeFunction,
    Hook,
    Renderer,
    Normalizer,
    Action,
    EventHandler
} from '../../types'


/**
 * Add plugin and register all it's functions/handlers.
 * Always replaces plugins with same name.
 * 
 * @param plugin 
 */
const addPlugin = (plugin: MimerPlugin) => {
    const plugins = [...Registry.plugins.filter(p => p.name !== plugin.name), plugin]
    const [leafRenderers, elementRenderers] = registerRenderers(plugins)
    const actions = registerActions(plugins)
    const normalizers = registerNormalizers(plugins)
    const eventHandlers = registerEventHandlers(plugins)

    // 1. Add renderers
    Registry.leafRenderers = leafRenderers
    Registry.elementRenderers = elementRenderers

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
 * Register element (node) type render functions. Loops over components and register
 * their render functions for specific node types. If no type is specified (default
 * component for the plugin) the node type is derived from the plugin name.
 */
const registerRenderers = (plugins: MimerPlugin[]): [Renderer[], Renderer[]] => {
    const leafRenderers: Renderer[] = []
    const elementRenderers: Renderer[] = []

    // Register leaf renderers
    plugins
        .filter(plugin => plugin.class === 'leaf')
        .forEach(plugin => {
            // If no leaf renderer exists create a default one that returns
            // undefined and thus will fallback to default leaf renderer.
            // FIXME: This could make bold/italic/etc work even when not registered.
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
                Registry.leafRenderers.push({
                    type: isParent ? plugin.name : `${plugin.name}/${component.type}`,
                    class: plugin.class,
                    render: component.render
                })
            })
        })

    // Register element renderers
    plugins
        .filter(plugin => {
            return plugin.class !== 'leaf' && Array.isArray(plugin.components) && plugin.components.length
        })
        .forEach(plugin => {
            (plugin.components || []).forEach(component => {
                const isParent = !component.type
                elementRenderers.push({
                    type: isParent ? plugin.name : `${plugin.name}/${component.type}`,
                    placeholder: plugin.placeholder || '',
                    class: component.class ? component.class : plugin.class,
                    render: component.render
                })
            })
        })

    return [leafRenderers, elementRenderers]
}

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


export type MimerRegistry = {
    plugins: MimerPlugin[]
    leafRenderers: Renderer[]
    elementRenderers: Renderer[]
    normalizers: Normalizer[]
    actions: Action[]
    events: EventHandler[]
    hooks: Hook[]
    addPlugin: (plugins: MimerPlugin) => void,
    registerHooks: (plugins: Hook[]) => void
}

export const Registry: MimerRegistry = {
    plugins: <MimerPlugin[]>[],
    leafRenderers: <Renderer[]>[],
    elementRenderers: <Renderer[]>[],
    normalizers: <Normalizer[]>[],
    actions: <Action[]>[],
    events: <EventHandler[]>[],
    hooks: <Hook[]>[],
    addPlugin,
    registerHooks
}