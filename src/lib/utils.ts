import { Editor, Node, BaseRange, Path, Transforms, Descendant, Element as SlateElement, NodeEntry } from "slate"

/**
 * Helper function to find siblings of the same type and convert the last to a new text element.
 * Useful when having text elements in a regular parent block/text element that only allows
 * one sibling of the specified fromType.
 *
 * Eg. for a caption under an image, video etc. When the user hits enter he should have a new
 * paragraph created below instead of creating a new caption.
 *
 * @param editor Editor
 * @param node Node
 * @param path Path
 * @param fromType String The type of siblings only allowed one of
 * @param toTextType String The type to convert to (eg "paragraph")
 */
export function convertLastSibling(editor: Editor, node: Node, path: Path, fromType: string, toTextType: string): void {
  const siblingNodes: Array<any> = []
  for (const [child, childPath] of Node.elements(node)) {
    if (child.type === fromType) {
      siblingNodes.push([child, childPath])
    }
  }

  if (siblingNodes.length < 2) {
    return
  }

  for (let n = siblingNodes.length - 1; n > 0; n--) {
    const nextPath = path[0] + 1

    Transforms.insertNodes(
      editor,
      {
        type: toTextType, children: [{
          text: Node.string(siblingNodes[n][0] as Node)
        }]
      } as Node,
      {
        at: [nextPath]
      }
    )

    Transforms.select(editor, {
      anchor: { offset: 0, path: [nextPath, 0] },
      focus: { offset: 0, path: [nextPath, 0] },
    })

    Transforms.removeNodes(
      editor,
      {
        at: [...path, ...siblingNodes[n][1]]
      }
    )
  }
}


export function getNodeById(editor: Editor, id: string): NodeEntry<Node> | undefined {
  const matches = Array.from(
    Editor.nodes(editor, {
      at: [0],
      match: n => {
        if (Editor.isEditor(n) || !SlateElement.isElement(n)) {
          return false
        }

        return (n.id === id)
      }
    })
  )

  return (matches.length === 1) ? matches[0] : undefined
}

export function getSelectedNodeEntries(editor: Editor): NodeEntry<Node>[] {
  const { selection } = editor
  const matches = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection as BaseRange),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['block', 'void', 'text', 'textblock'].includes(n.class || "")
    })
  )

  return matches
}

export function getSelectedNodes(editor: Editor): Node[] {
  return getSelectedNodeEntries(editor).map(nodeEntry => nodeEntry[0])
}

export function cloneChildren(children: Descendant[]): Descendant[] {
  return children.map((node) => {
    if (SlateElement.isElement(node)) {
      return {
        ...node,
        children: cloneChildren(node.children as Descendant[])
      }
    }

    return { ...node }
  })
}
