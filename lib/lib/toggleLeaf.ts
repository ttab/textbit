import { Editor } from 'slate'
import { hasMark } from './hasMark'

export const toggleLeaf = (editor: Editor, format: string) => {
  if (!hasMark(editor, format)) {
    Editor.addMark(editor, format, true)
  } else {
    Editor.removeMark(editor, format)
  }
}
