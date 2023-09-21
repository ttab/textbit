import { Editor, Element, Node, Range, Transforms } from "slate"
import { MimerPlugin } from "../types"

export const withInsertText = (editor: Editor, plugins: MimerPlugin[]) => {
    const { insertText } = editor

    const consumers = plugins
        .filter(({ consumer }) => consumer?.consume && consumer?.consumes)
        .map(({ consumer }) => consumer)

    editor.insertText = (text) => {
        for (const consumer of consumers) {
            const input = {
                source: 'text',
                type: 'text/plain',
                data: text
            }

            const [accept, output = undefined] = consumer?.consumes({ input }) || [false]

            if (accept) {
                consumer?.consume({ input, editor }).then((result) => {
                    if (typeof result === 'object' && output === result.type) {
                        insertNodes(editor, result)
                    }
                    else if (typeof result === 'string' && output === 'text/plain') {
                        insertText(result)
                    }
                    else if (result !== false) {
                        insertText(input.data)
                    }
                })
                return
            }
        }

        insertText(text)
    }

    return editor
}

function insertNodes(editor: Editor, object: any) {
    if (!Range.isRange(editor.selection)) {
        return
    }

    const range = Editor.unhangRange(editor, editor.selection)
    let at = (range && range.anchor.path[0] > 0) ? range.anchor.path[0] : 0
    const node = Node.get(editor, [at])

    if (!Element.isElement(node)) {
        return
    }

    if (node?.class === 'text' && Editor.string(editor, [at]) === '') {
        // This highest level node is a text node and is empty, remove it
        Transforms.removeNodes(editor, { at: [at] })
    }
    else {
        // When not touching current node, put it after current node
        at++
    }

    Transforms.insertNodes(
        editor,
        object,
        { at: [at], select: true }
    )
}