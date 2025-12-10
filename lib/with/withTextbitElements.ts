import { Editor, Element } from 'slate'

export function withTextbitElements(editor: Editor) {
  const { isInline, isBlock, isVoid } = editor

  editor.isInline = (element: Element) => {
    return (Element.isElement(element) && element.class === 'inline')
      ? true
      : isInline(element)
  }

  editor.isBlock = (element: Element) => {
    return (Element.isAncestor(element) && Element.isElement(element) && element.class === 'block')
      ? true
      : isBlock(element)
  }

  editor.isVoid = (element: Element) => {
    return (Element.isElement(element) && element.class === 'void')
      ? true
      : isVoid(element)
  }

  editor.isTextBlock = (value: unknown): value is Element => {
    return Element.isElement(value) && value.class === 'text'
  }

  editor.isOfType = <T extends Element>(value: unknown, type: string): value is T => {
    return Element.isElement(value) && value?.type === type
  }

  return editor
}
