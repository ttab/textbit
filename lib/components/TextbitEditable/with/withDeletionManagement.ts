import { Editor, Element, Node, Path, Range, Text, Transforms } from 'slate'
import { TextbitElement } from '../../../lib'

export const withDeletionManagement = (editor: Editor) => {
  const { deleteBackward, deleteForward } = editor

  editor.deleteBackward = (unit) => {
    const { selection } = editor

    if (selection && isAtStartOfTopLevelNode(editor)) {
      const [entry] = Editor.nodes(editor, {
        match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        at: selection
      })

      if (!entry) {
        return deleteBackward(unit)
      }

      const [node, path] = entry
      const string = Node.string(node)

      // If we are at offset 0 in the first text child of a block node we
      // do not allow backspace at all.
      const firstTextEntry = Editor.first(editor, path)
      if (firstTextEntry
        && TextbitElement.isBlock(node)
        && Path.equals(selection.focus.path, firstTextEntry[1])
        && selection.focus.offset === 0) {
        return
      }

      // If we are on the first node in the document and the node is empty we should
      // delete the node instead of a following block node. Necessary to be able to
      // delete an empty start line first in the document. Allowing backspace to do
      // this as Mac users don't have a DEl button.
      if (!string.length && path[0] === 0) {
        if (editor.children.length > 1) {
          Transforms.removeNodes(editor, { at: path })
        }
        return
      }

      // If we're last in the document and the node is empty, delete the current
      // node. This differs from elsewhere in the document where we slate rather
      // delete the previous or joins nodes. This is necessary to be able to delete
      // an empty last line.
      const nextPath = Path.next(path)
      if (!string.length && nextPath[0] >= editor.children.length) {
        Transforms.removeNodes(editor, { at: path })
        return
      }

      // If the previous node is a block node we want to remove the whole block
      // node instead of moving inside.
      if (path[0] > 0) {
        const prevPath = Path.previous(path)
        const prevEntry = Editor.node(editor, prevPath)
        if (prevEntry) {
          const [prevNode] = prevEntry
          if (Element.isElement(prevNode) && prevNode.class === 'block') {
            Transforms.removeNodes(editor, { at: prevPath })
            return
          }
        }
      }
    }

    deleteBackward(unit)
  }

  editor.deleteForward = (unit) => {
    const { selection } = editor

    if (selection && isAtEndOfTopLevelNode(editor)) {
      const [entry] = Editor.nodes(editor, {
        match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
        at: selection
      })

      if (!entry) {
        return deleteForward(unit)
      }

      const [node, path] = entry
      const string = Node.string(node)

      // If we are on the first node in the document and the node is empty we should
      // delete the node instead of a following block node. Necessary to be able to
      // delete an empty start line first in the document. But only if there are more
      // nodes in the document.
      if (!string.length && path[0] === 0 && editor.children.length > 1) {
        Transforms.removeNodes(editor, { at: path })
        return
      }

      if (path[0] < editor.children.length - 1) {
        const [nextNode, nextPath] = Editor.node(editor, [path[0] + 1])
        if (Element.isElement(nextNode) && nextNode.class === 'block') {
          Transforms.removeNodes(editor, { at: nextPath })
          return
        }
      }
    }

    deleteForward(unit)
  }

  return editor
}

function isAtStartOfTopLevelNode(editor: Editor) {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return false

  const [node, path] = Editor.node(editor, selection)
  if (!Text.isText(node)) return false

  const topLevelPath = [path[0]]
  const firstText = Editor.first(editor, topLevelPath)
  return Editor.isStart(editor, selection.anchor, firstText?.[1] ?? path)
}

function isAtEndOfTopLevelNode(editor: Editor) {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return false

  const [node, path] = Editor.node(editor, selection)
  if (!Text.isText(node)) return false

  const topLevelPath = [path[0]]
  const lastText = Editor.last(editor, topLevelPath)
  return Editor.isEnd(editor, selection.anchor, lastText?.[1] ?? path)
}
