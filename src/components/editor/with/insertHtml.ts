import { Editor } from 'slate'
import { pasteToParagraphs } from '@/lib/pasteToParagraphs'
import { ConsumeFunction, ConsumesFunction, TextbitPlugin } from 'src/types'
import { pasteToConsumers } from '@/lib/pasteToConsumer'

type Consumers = {
  consumes: ConsumesFunction
  consume: ConsumeFunction
}[]

export const withInsertHtml = (editor: Editor, plugins: TextbitPlugin[]) => {
  const { insertData, insertText } = editor

  const consumers: Consumers = plugins
    .filter(({ consumer }) => consumer?.consume && consumer?.consumes)
    .map(({ consumer }) => consumer) as Consumers

  editor.insertData = (data) => {
    const { types } = data

    // Let slate handle slate stuff, works best most of the time
    if (types.includes('application/x-slate-fragment')) {
      return insertData(data)
    }

    const input = {
      source: 'html',
      type: 'text/html',
      data
    }

    const handle = pasteToConsumers(editor, consumers, input)
    if (handle instanceof Promise) {
      handle.then(response => {
        // If a consumer have processed the input and in turn produced
        // text, use that instead of the original text
        if (typeof response === 'string') {
          // Hand this over to insertText to finish
          return insertText(response)
        }
      })
      return
    }

    // If we originally got html/text now try to paste it as paragraphs
    // If we don't, Slate will hand it over to insertText(), but when we
    // can handle it we actually do this better than insertText() of Slate
    // which often produces excessive amounts of newlines.
    if (types.includes('text/plain') && types.includes('text/html')) {
      const text = data.getData('text/plain')
      if (text && true === pasteToParagraphs(text, editor)) {
        return
      }
    }

    // Fallback to Slate
    insertData(data)
  }
}