import { Editor, Node, BaseRange, Path, Transforms, Descendant, Element as SlateElement, NodeEntry } from "slate"
import * as uuid from 'uuid'
import { TextbitElement } from "@/lib/textbit-element"
import { Registry } from "../components/editor/registry"


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


/**
 * Convert nodes to a specified text node type
 *
 * @todo Allow even when one or several elements are not text/text blocks.
 * @todo Store selection and restore it after transforms
 *
 * @param editor Editor
 * @param type string i.e core/text
 * @param subtype string e.g heading-1, preamble (or even undefined for body text)
 * @param nodes Node[]
 */
export function convertToText(editor: Editor, type: string, subtype?: string, nodes?: NodeEntry<Node>[]) {
  const plugin = Registry.plugins.find(p => p.name === type)
  const className = plugin?.class
  const targetNodes = nodes || getSelectedNodeEntries(editor)


  if (!className || !targetNodes.length) {
    return
  }

  // Not allowed (as it crashes if last element is a block) if any element is not text/textblock
  for (const [node] of targetNodes) {
    if (!TextbitElement.isText(node) && !TextbitElement.isTextblock(node)) {
      return
    }
  }

  Editor.withoutNormalizing(editor, () => {
    for (const [node, [position]] of targetNodes) {
      if (!TextbitElement.isText(node) && !TextbitElement.isTextblock(node)) {
        continue
      }

      // Convert regular text element
      if (TextbitElement.isText(node)) {
        const nodeAttribs: any = {
          type,
          properties: subtype ? { type: subtype } : {}
        }

        Transforms.setNodes(
          editor,
          nodeAttribs,
          { match: n => SlateElement.isElement(n) && Editor.isBlock(editor, n) && n?.properties?.type !== subtype }
        )
        continue
      }

      if (TextbitElement.isTextblock(node)) {
        const texts = Node.texts(node)
        const strings: Node[] = []

        for (let val of texts) {
          if (Array.isArray(val) && val.length && val[0]?.text !== '') {
            strings.push({
              id: uuid.v4(),
              class: className,
              type: type,
              properties: subtype ? { type: subtype } : {},
              children: [{
                text: val[0].text
              }]
            })
          }
        }

        Transforms.removeNodes(editor, { at: [position] })
        Transforms.insertNodes(editor, strings, { at: [position] })
      }
    }
  })
}

export function insertAt(editor: Editor, position: number, nodes: Node | Node[]): void {
  const nodeArray: Node[] = Array.isArray(nodes) ? nodes : [nodes]

  if (!nodeArray.length) {
    return
  }

  // Ensure all nodes have an id
  nodeArray.forEach((node: any) => {
    if (!node.id) {
      node.id = uuid.v4()
    }
  })

  Transforms.insertNodes(
    editor,
    nodes,
    {
      at: [position]
    }
  )
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

export function getSelectedText(editor: Editor, range?: BaseRange): string | undefined {
  const useRange = range || Editor.unhangRange(editor, editor.selection as BaseRange)
  return Editor.string(editor, useRange)
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
