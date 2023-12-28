import { Editor } from "slate"
import { TBConsumeFunction, TBConsumesFunction, TBPlugin } from "../../../types/types"
import { pasteToParagraphs } from "@/lib/pasteToParagraphs"
import { pasteToConsumers } from "@/lib/pasteToConsumer"

type Consumers = {
  consumes: TBConsumesFunction
  consume: TBConsumeFunction
}[]

export const withInsertText = (editor: Editor, plugins: TBPlugin[]) => {
  const { insertText } = editor

  const consumers: Consumers = plugins
    .filter(({ consumer }) => consumer?.consume && consumer?.consumes)
    .map(({ consumer }) => consumer) as Consumers

  editor.insertText = (text) => {
    const input = {
      source: 'text',
      type: 'text/plain',
      data: text
    }

    const handle = pasteToConsumers(editor, consumers, input)
    if (handle instanceof Promise) {
      handle.then(response => {
        const newText = typeof response === 'string' ? response : text
        insertText(text)
      })
      return
    }

    // Fallback to Slate
    insertText(text)
  }

  return editor
}
