import { Editor, Transforms, Range } from "slate"
import * as uuid from 'uuid'

import { Element as SlateElement, BaseRange } from 'slate'

export const withInsertBreak = (editor: Editor) => {
    const { insertBreak } = editor

    editor.insertBreak = () => {
        const { selection } = editor

        if (!selection) {
            // Not sure this can happen, but use default behaviour
            return insertBreak()
        }

        const matches = Array.from(
            Editor.nodes(editor, {
                at: Editor.unhangRange(editor, selection as BaseRange),
                match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.class !== 'inline'
            })
        )

        // Handle common case where <enter> should by default create paragraph and not same as current node
        // But only if on the highest level (not in a blockquote sub element for example)
        if (Range.isCollapsed(selection) && matches.length < 2) {
            // New nodes should be paragraph with a newly generated id
            return Transforms.insertNodes(editor, {
                id: uuid.v4(),
                class: 'text',
                type: 'core/paragraph',
                children: [{ text: "" }]
            })
        }

        return insertBreak()
    }

    return editor
}