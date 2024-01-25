import { Editor, NodeEntry, Transforms, Node } from 'slate'
import { TBElement } from '../../../../../src'
import { hasText } from '../../../../../src/lib/utils'

export const normalizeNode = (editor: Editor, nodeEntry: NodeEntry, listType: string) => {
  const [node, path] = nodeEntry
  const children = Array.from(Node.children(editor, path))


  let n = 1
  for (const [child, childPath] of children) {
    if (TBElement.isBlock(child) || TBElement.isTextblock(child)) {
      // Unwrap block node children (move text element children upwards in tree)
      Transforms.unwrapNodes(editor, {
        at: childPath,
        split: true
      })
      return true
    }

    if (n < children.length && TBElement.isText(child) && !TBElement.isOfType(child, `${listType}/list-item`)) {
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
    if (n === children.length && children.length > 1 && TBElement.isOfType(child, `${listType}/list-item`)) {
      if (!hasText([children[n - 2], children[n - 1]])) {

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
