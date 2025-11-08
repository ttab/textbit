import { Editor, Element, Range } from 'slate'
import { pasteToParagraphs } from '../utils/pasteToParagraphs'
import type { ElementDefinition, ConsumesFunction, ConsumeFunction, PluginDefinition } from '../types/textbit'
import { pasteToConsumers } from '../utils/pasteToConsumer'
import type { PluginRegistryComponent } from '../contexts/PluginRegistry/lib/types'
import { TextbitPlugin } from '../utils/textbit-plugin'
import { getSelectedNodes } from '../utils/utils'

type Consumers = {
  consumes: ConsumesFunction
  consume: ConsumeFunction
}[]

export function withInsertHtml(
  editor: Editor,
  components: Map<string, PluginRegistryComponent>,
  plugins: PluginDefinition[]
) {
  const { insertData, insertText } = editor

  const consumers: Consumers = plugins
    .filter((plugin): plugin is ElementDefinition => TextbitPlugin.isElementPlugin(plugin) && !!plugin.consumer?.consume && !!plugin.consumer?.consumes)
    .map(({ consumer }) => consumer) as Consumers

  editor.insertData = (data) => {
    const { types } = data

    const { selection } = editor

    // Figure out if pasting contains line breaks and if that is allowed,
    // then we can't allow Slate to handle slate fragments. Instead we will
    // treat it as text and paste without linebreaks.
    let allowBreaks = true

    if (selection && Range.isCollapsed(selection)) {
      const nodes = getSelectedNodes(editor)
      const node = nodes.length && nodes[nodes.length - 1]
      if (Element.isElement(node)) {
        const component = components.get(node.type || '')
        allowBreaks = component?.componentEntry.constraints?.allowBreak ?? true
      }
    }

    // 1. Let slate handle slate fragments, but only if linebreaks are allowed
    if (allowBreaks && types.includes('application/x-slate-fragment')) {
      return insertData(data)
    }

    const input = {
      source: 'html',
      type: 'text/html',
      data
    }

    // 2. Allow willing consumers to handle input
    const handle = pasteToConsumers(editor, consumers, input)
    if (handle instanceof Promise) {
      void handle.then((response) => {
        // If a consumer have processed the input and in turn produced
        // text, use that instead of the original text
        if (typeof response === 'string') {
          // Hand this over to insertText to finish
          return insertText(response)
        }
      })
      return
    }

    // 3. If we originally got html/text now try to paste it as paragraphs
    // If we don't, Slate will hand it over to insertText(), but when we
    // can handle it we actually do this better than insertText() of Slate
    // which often produces excessive amounts of newlines.
    if (types.includes('text/plain') && (!allowBreaks || types.includes('text/html'))) {
      const text = data.getData('text/plain')
      if (text && pasteToParagraphs(editor, components, text)) {
        return
      }
    }

    // 4. Fallback to Slate
    insertData(data)
  }
}
