import { Editor } from "slate"
import { InputEventFunction } from "../../../types"

export const withInsertText = (editor: Editor, eventHandlers: InputEventFunction[]) => {
    const { insertText } = editor

    editor.insertText = (text) => {
        for (const handler of eventHandlers) {
            if (false === handler(editor, text)) {
                return
            }
        }
        return insertText(text)
    }

    return editor
}