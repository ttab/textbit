import { TextbitElement } from '@/lib'
import { debounce } from '@/lib/debounce'
import { Editor, Node, Operation } from "slate"

type OnSpellcheckCallback = (texts: string[]) => Promise<Array<{
  text: string,
  offset: number,
  subs: string[]
}[]>>

type SpellcheckLookupTable = Map<string, {
  text: string,
  spelling?: {
    offset: number,
    subs: string[]
    text: string
  }[]
}>

export const withSpelling = (editor: Editor, onSpellcheck: OnSpellcheckCallback | undefined, debounceTimeout: number): Editor => {
  const { onChange } = editor

  editor.spelling = new Map()

  editor.spellcheck = debounce(async () => {
    if (!onSpellcheck) {
      return
    }

    // Execute spellcheck callback function
    editor.spelling = await updateSpellcheckTable(editor, onSpellcheck, editor.spelling)
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


async function updateSpellcheckTable(
  editor: Editor,
  onSpellcheck: OnSpellcheckCallback,
  currentSpellcheckTable: SpellcheckLookupTable
): Promise<SpellcheckLookupTable> {
  // Find all nodes that need spellchecking
  const tracker: SpellcheckLookupTable = new Map()
  const spellcheck: string[] = []

  for (const node of editor.children) {
    if (!TextbitElement.isElement(node) || !node.id) {
      continue
    }

    const currentEntry = currentSpellcheckTable.get(node.id)
    const text = Node.string(node)

    if (!currentEntry || currentEntry.text !== text) {
      // New node, or existing changed node. Needs spellchecking.
      const isEmpty = text.trim() === ''
      tracker.set(node.id, {
        text,
        spelling: !isEmpty ? undefined : [] // Only spellcheck non empty texts
      })

      if (!isEmpty) {
        spellcheck.push(node.id)
      }
    }
    else {
      // Existing unchanged node
      tracker.set(node.id, currentEntry)
    }
  }
  // Send all changed or added strings to spellcheck in one call
  if (spellcheck.length) {
    const result = await onSpellcheck(
      Array.from(tracker.values())
        .filter(entry => !entry.spelling) // Spellcheck those without spelling info
        .map(entry => entry.text)
    )

    // Add all spellchecking results
    if (result.length === spellcheck.length) {
      for (let i = 0; i < spellcheck.length; i++) {
        const entry = tracker.get(spellcheck[i])
        if (entry) {
          entry.spelling = result[i]
        }
      }
    }
  }

  return tracker
}
