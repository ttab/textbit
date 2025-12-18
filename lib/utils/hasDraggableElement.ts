import { Editor, Range, Node, Element } from 'slate'
import { ReactEditor } from 'slate-react'

/**
 * Check if the target element or one of its ancestors is draggable.
 */
export function hasDraggableElementTarget(editor: Editor, event: React.DragEvent<HTMLElement>): boolean {
  const range = ReactEditor.findEventRange(editor, event)
  if (!Range.isRange(range)) {
    return false
  }

  let path = range.anchor.path
  do {
    const node = Node.get(editor, path)

    // Prevent dragging if the event target node path includes a text class element
    if (Element.isElement(node) && node.class === 'text') {
      return false
    }

    path = path.slice(0, -1)
  } while (path.length > 0)

  return true
}
