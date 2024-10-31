import { TextbitEditor, TextbitElement } from '@/lib'
import { debounce } from '@/lib/debounce'
import { SpellingError } from '@/types'
import { Editor, Node, Operation } from "slate"

type SpellcheckLookupTable = Map<string, {
  text: string,
  errors: SpellingError[]
}>
export type OnSpellcheckCallback = (texts: string[]) => Promise<SpellingError[][]>

export const withSpelling = (editor: Editor, onSpellcheck: OnSpellcheckCallback | undefined, debounceTimeout: number): Editor => {
  const { onChange } = editor

  editor.spellingLookupTable = new Map()

  editor.spellcheck = debounce(async () => {
    if (!onSpellcheck) {
      return
    }

    // Do the spellcheck and store the new spellcheck lookup table
    editor.spellingLookupTable = await updateSpellcheck(editor, onSpellcheck, editor.spellingLookupTable)

    if (editor.selection) {
      // Apply dummy no op set selection to force rerender
      editor.apply({
        type: 'set_selection',
        properties: {},
        newProperties: { ...editor.selection }
      })
    }
    else {
      // Set an initial selection and apply dummy no op to force rerender
      const start = Editor.start(editor, [])
      editor.apply({
        type: 'set_selection',
        properties: null,
        newProperties: {
          anchor: start,
          focus: start
        }
      })
    }

    // FIXME: While seemingly safe, this is not perfect as it adds an extra onChange
    editor.apply({
      type: 'insert_text',
      path: [0, 0],
      offset: 0,
      text: ''
    })

  }, debounceTimeout)

  editor.onChange = (options?: { operation?: Operation }) => {
    // Call the original onChange first
    onChange(options)

    // Then do the spellchecking
    if (options?.operation?.type && options.operation.type !== 'set_selection' && onSpellcheck) {
      editor.spellcheck()
    }
  }

  return editor
}


async function updateSpellcheck(
  editor: Editor,
  onSpellcheck: OnSpellcheckCallback,
  currentSpellcheckTable: SpellcheckLookupTable
): Promise<SpellcheckLookupTable> {
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
    return tracker
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
    return tracker
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
          suggestions: item.suggestions.map((suggestion) => {
            return (typeof suggestion === 'string') ? suggestion : ''
          })
        }
      })
  }

  return tracker
}
