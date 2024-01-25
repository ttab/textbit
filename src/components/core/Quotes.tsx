import { Editor, Range, Transforms } from 'slate'
import { Plugin } from '../../types'


const AllQuotes = {
  'sv': ['’', '’', '”', '”'],
  'fi': ['’', '’', '”', '”'],
  'hu': ['’', '’', '„', '”'],
  'pl': ['‚', '’', '„', '”'],
  'no': ['‹', '›', '«', '»'],
  'en': ['‘', '’', '“', '”'],
  'da': ['„', '“', '„', '“'],
  'de': ['‚', '‘', '„', '“'],
  'fr': ['‹ ', ' ›', '« ', '»']
}

const consumes: Plugin.ConsumesFunction = ({ input }) => {
  const { data, type, source } = input
  if (type !== 'text/plain') {
    return [false]
  }

  // TODO: Implement support for handling larger chunks of text (on paste)

  // For now, only handle single and double "computer" quotes when typing
  if (data !== '\'' && data !== '"') {
    return [false]
  }

  return [true]
}

const consume: Plugin.ConsumeFunction = async ({ editor, input }) => {
  const { data } = Array.isArray(input) ? input[0] : input

  // FIXME: Walk the tree to get the real full text offset, this does not take into account leafs...
  if (!Range.isRange(editor.selection)) {
    return
  }

  const range = Editor.unhangRange(editor, editor.selection)
  const anchor = range.anchor
  const offset = anchor.offset

  if (!range?.anchor) {
    return
  }

  const at = (range && range.anchor.path[0] > 0) ? range.anchor.path[0] : 0
  const fragment = Editor.string(editor, [at])

  // Fixme: This should obviously come from the document locale...
  const locale = 'en'
  const q = AllQuotes[locale] || AllQuotes['en']

  // Which are the typographic quote we want for the char?
  let quotes: string[] = []
  if (data === '\'') {
    quotes = [q[0], q[1]]
  }
  else if (data === '"') {
    quotes = [q[2], q[3]]
  }
  else {
    return // This should never happen if the matcher is alrighty
  }

  // Find previously inserted same char if it exists
  let prev = -1
  for (let n = offset; n > -1; n--) {
    if (fragment[n] === quotes[0]) {
      // We are in a already opened quote, assume it is closed after the offet
      // TODO: Look forward to see there is a closing quote, if not close this one
      return
    }
    if (fragment[n] === data) {
      prev = n;
      break;
    }
  }

  if (prev === -1) {
    return
  }

  // Remember, this only works on FIRST top level leaf. It does not
  // work when cursor is in following leafs (when there are leafs (bold etc)).
  // FIXME: Find the Point that gives us the position in the correct leaf(s)
  Transforms.insertText(editor, quotes[1], {
    at: { path: [at, 0], offset: offset },
  })

  Transforms.delete(editor, {
    at: { path: [at, 0], offset: prev }
  })

  Transforms.insertText(editor, quotes[1], {
    at: { path: [at, 0], offset: prev },
  })

  return false // Suppress default behaviour as we have taken care of it
}

export const Quotes: Plugin.Definition = {
  class: 'generic',
  name: 'quotes',
  consumer: {
    consumes,
    consume
  }
}
