import {
  Editor,
  Element,
  Path,
  Point,
  type Descendant,
  type SetSelectionOperation,
  Transforms
} from 'slate'
import { TextbitElement } from '../utils/textbit-element'

/**
 * Clear `editor.selection` when an op leaves it pointing at a path the
 * tree no longer reaches. Slate's `Path.transform` is arithmetic, not
 * structural, so a selection can survive a normalize/yjs/drop into an
 * unresolvable path and crash slate-react on the next render.
 *
 * Also clamp selections that start inside a `'text'` class node within a
 * `'block'` class element so they cannot extend out of that text node. A
 * mouse drag can otherwise pull the focus past the block, after which a
 * Backspace deletes across the boundary and lifts the node above the block.
 */
export function withSelectionGuard<T extends Editor>(editor: T): T {
  const { apply } = editor

  editor.apply = (op) => {
    if (op.type === 'set_selection') {
      op = clampSelectionWithinBlockTextNode(editor, op)
    }

    apply(op)

    const sel = editor.selection
    if (!sel) {
      return
    }

    if (!isPathReachable(editor, sel.anchor.path) || !isPathReachable(editor, sel.focus.path)) {
      console.warn(
        '[textbit] Cleared stale selection that pointed outside the document.',
        { selection: sel, op }
      )
      // Routed through apply so history and yjs see it like any other selection change.
      Transforms.deselect(editor)
    }
  }

  return editor
}

/**
 * If the resulting selection's anchor sits inside a `'text'` class node that
 * lives within a `'block'` class element, clamp the focus so it cannot leave
 * that text node. Returns the op unchanged in every other case.
 */
function clampSelectionWithinBlockTextNode(
  editor: Editor,
  op: SetSelectionOperation
): SetSelectionOperation {
  // A deselect (newProperties === null) clears the selection - nothing to clamp.
  if (!op.newProperties) {
    return op
  }

  const next = { ...editor.selection, ...op.newProperties }
  const { anchor, focus } = next

  if (!anchor || !focus) {
    return op
  }

  // Collapsed selections never cross a boundary.
  if (Point.equals(anchor, focus)) {
    return op
  }

  // The `'text'` class node that contains the anchor.
  const [textEntry] = Editor.nodes(editor, {
    at: anchor.path,
    match: (n) => Element.isElement(n) && n.class === 'text'
  })

  if (!textEntry) {
    return op
  }

  const textPath = textEntry[1]

  // Only clamp when that text node lives inside a block element.
  const blockEntry = Editor.above(editor, {
    at: textPath,
    match: (n) => Element.isElement(n) && TextbitElement.isBlock(n)
  })

  if (!blockEntry) {
    return op
  }

  // The focus is already inside the same text node - nothing to clamp.
  if (Path.equals(focus.path, textPath) || Path.isDescendant(focus.path, textPath)) {
    return op
  }

  const edge = Point.isAfter(focus, anchor)
    ? Editor.end(editor, textPath)
    : Editor.start(editor, textPath)

  // Replacing only `focus` keeps the op's variant intact (full Range stays a
  // full Range, partial stays partial), but TS can't track that correlation
  // across the spread of a discriminated union, so we assert the known type.
  return {
    ...op,
    newProperties: {
      ...op.newProperties,
      focus: edge
    }
  } as SetSelectionOperation
}

function isPathReachable(editor: Editor, path: Path): boolean {
  let parent: Editor | Element = editor
  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (idx < 0 || idx >= parent.children.length) {
      return false
    }
    const child: Descendant = parent.children[idx]
    if (i === path.length - 1) {
      return true
    }
    if (!Element.isElement(child)) {
      return false
    }
    parent = child
  }
  return true
}
