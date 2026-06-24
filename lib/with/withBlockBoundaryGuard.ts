import { Editor, Transforms } from 'slate'
import {
  selectionCrossesBlockBoundary,
  deleteSelectedTextWithinNodes
} from '../utils/blockBoundarySelection'

/**
 * Constrain edits to a selection that crosses a `'block'` element boundary so
 * they only ever touch text - never merging, removing or lifting the block or
 * its child nodes:
 *  - deleteFragment - delete the selected text within each spanned text node
 *    (no merge), then collapse to the selection start.
 *  - insertText / plain-text paste (insertData) - delete the selected text the
 *    same way, then insert the new text at the selection end.
 *  - rich paste (slate fragment) / insertFragment - blocked, would add structure.
 *  - insertBreak / insertSoftBreak - blocked.
 *
 * Registered after the other command plugins so it wraps their final versions
 * and its guard runs first.
 */
export function withBlockBoundaryGuard<T extends Editor>(editor: T): T {
  const {
    insertText,
    insertFragment,
    insertData,
    insertBreak,
    insertSoftBreak,
    deleteFragment
  } = editor

  editor.insertText = (text, options) => {
    if (selectionCrossesBlockBoundary(editor)) {
      replaceCrossBoundarySelection(editor, () => insertText(text, options))
      return
    }

    insertText(text, options)
  }

  editor.insertData = (data) => {
    if (selectionCrossesBlockBoundary(editor)) {
      // Rich content would insert structure across the boundary - block it.
      if (data.types.includes('application/x-slate-fragment')) {
        return
      }

      const text = data.getData('text/plain')
      if (text) {
        replaceCrossBoundarySelection(editor, () => insertText(text))
      }

      return
    }

    insertData(data)
  }

  editor.insertFragment = (fragment, options) => {
    if (selectionCrossesBlockBoundary(editor)) {
      return
    }

    insertFragment(fragment, options)
  }

  editor.insertBreak = () => {
    if (selectionCrossesBlockBoundary(editor)) {
      return
    }

    insertBreak()
  }

  editor.insertSoftBreak = () => {
    if (selectionCrossesBlockBoundary(editor)) {
      return
    }

    insertSoftBreak()
  }

  editor.deleteFragment = (options) => {
    if (selectionCrossesBlockBoundary(editor)) {
      const { selection } = editor
      if (selection) {
        const startRef = Editor.pointRef(editor, Editor.start(editor, selection))
        deleteSelectedTextWithinNodes(editor, selection)
        const start = startRef.unref()

        if (start) {
          Transforms.select(editor, start)
        }
      }

      return
    }

    deleteFragment(options)
  }

  return editor
}

/**
 * Strip the selected text within each spanned node (no merge), then run `insert`
 * at the selection end (the focus point, adjusted for the deletion).
 */
function replaceCrossBoundarySelection(editor: Editor, insert: () => void): void {
  const { selection } = editor
  if (!selection) {
    return
  }

  const endRef = Editor.pointRef(editor, selection.focus)
  deleteSelectedTextWithinNodes(editor, selection)
  const end = endRef.unref()

  if (end) {
    Transforms.select(editor, end)
    insert()
  }
}
