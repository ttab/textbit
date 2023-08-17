import { Editor, Transforms } from 'slate'
import * as uuid from 'uuid'

export const withInsertHtml = (editor: Editor) => {
    const { insertData } = editor

    editor.insertData = (data) => {
        const html = data.getData('text/html')
        const text = data.getData('text/plain')

        if (html) {
            const paragraphedText = text.replace(/[\r\n]{2,}/g, "\n")

            const paragraphs = paragraphedText.split("\n").map((s) => {
                return {
                    type: 'core/paragraph',
                    id: uuid.v4(),
                    class: 'text',
                    children: [
                        { text: s }
                    ],
                }
            })

            if (Array.isArray(paragraphs) && paragraphs.length) {
                Transforms.insertFragment(editor, paragraphs)
                return
            }
        }

        insertData(data)
    }
}