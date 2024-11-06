import { TextbitElement } from '../../../lib'
import { debounce } from '../../../lib/debounce'
import { type SpellingError } from '../../../types'
import { Editor, Node } from "slate"

type SpellcheckLookupTable = Map<string, {
  text: string,
  errors: SpellingError[]
}>
export type OnSpellcheckCallback = (texts: string[]) => Promise<Omit<SpellingError, 'id'>[][]>

export const withSpelling = (editor: Editor, onSpellcheck: OnSpellcheckCallback | undefined, debounceTimeout: number): Editor => {
  const { onChange } = editor

  editor.spellingLookupTable = new Map()

  editor.spellcheck = debounce(async () => {
    if (!onSpellcheck) {
      return
    }

    const [newLookupTable, checkPerformed] = await updateSpellcheck(editor, onSpellcheck, editor.spellingLookupTable)
    editor.spellingLookupTable = newLookupTable

    if (!checkPerformed) {
      return
    }

    if (!editor.selection) {
      editor.apply({
        type: 'set_selection', properties: null, newProperties: {
          anchor: { path: [0, 0], offset: 0 },
          focus: { path: [0, 0], offset: 0 }
        }
      })
    }

    editor.apply({
      type: 'insert_text',
      path: [0, 0],
      offset: 0,
      text: ''
    })
  }, debounceTimeout)

  editor.onChange = (options) => {
    // Call the original onChange first
    onChange(options)

    const operations = editor.operations.filter(
      op => ['insert_text', 'remove_text', 'split_node', 'merge_node'].includes(op.type)
    )

    if (!operations.length) {
      // Change was not meaningful and must not trigger a spellcheck
      return
    }

    editor.spellcheck()
  }

  return editor
}


async function updateSpellcheck(
  editor: Editor,
  onSpellcheck: OnSpellcheckCallback,
  currentSpellcheckTable: SpellcheckLookupTable
): Promise<[SpellcheckLookupTable, boolean]> {
  // Find all nodes that need spellchecking
  const tracker: Map<string, {
    text: string,
    errors: SpellingError[],
    check: boolean
  }> = new Map()
  const spellcheck: string[] = []

  for (const node of editor.children) {
    if (!TextbitElement.isElement(node) || !node.id) {
      continue
    }

    const currentEntry = currentSpellcheckTable.get(node.id)
    const text = Node.string(node)

    if (!currentEntry || currentEntry.text !== text) {
      // New node, or existing changed node, spellchecking needed
      const isEmpty = text.trim() === ''
      tracker.set(node.id, {
        text,
        errors: [],
        check: !isEmpty
      })

      if (!isEmpty) {
        spellcheck.push(node.id)
      }
    }
    else {
      // Existing unchanged node, no spellchecking needed
      tracker.set(node.id, {
        ...currentEntry,
        check: false
      })
    }
  }

  // Nothing to check
  if (!spellcheck.length) {
    return [tracker, false]
  }

  // Send all changed or added strings to spellcheck in one call
  const result = await onSpellcheck(
    Array.from(tracker.values())
      .filter(entry => entry.check) // Spellcheck those without spelling info
      .map(entry => entry.text)
  )

  // Ignore mismatching results
  if (result.length !== spellcheck.length) {
    console.warn('Number of spellchecked texts differ from requested number of texts to spellcheck')
    return [tracker, false]
  }

  // Add all spelling errors and suggestions, give each error an id
  for (let i = 0; i < spellcheck.length; i++) {
    const entry = tracker.get(spellcheck[i])
    if (!entry) {
      continue
    }

    entry.errors = result[i]
      .filter((item) => {
        return typeof item?.text && Array.isArray(item?.suggestions)
      })
      .map((item) => {
        return {
          id: crypto.randomUUID(),
          text: item.text,
          suggestions: item.suggestions || []
        }
      })
  }

  return [tracker, true]
}
