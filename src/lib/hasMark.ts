import { Editor, Text } from 'slate'
import { TBEditor } from '@/lib/textbit-editor'

export const hasMark = (editor: Editor, format: string) => {
  const nodes = TBEditor.selectedTextEntries(editor)

  if (!nodes.length) {
    return false
  }

  const hasType = nodes.length === nodes.reduce((acc, [node]) => {
    const hasOwn = Text.isText(node) && Object.keys(node).includes(format) && node[format] === true
    return hasOwn ? acc + 1 : acc
  }, 0)

  return hasType
}
