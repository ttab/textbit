import { Editor, Path, Range, Text } from 'slate'
import { useSlateSelector } from 'slate-react'

export interface SelectionStats {
  words: number
  characters: number
}

const EMPTY: SelectionStats = { words: 0, characters: 0 }

/**
 * Word and character counts for the current selection. Returns zeros when
 * the selection is null or collapsed. Counts everything inside the range
 * regardless of node class - captions, factbox text, and text inside void
 * containers all contribute, matching the "no special-cases" intent.
 *
 * Counted per text node (not via `Editor.string`) so word counts don't
 * lose boundaries across adjacent blocks: 'paragraphhello' would
 * otherwise read as one word.
 */
export const useSelectionStats = (): SelectionStats => {
  return useSlateSelector((editor) => {
    const { selection } = editor
    if (!selection || Range.isCollapsed(selection)) {
      return EMPTY
    }

    const [start, end] = Range.edges(selection)
    let words = 0
    let characters = 0

    for (const [node, path] of Editor.nodes(editor, {
      at: selection,
      match: Text.isText,
      voids: true
    })) {
      let text = node.text
      if (Path.equals(path, end.path)) {
        text = text.slice(0, end.offset)
      }
      if (Path.equals(path, start.path)) {
        text = text.slice(start.offset)
      }
      characters += text.length
      words += (text.match(/\p{L}+/gu) || []).length
    }

    return { words, characters }
  }, statsEqual)
}

function statsEqual(a: SelectionStats | null, b: SelectionStats): boolean {
  return a !== null && a.words === b.words && a.characters === b.characters
}
