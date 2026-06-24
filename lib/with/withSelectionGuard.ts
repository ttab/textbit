import {
  Editor,
  Element,
  Path,
  type Descendant,
  Transforms
} from 'slate'

/**
 * Clear `editor.selection` when an op leaves it pointing at a path the
 * tree no longer reaches. Slate's `Path.transform` is arithmetic, not
 * structural, so a selection can survive a normalize/yjs/drop into an
 * unresolvable path and crash slate-react on the next render.
 */
export function withSelectionGuard<T extends Editor>(editor: T): T {
  const { apply } = editor

  editor.apply = (op) => {
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
