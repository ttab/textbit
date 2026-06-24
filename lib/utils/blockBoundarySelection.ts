import { Editor, Element, Path, Range, Text, Transforms } from 'slate'
import { TextbitElement } from './textbit-element'

/**
 * True when the current selection crosses a `'block'` class element boundary:
 * one endpoint inside a block and the other outside it, or each endpoint in a
 * different block. Such a selection is left intact on purpose, but mutating it
 * - deleting, typing, pasting or breaking - would merge nodes that don't belong
 * together, so callers use this to block those edits entirely.
 *
 * A selection contained within a single block (both endpoints share the same
 * nearest block ancestor) or entirely outside any block edits normally.
 */
export function selectionCrossesBlockBoundary(editor: Editor): boolean {
  const { selection } = editor

  if (!selection || Range.isCollapsed(selection)) {
    return false
  }

  const anchorBlock = blockAncestorPath(editor, selection.anchor.path)
  const focusBlock = blockAncestorPath(editor, selection.focus.path)

  // Both endpoints sit outside any block - ordinary editing.
  if (anchorBlock === undefined && focusBlock === undefined) {
    return false
  }

  // Both endpoints sit in the same block - their parts belong together.
  if (anchorBlock && focusBlock && Path.equals(anchorBlock, focusBlock)) {
    return false
  }

  // Otherwise the selection crosses a block boundary.
  return true
}

function blockAncestorPath(editor: Editor, at: Path): Path | undefined {
  const entry = Editor.above(editor, {
    at,
    match: (n) => Element.isElement(n) && TextbitElement.isBlock(n)
  })

  return entry?.[1]
}

/**
 * Remove the selected text within `at`, one text node at a time. Deleting each
 * node's sub-range separately keeps every deletion inside a single node, so
 * Slate never reaches its across-block `mergeNodes` step - the spanned text
 * nodes and their block ancestors are all preserved, only their text shrinks.
 */
export function deleteSelectedTextWithinNodes(editor: Editor, at: Range): void {
  Editor.withoutNormalizing(editor, () => {
    // Reverse so earlier text nodes keep their paths as we delete.
    const entries = Array.from(
      Editor.nodes(editor, { at, match: (n) => Text.isText(n) })
    ).reverse()

    for (const [, path] of entries) {
      const sub = Range.intersection(at, Editor.range(editor, path))

      if (sub && !Range.isCollapsed(sub)) {
        Transforms.delete(editor, { at: sub })
      }
    }
  })
}
