import { Editor, Node, Element } from 'slate'

/*
 * If a node is in any way inserted or created it must be assigned a unique id.
 * If copied, or split the inserted node must have its id overridden.
 */

type NodeWithId = Partial<Node> & {
  id?: string
}

export function withUniqueIds(editor: Editor) {
  const { insertNode, insertNodes, apply } = editor

  editor.insertNode = (node, options) => {
    if (Element.isElement(node) && (idExists(editor, node) || !node.id)) {
      node.id = crypto.randomUUID()
    }

    insertNode(node, options)
  }

  editor.insertNodes = (nodes, options) => {
    for (const node of toArray(nodes)) {
      if (Element.isElement(node) && (idExists(editor, node) || !node.id)) {
        node.id = crypto.randomUUID()
      }
    }

    insertNodes(nodes, options)
  }

  editor.apply = (operation) => {
    if (operation.type === 'insert_node') {
      const node = structuredClone(operation.node)

      if (Element.isElement(node) && (idExists(editor, node) || !node.id)) {
        node.id = crypto.randomUUID()
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
            id: crypto.randomUUID()
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
    match: (n) => !Editor.isEditor(n) && n.id !== node.id
  }))

  return !!existingNodes.length
}
