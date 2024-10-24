import {
  Editor,
  Node as SlateNode,
  BaseRange,
  Path,
  Transforms,
  Descendant,
  Element as SlateElement,
  NodeEntry,
  Text as SlateText,
  Range
} from "slate"
import { ReactEditor } from 'slate-react'

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
export function convertLastSibling(editor: Editor, node: SlateNode, path: Path, fromType: string, toTextType: string): void {
  const siblingNodes: Array<any> = []
  for (const [child, childPath] of SlateNode.elements(node)) {
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
          text: SlateNode.string(siblingNodes[n][0] as SlateNode)
        }]
      } as SlateNode,
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


export function getNodeById(editor: Editor, id: string): NodeEntry<SlateNode> | undefined {
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

export function getSelectedNodeEntries(editor: Editor): NodeEntry<SlateNode>[] {
  const { selection } = editor
  const matches = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection as BaseRange),
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['block', 'void', 'text', 'textblock'].includes(n.class || "")
    })
  )

  return matches
}

export function getSelectedNodes(editor: Editor): SlateNode[] {
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

export function getTextNodesInTopAncestor(editor: Editor, includeEditor: boolean = false): NodeEntry<Descendant>[] {
  if (!editor.selection) {
    return []
  }

  const [start] = Editor.edges(editor, editor.selection)
  const topAncestor = Editor.above(editor, {
    at: start.path,
    match: n => (!includeEditor || !Editor.isEditor(n)) && SlateElement.isElement(n),
    mode: 'lowest'
  })

  if (!topAncestor) {
    return []
  }

  const [node] = topAncestor
  return Array.from(SlateNode.descendants(node, {
    pass: ([n]) => SlateText.isText(n)
  }))
}


export function getNodeEntryFromDomNode(editor: ReactEditor, domNode: Node): NodeEntry | undefined {
  try {
    if (ReactEditor.hasDOMNode(editor, domNode)) {
      const node = ReactEditor.toSlateNode(editor, domNode)
      const path = ReactEditor.findPath(editor, node)


      return [node, path]
    }
  } catch (error) { }

  return undefined
}
