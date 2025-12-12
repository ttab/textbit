import { Editor, Node, Range, Path, Element, Point } from 'slate'
import { TextbitElement } from '../main'

/**
 * Custom insertFragment function that ensures that pasted text into one text node
 * always matches the text node type being pasted into even if the selection is
 * hanging over to the next node.
 *
 * I.e we don't want that a copied slate body text being pasted into a title turns
 * the title into a paragraph.
 *
 * CAVEAT: We rely on the various text class normalizers to ensure that any
 * inconsistencies are resolved.
 *
 * @param editor
 * @returns
 */
export function withInsertFragment(editor: Editor) {
  const { insertFragment } = editor

  editor.insertFragment = (fragment, options) => {
    const { selection } = editor

    // Not applicable if not having an expanded selection
    if (!selection || Range.isCollapsed(selection)) {
      insertFragment(fragment, options)
      return
    }

    // Not applicable unless all fragments are text nodes
    if (!fragment.every(TextbitElement.isText)) {
      insertFragment(fragment, options)
      return
    }

    const [start, endCandidate] = Range.edges(selection)
    const end = getUnhangedEndPoint(editor, endCandidate)
    const [ancestor] = findClosestTextNodeAncestor(editor, start.path, end.path) ?? []

    // If the current selection has no common text node ancestor
    // we accept the default behavior of slate.
    if (!TextbitElement.isText(ancestor)) {
      insertFragment(fragment, options)
      return
    }

    const newFragment = fragment.map((f) => {
      if (f.type === ancestor.type && f.properties?.role === ancestor.properties?.role) {
        return f
      }

      const newFragment = { ...f }
      if (newFragment.properties) {
        newFragment.properties.role = ancestor.properties?.role
      } else {
        newFragment.properties = {
          role: ancestor.properties?.role
        }
      }

      return newFragment
    })

    insertFragment(newFragment, options)
  }

  return editor
}

/**
 * Find out if an end point in a selection is hanging over to next node and return
 * the last point of the previous node instead to "unhang" it.
 *
 * A hanging selection is when offset of the end point in the selection is 0.
 * This is visually equivalent to being at the end of the previous node.
 */
 function getUnhangedEndPoint(editor: Editor, point: Point): Point {
   if (point.offset !== 0 || point.path[0] === 0) {
    // Not hanging, return as-is
    return point
   }

   try {
    // Ensure that the offset is at the topmost Text node
    const firstTextPoint = Editor.start(editor, [point.path[0]])

    // If the point equals the first text position in this top-level node,
    // then we're hanging from the previous node
    if (Point.equals(point, firstTextPoint)) {
      return Editor.end(editor, [point.path[0] - 1])
    }
  } catch (error) {
    console.trace(error)
  }

  return point
}

/**
 * Find the closest ancestor node with class 'text' for two given paths.
 */
function findClosestTextNodeAncestor(
  editor: Editor,
  path1: Path,
  path2: Path
): [Node, Path] | null {
  const commonPath = Path.common(path1, path2)

  // Walk up from the common path to find a node with class 'text'
  let currentPath = commonPath
  while (currentPath.length > 0) {
    try {
      const [node] = Editor.node(editor, currentPath)

      if (Element.isElement(node) && node.class === 'text') {
        return [node, currentPath]
      }

      // Move up one level
      currentPath = currentPath.slice(0, -1)
    } catch (error) {
      console.trace(error)
    }
  }

  return null
}
