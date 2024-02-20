import { Editor } from "slate"
import { Plugin } from "../../../types"
import { pasteToConsumers } from "@/lib/pasteToConsumer"

type Consumers = {
  consumes: Plugin.ConsumesFunction
  consume: Plugin.ConsumeFunction
}[]

export const withInsertText = (editor: Editor, plugins: Plugin.Definition[]) => {
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
    if (handle instanceof Promise === false) {
      // Fallback to Slate
      insertText(text)
      return
    }

    handle.then(response => {
      const newText = typeof response === 'string' ? response : text
      insertText(newText)
    })
    return
  }

  return editor
}
