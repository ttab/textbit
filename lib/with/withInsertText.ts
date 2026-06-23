import { Editor } from 'slate'
import type { PluginDefinition, ElementDefinition, ConsumesFunction, ConsumeFunction } from '../types'
import { pasteToConsumers } from '../utils/pasteToConsumer'
import { TextbitPlugin } from '../utils/textbit-plugin'
import { selectionStartsOutsideBlockEndsInside } from '../utils/blockBoundarySelection'

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
    // A selection that starts outside a block and ends inside one is left
    // intact on purpose; typing over it would merge nodes that don't belong
    // together, so block the insert entirely (mirrors the deleteFragment guard
    // in withDeletionManagement).
    if (selectionStartsOutsideBlockEndsInside(editor)) {
      return
    }

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
