import { Editor, NodeEntry, Transforms, Node } from 'slate'
import { TextbitEditor, TextbitElement } from '../../../../lib'

export const normalizeNode = (editor: Editor, nodeEntry: NodeEntry, listType: string) => {
  const [, path] = nodeEntry
  const children = Array.from(Node.children(editor, path))


  let n = 1
  for (const [child, childPath] of children) {
    if (TextbitElement.isBlock(child) || TextbitElement.isTextblock(child)) {
      // Unwrap block node children (move text element children upwards in tree)
      Transforms.unwrapNodes(editor, {
        at: childPath,
        split: true
      })
      return true
    }

    if (n < children.length && TextbitElement.isText(child) && !TextbitElement.isOfType(child, `${listType}/list-item`)) {
      // Turn unknown text elements to core/number-list/list-item or core/bullet-list/list-item
      Transforms.setNodes(
        editor,
        { type: `${listType}/list-item` },
        { at: childPath }
      )
      return true
    }

    // If the two last elements are empty, remove last node and then convert
    // the remaining last node to normal text. This gives the appearance that
    // <enter> on a last empty list item converts it to a text node.
    if (n === children.length && children.length > 1 && TextbitElement.isOfType(child, `${listType}/list-item`)) {
      if (!TextbitEditor.hasText([children[n - 2], children[n - 1]])) {

        const removePath = [childPath[0], n - 2]
        const liftPath = [childPath[0], n - 1]

        Transforms.setNodes(
          editor,
          { type: 'core/text', properties: {} },
          { at: liftPath }
        )
        Transforms.liftNodes(
          editor,
          { at: liftPath }
        )

        Transforms.removeNodes(
          editor,
          { at: removePath }
        )

        return true
      }
    }

    n++
  }
}
