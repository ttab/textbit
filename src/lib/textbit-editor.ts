import { TextbitElement } from './textbit-element'
import {
  Editor,
  Node,
  Text,
  NodeEntry,
  EditorInterface,
  Path,
  BaseRange,
  Transforms,
  Descendant
} from "slate"
import * as uuid from 'uuid'
import { getSelectedNodeEntries } from './utils'


interface TextbitEditorInterface extends EditorInterface {
  position: (editor: Editor) => number
  length: (editor: Editor) => number
  parents: <T extends Node>(editor: Editor) => Generator<NodeEntry<T>, void, undefined>
  selectedTextEntries: (editor: Editor) => NodeEntry<Node>[]
  includes: (editor: Editor, type: string) => boolean,
  getSelectedText: (editor: Editor, range?: BaseRange) => string | undefined,
  insertAt: (editor: Editor, position: number, nodes: Node | Node[]) => void,
  hasText: (nodes: NodeEntry<Descendant>[]) => boolean,
  convertToTextNode: (editor: Editor, type: string, subtype?: string, nodes?: NodeEntry<Node>[]) => void
}

export const TextbitEditor: TextbitEditorInterface = {
  ...Editor,

  /** Return start position of the starting element of the current selection (collapsed or not collapsed) in the editor */
  position: (editor): number => {
    const { selection } = editor

    if (!selection) {
      return -1
    }

    const range = Editor.unhangRange(editor, selection)
    return (range && range.anchor.path.length) ? range.anchor.path[0] : -1
  },

  /** Return number of top level elements in editor */
  length: (editor): number => {
    return Array.from(
      Editor.nodes(editor, {
        at: [],
        mode: 'highest',
        match: n => TextbitElement.isElement(n)
      })).length
  },

  /** Return an iterator of all top level elements in editor */
  parents: (editor) => {
    return Editor.nodes(editor, {
      at: [],
      mode: 'highest',
      match: n => TextbitElement.isElement(n)
    })
  },

  /** Return all text nodes in selection */
  selectedTextEntries: (editor) => {
    const { selection } = editor

    if (!selection) {
      return []
    }

    const matcherFunc = (node: Node, path: Path) => {
      if (!Text.isText(node)) {
        return false
      }

      const [parentNode] = Editor.parent(editor, path)
      return TextbitElement.isElement(parentNode) && (!editor.isVoid(parentNode) || editor.markableVoid(parentNode))
    }

    return Array.from(
      Editor.nodes(editor, {
        match: matcherFunc,
        voids: false
      })
    )
  },

  /**
   * Check if selection includes specified element type.
   *
   * @param editor
   * @param type
   * @returns boolean
   */
  includes: (editor, type) => {
    const { selection } = editor

    if (!selection) {
      return false
    }

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: node =>
          !Editor.isEditor(node) &&
          TextbitElement.isElement(node) &&
          node.type === type
      })
    )

    return !!match
  },

  /**
   * Get selected text either from selected text in editor or from a range in an editor
   *
   * @param editor Editor
   * @param range  Optional Range
   * @returns string
   */
  getSelectedText: (editor, range) => {
    const useRange = range || Editor.unhangRange(editor, editor.selection as BaseRange)
    return Editor.string(editor, useRange)
  },

  /**
   * Insert a node at the specified position
   *
   * @param editor Editor
   * @param position number
   * @param nodes Node or Nodes to insert
   * @returns void
   */
  insertAt(editor: Editor, position: number, nodes: Node | Node[]): void {
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
  },

  /**
   * Check if a list of node entries has text in them. Useful in normalizers.
   *
   * @example
   * const normalizeBlockquote = (editor: Editor, nodeEntry: NodeEntry) => {
   *   const [node, path] = nodeEntry
   *   const children = Array.from(Node.children(editor, path))
   *   const isEmpty = !hasText(children)
   *   // ...
   * }
   *
   * @param nodes
   * @returns
   */
  hasText(nodes) {
    for (const [node] of nodes) {
      for (const textNode of Node.texts(node)) {
        if (textNode[0].text.trim() !== '') {
          return true
        }
      }
    }

    return false
  },

  /**
   * Convert nodes to a specified text node type
   *
   * @todo Allow even when one or several elements are not text/text blocks.
   * @todo Store selection and restore it after transforms
   *
   * @param editor Editor
   * @param type string i.e core/text
   * @param subtype string e.g heading-1, preamble (or even undefined for body text) - Optional
   * @param nodes Node[] - Optional
   */
  convertToTextNode(editor, type, subtype = undefined, nodes = undefined) {
    const targetNodes = nodes || getSelectedNodeEntries(editor)

    if (!targetNodes.length) {
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
            { match: n => TextbitElement.isElement(n) && Editor.isBlock(editor, n) && n?.properties?.type !== subtype }
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
                class: 'text',
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

}
