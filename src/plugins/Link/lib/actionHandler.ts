import { TextbitElement, } from '../../../../lib/main'
import { Range, Editor, Element, type Descendant, Transforms } from 'slate'

export const actionHandler = (editor: Editor, typeName: string): void => {
  if (!editor.selection) {
    return
  }

  const { selection } = editor
  const isCollapsed = selection && Range.isCollapsed(selection)

  // If we already have a link, focus on it's input
  const nodeEntries = Array.from(Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: n => !Editor.isEditor(n) && TextbitElement.isInline(n) && TextbitElement.isOfType(n, typeName)
  }))

  if (nodeEntries.length) {
    const node = nodeEntries[0][0]
    if (Element.isElement(node) && typeof node?.id === 'string') {
      document.getElementById(node.id)?.focus()
    }

    return
  }

  const id = crypto.randomUUID()

  const link: Descendant = {
    class: 'inline',
    type: typeName,
    id,
    properties: {
      url: '',
      title: '',
      target: ''
    },
    children: isCollapsed ? [{ text: '' }] : []
  }

  Editor.withoutNormalizing(editor, () => {
    if (isCollapsed) {
      Transforms.insertNodes(editor, link)
    } else {
      Transforms.wrapNodes(editor, link, { split: true })
      Transforms.collapse(editor, { edge: 'end' })
    }
  })

  setTimeout(() => {
    document.getElementById(id)?.focus()
  }, 0)
}
