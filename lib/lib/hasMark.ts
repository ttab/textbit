import { Editor, Text } from 'slate'
import { TextbitEditor } from './textbit-editor'

export const hasMark = (editor: Editor, format: string) => {
  const nodes = TextbitEditor.selectedTextEntries(editor)

  if (!nodes.length) {
    return false
  }

  for (const [node] of nodes) {
    if (!Text.isText(node) || !Object.keys(node).includes(format) || node[format] !== true) {
      return false
    }
  }

  return true
}
