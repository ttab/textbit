import { Editor, Element } from 'slate'

export const withInline = (editor: Editor) => {
    const { isInline } = editor

    editor.isInline = (element: Element) => {
        return element.class === 'inline' ? true : isInline(element)
    }

    return editor
}