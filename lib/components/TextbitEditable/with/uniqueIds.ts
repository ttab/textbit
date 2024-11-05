import { Editor, Node } from 'slate'
import * as uuid from 'uuid'
import { TextbitElement as TBE } from '../../../lib'

/*
 * If a node is in any way inserted or created it must have a unique id.
 * If copied, or split the inserted node must have its id overridden.
 */

type NodeWithId = Partial<Node> & {
  id?: string
}

export const withUniqueIds = (editor: Editor) => {
  const { insertNode, insertNodes, apply } = editor

  editor.insertNode = (node, options) => {
    if (TBE.isElement(node) && idExists(editor, node)) {
      node.id = uuid.v4()
    }

    insertNode(node, options)
  }

  editor.insertNodes = (nodes, options) => {
    for (const node of toArray(nodes)) {
      if (TBE.isElement(node) && idExists(editor, node)) {
        node.id = uuid.v4()
      }
    }

    insertNodes(nodes, options)
  }

  editor.apply = (operation) => {
    if (operation.type === 'insert_node') {
      const node = structuredClone(operation.node)

      if (TBE.isElement(node) && idExists(editor, node)) {
        node.id = uuid.v4()
      }

      return apply({
        ...operation,
        node
      })
    }

    if (operation.type === 'split_node') {
      const node = operation.properties

      if ('id' in node && idExists(editor, node)) {
        return apply({
          ...operation,
          properties: {
            ...operation.properties,
            id: uuid.v4()
          }
        })
      }
    }

    apply(operation)
  }

  return editor
}


function toArray(n: Node | Node[]): Node[] {
  return (Array.isArray(n)) ? n : [n]
}


function idExists(editor: Editor, node: NodeWithId) {
  const existingNodes = Array.from(Editor.nodes(editor, {
    at: [],
    mode: 'highest',
    match: n => !Editor.isEditor(n) && n.id !== node.id
  }))

  return !!existingNodes.length
}
