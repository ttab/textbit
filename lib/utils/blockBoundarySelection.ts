import { Editor, Element, Path, Range } from 'slate'
import { TextbitElement } from './textbit-element'

/**
 * True when the current selection starts outside any `'block'` class element
 * and ends inside one. Such a selection is left intact on purpose
 * (withSelectionGuard only clamps the inverse, where the anchor sits in a
 * block's text node), but mutating it - deleting or typing over it - would
 * merge nodes that don't belong together, so callers use this to block those
 * actions entirely.
 */
export function selectionStartsOutsideBlockEndsInside(editor: Editor): boolean {
  const { selection } = editor

  if (!selection || Range.isCollapsed(selection)) {
    return false
  }

  // "Starts outside": the anchor must not be inside any block element.
  if (blockAncestorPath(editor, selection.anchor.path)) {
    return false
  }

  // "Ends inside": the focus must be inside a block element.
  return blockAncestorPath(editor, selection.focus.path) !== undefined
}

function blockAncestorPath(editor: Editor, at: Path): Path | undefined {
  const entry = Editor.above(editor, {
    at,
    match: (n) => Element.isElement(n) && TextbitElement.isBlock(n)
  })

  return entry?.[1]
}
