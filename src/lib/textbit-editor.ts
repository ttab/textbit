import { TextbitElement } from './textbit-element'
import {
  Editor,
  Node,
  Text,
  NodeEntry,
  EditorInterface,
  Path
} from "slate"

interface TextbitEditorInterface extends EditorInterface {
  position: (editor: Editor) => number
  length: (editor: Editor) => number
  parents: <T extends Node>(editor: Editor) => Generator<NodeEntry<T>, void, undefined>
  selectedTextEntries: (editor: Editor) => NodeEntry<Node>[]
  includes: (editor: Editor, type: string) => boolean
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
  }
}
