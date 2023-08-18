import { Descendant, Editor, Element } from 'slate'
import { MimerPlugin, Renderer } from '../../../types'
import { MimerRegistry } from '../registry'

const types: string[] = []

export const withEditableVoids = (editor: Editor, nodes: Descendant[], Registry: MimerRegistry) => {
    const { isVoid } = editor

    // All registered void block renderers
    const blocks: string[] = Registry.elementRenderers.filter(r => r.class === 'void').map(({ type }) => type)

    // If an element type exist in the document but does not have a registered renderer
    // the elementis considered to be av oid / not editable element.
    types.length = 0
    extractAllTypesFromDocument(nodes)
    const registeredTypes: string[] = [...Registry.elementRenderers, ...Registry.leafRenderers].map(({ type }) => { return type })
    const unknownTypesInDocument = types.filter(t => !registeredTypes.includes(t))

    editor.isVoid = (element: Element) => {
        if (unknownTypesInDocument.includes(element.type)) {
            return true
        }

        if (blocks.includes(element.type)) {
            return true
        }

        return isVoid(element)
    }

    return editor
}

const extractAllTypesFromDocument = (nodes: Descendant[]) => {
    nodes.forEach(n => {
        if (!Element.isElement(n) || !n.type) {
            return
        }

        if (!types.includes(n.type)) {
            types.push(n.type)
        }

        if (n.children.length) {
            extractAllTypesFromDocument(n.children)
        }
    })
}