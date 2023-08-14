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

const registerRenderers = (plugins: MimerPlugin[]) => {
    const leafRenderers: Renderer[] = []
    const elementRenderers: Renderer[] = []

    // Register leaf renderers
    plugins
        .filter(el => el.class === 'leaf')
        .forEach(el => {
            // If no leaf renderer exist create a default one that returns
            // undefined and thus will fallback to default leaf renderer
            if (!Array.isArray(el.components) || !el.components.length) {
                leafRenderers.push({
                    name: el.name,
                    class: el.class,
                    render: () => undefined
                })
            }

            // Register all normal leaf renderers, always "leaf" as class!
            (el.components || []).forEach(r => {
                const isParent = !r.name || r.name === el.name
                Registry.leafRenderers.push({
                    name: isParent ? el.name : `${el.name}--${r.name}`,
                    class: el.class,
                    render: r.render
                })
            })
        })

    // Register element renderers
    plugins
        .filter(el => {
            return el.class !== 'leaf' && Array.isArray(el.components) && el.components.length
        })
        .forEach(el => {
            (el.components || []).forEach(r => {
                const isParent = !r.name
                elementRenderers.push({
                    name: isParent ? el.name : `${el.name}--${r.name}`,
                    placeholder: el.placeholder || '',
                    class: r.class ? r.class : el.class,
                    render: r.render
                })
            })
        })

    return [leafRenderers, elementRenderers]
}

const registerNormalizers = (plugins: MimerPlugin[]) => {
    const normalizers: Normalizer[] = []

    plugins
        .filter(el => typeof el.normalize === 'function')
        .forEach(el => {
            normalizers.push({
                name: el.name,
                class: el.class,
                normalize: el.normalize as NormalizeFunction
            })
        })

    return normalizers
}

const registerActions = (plugins: MimerPlugin[]) => {
    const actions: Action[] = []

    plugins
        .filter(el => Array.isArray(el.actions) && el.actions.length)
        .forEach((el: MimerPlugin) => {
            actions.push(...(el.actions || []).map(action => {
                return {
                    name: el.name,
                    class: el.class,
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
        .filter(el => Array.isArray(el.events) && el.events.length)
        .forEach((el: MimerPlugin) => {
            eventHandlers.push(...(el.events || []).map(({ on, handler, match = undefined }) => {
                return {
                    name: el.name,
                    class: el.class,
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