import { Editor, Node, Element } from 'slate'

/*
 * If a node is in any way inserted or created it must be assigned a unique id.
 * If copied, or split the inserted node must have its id overridden.
 */

type NodeWithId = Partial<Node> & {
  id?: string
}

export function withUniqueIds(editor: Editor) {
  const { apply } = editor

  editor.apply = (operation) => {
    if (operation.type === 'insert_node') {
      const node = operation.node

      if (Element.isElement(node) && (!node.id || idExists(editor, node))) {
        const nodeWithNewId = structuredClone(node)
        nodeWithNewId.id = crypto.randomUUID()

        return apply({
          ...operation,
          node: nodeWithNewId
        })
      }
    }

    if (operation.type === 'split_node') {
      const node = operation.properties

      if ('id' in node && typeof node.id === 'string' && idExists(editor, node)) {
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

function idExists(editor: Editor, node: NodeWithId): boolean {
  if (!node.id) {
    return false
  }

  const existingNodes = Array.from(Editor.nodes(editor, {
    at: [],
    mode: 'all',
    match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.id === node.id
  }))

  return existingNodes.length > 0
}
