import { TextbitElement } from './textbit-element'
import {
  Editor as SlateEditor,
  Node,
  Text,
  NodeEntry,
  EditorInterface,
  Path
} from "slate"
import { TBEditor } from '../types'

interface TextbitEditorInterface extends EditorInterface {
  position: (editor: TBEditor) => number
  length: (editor: TBEditor) => number
  parents: <T extends Node>(editor: TBEditor) => Generator<NodeEntry<T>, void, undefined>
  selectedTextEntries: (editor: TBEditor) => NodeEntry<Node>[]
  includes: (editor: TBEditor, type: string) => boolean
}
export declare type TextbitEditor = TextbitEditorInterface

export const TextbitEditor: TextbitEditor = {
  ...SlateEditor,

  /** Return start position of the starting element of the current selection (collapsed or not collapsed) in the editor */
  position: (editor): number => {
    const { selection } = editor

    if (!selection) {
      return -1
    }

    const range = SlateEditor.unhangRange(editor, selection)
    return (range && range.anchor.path.length) ? range.anchor.path[0] : -1
  },

  /** Return number of top level elements in editor */
  length: (editor): number => {
    return Array.from(
      SlateEditor.nodes(editor, {
        at: [],
        mode: 'highest',
        match: n => TextbitElement.isElement(n)
      })).length
  },

  /** Return an iterator of all top level elements in editor */
  parents: (editor) => {
    return SlateEditor.nodes(editor, {
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

      const [parentNode] = SlateEditor.parent(editor, path)
      return TextbitElement.isElement(parentNode) && (!editor.isVoid(parentNode) || editor.markableVoid(parentNode))
    }

    return Array.from(
      SlateEditor.nodes(editor, {
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
      SlateEditor.nodes(editor, {
        at: SlateEditor.unhangRange(editor, selection),
        match: node =>
          !SlateEditor.isEditor(node) &&
          TextbitElement.isElement(node) &&
          node.type === type
      })
    )

    return !!match
  }
}
