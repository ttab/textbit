import {
  Editor,
  Range,
  Element as SlateElement,
  Path,
  Text,
  Transforms,
  Location
} from 'slate'
import { type PluginRegistryComponent } from '../../../components/PluginRegistry/lib/types'
import { TextbitElement } from '../../../lib'

export const withInsertBreak = (editor: Editor, components: Map<string, PluginRegistryComponent>) => {
  const { insertBreak } = editor

  editor.insertBreak = () => {
    if (!allowBreak(editor, components)) {
      return
    }

    const { isAtEnd, next } = isAtEndOfTopLevelNode(editor) || {}
    if (isAtEnd) {
      Transforms.insertNodes(editor, {
        id: crypto.randomUUID(),
        class: 'text',
        type: 'core/text',
        children: [{ text: '' }]
      }, next ? { at: next } : undefined)

      if (next) {
        Transforms.select(editor, Editor.start(editor, next))
      }
      return
    }

    insertBreak()
  }

  return editor
}

/**
 * Check whether break is allowed in either anchor or focus of the selection
 */
function allowBreak(
  editor: Editor,
  components: Map<string, PluginRegistryComponent>
): boolean {
  const { selection } = editor
  if (!selection) return true

  const points = Range.isCollapsed(selection)
    ? [selection.anchor]
    : [selection.anchor, selection.focus]

  for (const point of points) {
    for (const [node] of Editor.levels(editor, { at: point })) {
      if (SlateElement.isElement(node)) {
        const component = components.get(node.type)
        if (component?.componentEntry?.constraints?.allowBreak === false) {
          return false
        }
      }
    }
  }

  return true
}

function isAtEndOfTopLevelNode(editor: Editor): {
  isAtEnd: boolean
  next?: Location
} | undefined {
  const { selection } = editor
  if (!selection || !Range.isCollapsed(selection)) return

  const [node, path] = Editor.node(editor, selection)
  if (!Text.isText(node)) return

  const topLevelPath = [path[0]]
  const topEntry = Editor.node(editor, topLevelPath)
  const lastText = Editor.last(editor, topLevelPath)

  return {
    isAtEnd: Editor.isEnd(editor, selection.anchor, lastText?.[1] ?? path),
    next: TextbitElement.isBlock(topEntry[0]) ? Path.next(topEntry[1]) : undefined
  }
}
