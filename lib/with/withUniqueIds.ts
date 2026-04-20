import { Editor, Element, type Node } from 'slate'

/*
 * If a node is in any way inserted or created it must be assigned a unique id.
 * If copied, or split, the inserted node — and every nested element inside it —
 * must have its id overridden if it collides with any existing id in the editor
 * or with another id appearing earlier in the same subtree.
 */

type NodeWithId = Partial<Node> & {
  id?: string
}

export function withUniqueIds(editor: Editor) {
  const { apply } = editor

  editor.apply = (operation) => {
    if (operation.type === 'insert_node') {
      const rewritten = rewriteSubtreeIds(editor, operation.node)
      if (rewritten) {
        return apply({ ...operation, node: rewritten })
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

/**
 * Walk the subtree of `inputNode` and rewrite any Element id that is missing or
 * that collides with an existing id in the editor (or with one already assigned
 * earlier in the walk). Returns a cloned node with rewrites applied, or null if
 * no rewrite was necessary.
 */
function rewriteSubtreeIds(editor: Editor, inputNode: Node): Node | null {
  if (!Element.isElement(inputNode)) return null

  const existing = collectExistingIds(editor)
  let changed = false

  const clone = structuredClone(inputNode)

  const walk = (n: Node) => {
    if (!Element.isElement(n)) return

    if (!n.id || existing.has(n.id)) {
      n.id = crypto.randomUUID()
      changed = true
    }
    existing.add(n.id as string)

    for (const child of n.children) {
      walk(child)
    }
  }

  walk(clone)
  return changed ? clone : null
}

function collectExistingIds(editor: Editor): Set<string> {
  const ids = new Set<string>()
  for (const [n] of Editor.nodes(editor, { at: [], mode: 'all' })) {
    if (!Editor.isEditor(n) && Element.isElement(n) && typeof n.id === 'string') {
      ids.add(n.id)
    }
  }
  return ids
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
