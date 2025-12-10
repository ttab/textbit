import { debounce } from '../utils/debounce'
import type { SpellingError, SpellcheckLookupTable } from '../types'
import { Editor, Node, Element } from 'slate'

export type OnSpellcheckCallback = (texts: { text: string, lang: string }[]) => Promise<Omit<SpellingError, 'id'>[][]>

export function withSpeling(editor: Editor, onSpellcheck: OnSpellcheckCallback, debounceTimeout: number = 6125): Editor {
  const { onChange } = editor
  let onSpellcheckCompleteCB: ((lookupTable: SpellcheckLookupTable, updatedNodes: string[]) => void) | null = null

  editor.spellingLookupTable = new Map()
  editor.onSpellcheckComplete = (cb: (lookupTable: SpellcheckLookupTable, updatedNodes: string[]) => void) => {
    onSpellcheckCompleteCB = cb
  }

  /**
   * Debounced spellcheck, during typing
   */
  editor.spellcheck = debounce(async () => {
    if (!onSpellcheck) {
      return
    }

    const [checkPerformed, updatedNodes, newLookupTable] = await updateSpellcheck(editor, onSpellcheck, editor.spellingLookupTable)
    if (checkPerformed && updatedNodes.length > 0) {
      editor.spellingLookupTable = newLookupTable
      onSpellcheckCompleteCB?.(newLookupTable, updatedNodes)
    }
  }, debounceTimeout)

  editor.onChange = (options) => {
    // Call the original onChange first
    onChange(options)

    const operations = editor.operations.filter(
      (op) => ['insert_text', 'remove_text', 'split_node', 'merge_node'].includes(op.type)
    )

    if (!operations.length) {
      // Change was not meaningful and must not trigger a spellcheck
      return
    }

    if (editor.spellcheck) {
      editor.spellcheck()
    }
  }

  return editor
}


async function updateSpellcheck(
  editor: Editor,
  onSpellcheck: OnSpellcheckCallback,
  currentSpellcheckTable: SpellcheckLookupTable
): Promise<[boolean, string[], SpellcheckLookupTable]> {
  // Find all nodes that need spellchecking
  const tracker: Map<string, {
    lang: string
    text: string
    errors: SpellingError[]
    check: boolean
  }> = new Map()
  const changedNodes: string[] = []
  const updatedNodes: string[] = []

  for (const node of editor.children) {
    if (!Element.isElement(node) || !node.id) {
      continue
    }

    const currentEntry = currentSpellcheckTable.get(node.id)
    const text = Node.string(node)

    if (!currentEntry || currentEntry.text !== text) {
      // New node, or existing changed node, spellchecking needed
      const isEmpty = text.trim() === ''
      tracker.set(node.id, {
        lang: node.lang || editor.lang,
        text,
        errors: [],
        check: !isEmpty
      })

      if (!isEmpty) {
        changedNodes.push(node.id)
      }
    } else {
      // Existing unchanged node, no spellchecking needed
      tracker.set(node.id, {
        ...currentEntry,
        check: false
      })
    }
  }

  // Nothing to check
  if (!changedNodes.length) {
    return [false, [], tracker]
  }

  // Send all changed or added strings to spellcheck in one call
  const result = await onSpellcheck(
    Array.from(tracker.values())
      .filter((entry) => entry.check) // Spellcheck those without spelling info
      .map((entry) => {
        return {
          text: entry.text,
          lang: entry.lang
        }
      })
  )

  // Ignore mismatching results
  if (result.length !== changedNodes.length) {
    console.warn('Number of spellchecked texts differ from requested number of texts to spellcheck')
    return [false, [], tracker]
  }

  // Add all spelling errors and suggestions, give each error an id
  // FIXME: Save before and check that the spellchecker actually updated the suggestions
  for (let i = 0; i < changedNodes.length; i++) {
    const id = changedNodes[i]
    const entry = tracker.get(id)

    if (!entry) {
      continue
    }

    entry.errors = result[i]
      .filter((item) => {
        return item?.text && Array.isArray(item?.suggestions)
      })
      .map((item) => {
        return {
          id: crypto.randomUUID(),
          text: item.text,
          level: item.level,
          suggestions: item.suggestions || []
        }
      })

    // Add node id to updatedNodes array so we know which nodes need rerendering
    updatedNodes.push(id)
  }

  // FIXME: Updated nodes should be [] if nothing changed from before (optimization)
  return [true, updatedNodes, tracker]
}
