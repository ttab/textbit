import { Editor, Element, Node, Text, Transforms } from 'slate'

export const trimWhitespace = ({ editor }: { editor: Editor}) => {
  type TrimRange = { anchor: { path: number[], offset: number }, focus: { path: number[], offset: number } }
  const ranges: TrimRange[] = []

  for (const [node, path] of Editor.nodes(editor, { at: [], match: n => Element.isElement(n) })) {
    // Only process top-level blocks, not nested inline elements
    if (path.length !== 1) {
      continue
    }

    // Check the first leaf text node for leading whitespace
    const [firstNode, firstRelPath] = Node.first(node, [])

    if (Text.isText(firstNode)) {
      const leadingMatch = firstNode.text.match(/^[\t\n\r\f\v ]+/)
      if (leadingMatch) {
        const absPath = [...path, ...firstRelPath]

        ranges.push({
          anchor: { path: absPath, offset: 0 },
          focus: { path: absPath, offset: leadingMatch[0].length }
        })
      }
    }

    // Check the last leaf text node for trailing whitespace
    const [lastNode, lastRelPath] = Node.last(node, [])

    if (Text.isText(lastNode)) {
      const trailingMatch = lastNode.text.match(/[\t\n\r\f\v ]+$/)

      if (trailingMatch) {
        const absPath = [...path, ...lastRelPath]
        const textLength = lastNode.text.length

        ranges.push({
          anchor: { path: absPath, offset: textLength - trailingMatch[0].length },
          focus: { path: absPath, offset: textLength }
        })
      }
    }
  }

  // Delete in reverse order so earlier paths are not invalidated
  for (const range of ranges.reverse()) {
    Transforms.delete(editor, { at: range })
  }
}
