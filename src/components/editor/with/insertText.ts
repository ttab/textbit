import { Editor } from "slate"
import { MimerPlugin } from "../types"

type EventHandlerFunc = (editor: Editor, text: string) => true | void

export const withInsertText = (editor: Editor, plugins: MimerPlugin[]) => {
    const { insertText } = editor

    const eventHandlers: Array<EventHandlerFunc | undefined> = plugins.filter((plugin: MimerPlugin) => {
        return !!plugin?.events?.onInsertText
    }).map((plugin) => {
        return plugin.events?.onInsertText
    })

    editor.insertText = (text) => {
        for (const handler of eventHandlers) {
            // If eventHandler returns true, it has handled it
            if (handler && true === handler(editor, text)) {
                return
            }
        }
        return insertText(text)
    }

    return editor
}