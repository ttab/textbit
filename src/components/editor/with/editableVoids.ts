import { Descendant, Editor, Element } from 'slate'
import { MimerRegistry } from '../registry'

const types: string[] = []

export const withEditableVoids = (editor: Editor, nodes: Descendant[], Registry: MimerRegistry) => {
    const { isVoid } = editor

    const allComponents: string[] = []
    const voidComponents: string[] = []

    Registry.elementComponents.forEach(elemComponent => {
        allComponents.push(elemComponent.type)

        if (elemComponent.class === 'void') {
            voidComponents.push(elemComponent.type)
        }
    })

    editor.isVoid = (element: Element) => {
        if (voidComponents.includes(element.type)) {
            return true
        }

        if (!allComponents.includes(element.type)) {
            // Element types without registered component is considered a void element
            return true
        }

        return isVoid(element)
    }

    return editor
}