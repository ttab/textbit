import { TBElement } from '@/lib/textbit-element'
import { Editor, Element } from 'slate'

export const withInline = (editor: Editor) => {
  const { isInline } = editor

  editor.isInline = (element: Element) => {
    return TBElement.isInline(element) ? true : isInline(element)
  }

  return editor
}
