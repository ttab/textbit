import { type TBElement } from '../types'
import { TextbitElement } from './textbit-element'
import { type EditorNodesOptions } from 'slate'
import {
  Editor,
  Node,
  Text,
  type NodeEntry,
  type EditorInterface,
  type BaseRange,
  Transforms,
  type Descendant,
  Range
} from "slate"

interface TextbitEditorInterface extends EditorInterface {
  position: (editor: Editor) => number
  length: (editor: Editor) => number
  parents: (editor: Editor, options?: EditorNodesOptions<TBElement> | undefined) => Generator<NodeEntry<TBElement>, void, undefined>
  selectedTextEntries: (editor: Editor) => NodeEntry<Node>[]
  includes: (editor: Editor, type: string) => boolean,
  getSelectedText: (editor: Editor, range?: BaseRange) => string | undefined,
  replaceStringAtPosition: (editor: Editor, targetString: string, replacementString: string) => void
  insertAt: (editor: Editor, position: number, nodes: Node | Node[]) => void,
  hasText: (nodes: NodeEntry<Descendant>[]) => boolean,
  convertToTextNode: (editor: Editor, type: string, role?: string, nodes?: NodeEntry<Node>[]) => void
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

  /** Return all text nodes in current selection */
  selectedTextEntries: (editor) => {
    if (!Range.isRange(editor.selection)) {
      return []
    }

    const nodeItr = Editor.nodes(editor, {
      at: editor.selection,
      match: (node) => {
        return Text.isText(node)
      }
    })

    return Array.from(nodeItr)
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
   * Replace a given target string with another string if cursor is placed in
   * the given target string. Useful for replacing misspelled words on context clicks.
   *
   * @param editor - A slate editor instance
   * @param targetString - The string to replace
   * @param replacementString - The string to replace with
   */
  replaceStringAtPosition: (editor, targetString, replacementString) => {
    // Check if we have a selection
    if (!editor.selection) {
      return
    }

    // Get the current cursor position
    const cursor = editor.selection.anchor

    // Get the node and path at cursor position
    const [node] = Editor.node(editor, cursor.path)

    // Make sure we're in a text node
    if (!Text.isText(node)) {
      return
    }

    // Find the correct occurrence of the string (could be many)
    let index = cursor.offset - targetString.length // Start search from offset index
    if (index < 0) {
      index = 0
    }
    let targetStart = -1
    let targetEnd = -1

    while ((index = node.text.indexOf(targetString, index)) !== -1) {
      if (cursor.offset >= index && cursor.offset <= index + targetString.length) {
        targetStart = index
        targetEnd = index + targetString.length
        break
      }
      index += 1
    }

    if (targetStart === -1) {
      return
    }

    const range = {
      anchor: { path: cursor.path, offset: targetStart },
      focus: { path: cursor.path, offset: targetEnd }
    }

    // Perform the replacement
    Transforms.insertText(editor, replacementString, {
      at: range
    })
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
   * @param role string e.g heading-1, preamble (or even undefined for body text) - Optional
   */
  convertToTextNode(editor, type, role = undefined) {
    if (!editor.selection) {
      return
    }

    const targetNodes = Array.from(
      Editor.nodes(editor, {
        mode: 'highest',
        at: Editor.unhangRange(editor, editor.selection),
        match: n => !Editor.isEditor(n)
      })
    )

    if (!targetNodes.length) {
      return
    }

    Editor.withoutNormalizing(editor, () => {
      for (let n = 0; n < targetNodes.length; n++) {
        const [child, childPath] = targetNodes[n]

        if (!TextbitElement.isOfType(child, 'core/text') && (
          TextbitElement.isTextblock(child) ||
          TextbitElement.isText(child)
        )) {
          Transforms.removeNodes(editor, { at: childPath })

          const textContent = Node.string(child)
          if (textContent) {
            Transforms.insertNodes(
              editor,
              {
                type,
                properties: role ? { role } : {},
                children: [{ text: textContent }]
              },
              { at: childPath }
            )
          }
        }

        if (TextbitElement.isOfType(child, 'core/text')) {
          Transforms.setNodes(
            editor,
            { type: 'core/text', properties: role ? { role } : {} },
            { at: childPath }
          )
        }
      }
    })
  }
}
