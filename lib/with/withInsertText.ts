import { Editor } from 'slate'
import type { PluginDefinition, ElementDefinition, ConsumesFunction, ConsumeFunction } from '../types'
import { pasteToConsumers } from '../utils/pasteToConsumer'
import { TextbitPlugin } from '../utils/textbit-plugin'

type Consumers = {
  consumes: ConsumesFunction
  consume: ConsumeFunction
}[]

export function withInsertText(editor: Editor, plugins: PluginDefinition[]) {
  const { insertText } = editor

  const consumers: Consumers = plugins
    .filter((plugin): plugin is ElementDefinition => TextbitPlugin.isElementPlugin(plugin) && !!plugin.consumer?.consume && !!plugin.consumer?.consumes)
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

    void handle.then((response) => {
      const newText = typeof response === 'string' ? response : text
      insertText(newText)
    })
    return
  }

  return editor
}
