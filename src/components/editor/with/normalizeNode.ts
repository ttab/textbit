import { Editor, Element, NodeEntry } from "slate"
import { MimerComponent, MimerPlugin } from "../types"

type NormalizerFunc = (editor: Editor, entry: NodeEntry) => true | void
type NormalizerMap = Map<string, NormalizerFunc>

export const withNormalizeNode = (editor: Editor, plugins: MimerPlugin[]) => {
    const { normalizeNode } = editor

    // Store normalize event handlers in a Map for faster access. Each plugin have
    // only one normalizer which should be registered for each and every component.
    const normalizeHandlers: NormalizerMap = new Map()
    for (const plugin of plugins) {
        if (plugin?.events?.onNormalizeNode && plugin?.component) {
            addNormalizerForComponent(
                plugin.name,
                normalizeHandlers,
                plugin.events.onNormalizeNode,
                plugin.component
            )
        }
    }

    editor.normalizeNode = (entry) => {
        const [node] = entry

        // Normalization supported on Elements only as of now. If supported on
        // leafs, who should handle a leaf with formats e.g "core/bold, core/italic"?
        if (Element.isElement(node)) {
            const eventHandler = normalizeHandlers.get(node.type)
            if (eventHandler && true === eventHandler(editor, entry)) {
                // If eventHandler returns true, it has handled it
                return
            }
        }

        return normalizeNode(entry)
    }

    return editor
}

function addNormalizerForComponent(componentType: string, normalizers: NormalizerMap, normalizer: NormalizerFunc, component: MimerComponent) {
    normalizers.set(componentType, normalizer)

    // As for now we only support normalization to be handled by the plugin
    // (i.e the top component). If child components should have support for
    // normalization they should probably have their own event handlers, not
    // share with the plugin as below.

    // if (!Array.isArray(component?.children)) {
    //     return
    // }

    // component.children.forEach(childComponent => {
    //     addNormalizerForComponent(
    //         `${componentType}/${childComponent.type}`,
    //         normalizers,
    //         normalizer,
    //         childComponent
    //     )
    // })
}