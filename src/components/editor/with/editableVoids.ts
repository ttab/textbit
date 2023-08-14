import { Descendant, Editor, Element } from 'slate'
import { MimerPlugin, Renderer } from '../../../types'
import { MimerRegistry } from '../registry'

const types: string[] = []

export const withEditableVoids = (editor: Editor, nodes: Descendant[], Registry: MimerRegistry) => {
    const { isVoid } = editor

    // All void block renderers
    const blocks: string[] = Registry.elementRenderers.filter(r => r.class === 'void').map(({ name: type }) => type)

    // All unknown elements in document are considered to be voids/not editable
    types.length = 0
    extractAllTypesFromDocument(nodes)
    const registeredTypes: string[] = [...Registry.elementRenderers, ...Registry.leafRenderers].map(({ name: type }) => { return type })
    const unknownTypesInDocument = types.filter(t => !registeredTypes.includes(t))

    editor.isVoid = (element: Element) => {
        if (unknownTypesInDocument.includes(element.name)) {
            return true
        }

        if (blocks.includes(element.name)) {
            return true
        }

        return isVoid(element)
    }

    return editor
}

const extractAllTypesFromDocument = (nodes: Descendant[]) => {
    nodes.forEach(n => {
        if (!Element.isElement(n) || !n.name) {
            return
        }

        if (!types.includes(n.name)) {
            types.push(n.name)
        }

        if (n.children.length) {
            extractAllTypesFromDocument(n.children)
        }
    })
}