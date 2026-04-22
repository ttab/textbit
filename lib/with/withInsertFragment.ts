import { Editor, Node, Range, Path, Element, Point, Transforms } from 'slate'
import { TextbitElement } from '../main'
import type { PluginRegistryComponent } from '../contexts/PluginRegistry/lib/types'

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
export function withInsertFragment(
  editor: Editor,
  components: Map<string, PluginRegistryComponent>
) {
  const { insertFragment } = editor

  editor.insertFragment = (fragment, options) => {
    const { selection } = editor

    // Not applicable if not having a selection
    if (!selection) {
      insertFragment(fragment, options)
      return
    }

    // When the fragment contains non-text blocks and the cursor is inside a
    // registered child text element (e.g., an image caption), inserting the
    // blocks as siblings would corrupt the parent block's structure. Flatten
    // the fragment to plain text and let insertText handle it.
    if (!fragment.every(TextbitElement.isText)) {
      if (isInsideChildTextElement(editor, selection, components)) {
        const text = fragment.map((n) => Node.string(n)).join('\n')
        editor.insertText(text)
        return
      }
    }

    // When the fragment contains non-text blocks and the cursor is inside a
    // top-level text paragraph, split the paragraph at the cursor and insert
    // the block nodes as top-level siblings. This prevents Slate's default
    // insertFragment from unwrapping block structures into inline context
    // (which destroys void elements and their properties).
    if (!fragment.every(TextbitElement.isText)) {
      const anchor = selection.anchor
      const focus = selection.focus

      if (anchor.path[0] === focus.path[0]) {
        const topIndex = anchor.path[0]
        const topNode = editor.children[topIndex]

        if (Element.isElement(topNode) && topNode.class === 'text') {
          if (!Range.isCollapsed(selection)) {
            Transforms.delete(editor)
          }

          const point = editor.selection!.anchor
          const isAtStart = Point.equals(point, Editor.start(editor, [topIndex]))
          const isAtEnd = Point.equals(point, Editor.end(editor, [topIndex]))
          const needsSplit = !isAtStart && !isAtEnd
          const insertAt = isAtStart ? topIndex : topIndex + 1

          Editor.withoutNormalizing(editor, () => {
            if (needsSplit) {
              Transforms.splitNodes(editor, {
                at: point,
                match: (_, p) => p.length === 1
              })
            }

            for (let i = 0; i < fragment.length; i++) {
              Transforms.insertNodes(editor, fragment[i], { at: [insertAt + i] })
            }
          })

          Transforms.select(editor, Editor.end(editor, [insertAt + fragment.length - 1]))
          return
        }
      }

      insertFragment(fragment, options)
      return
    }

    const [start, endCandidate] = Range.edges(selection)
    const end = Path.equals(start.path, endCandidate.path)
      ? endCandidate
      : getUnhangedEndPoint(editor, endCandidate)
    const [ancestor] = findClosestTextNodeAncestor(editor, start.path, end.path) ?? []

    // If the current selection has no common text node ancestor
    // we accept the default behavior of slate.
    if (!TextbitElement.isText(ancestor)) {
      insertFragment(fragment, options)
      return
    }

    // If the current selection is collapsed and the ancestor is not empty
    // we accept the default behavior of slate.
    if (Node.string(ancestor)?.length && Range.isCollapsed(selection)) {
      insertFragment(fragment, options)
      return
    }

    const modifiedFragment = fragment.map((f) => {
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

    insertFragment(modifiedFragment, options)
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
  const commonPath = (Path.equals(path1, path2))
    ? path1 // Both paths are the same, use one
    : Path.common(path1, path2) // Get the common path

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

/**
 * True when the selection is inside a registered child text element — that
 * is, a 'text'-class element whose path is nested (length > 1) and whose
 * plugin registry entry has a non-null parent. Top-level paragraphs return
 * false so they continue to use the split-and-insert path.
 */
function isInsideChildTextElement(
  editor: Editor,
  selection: Range,
  components: Map<string, PluginRegistryComponent>
): boolean {
  const path = selection.anchor.path
  if (path.length <= 1) return false

  // Walk up from the leaf text node looking for the nearest Element ancestor
  for (let len = path.length - 1; len >= 1; len--) {
    const ancestorPath = path.slice(0, len)
    try {
      const [node] = Editor.node(editor, ancestorPath)
      if (!Element.isElement(node)) continue
      if (node.class !== 'text') return false
      const component = components.get(node.type)
      if (!component) return false
      return component.parent !== null
    } catch {
      return false
    }
  }
  return false
}
