import { TextbitElement, type TBActionHandlerArgs } from '../../../../lib/main'
import { Range, Editor, Element, type Descendant, Transforms } from 'slate'

export const actionHandler = (args: TBActionHandlerArgs): void => {
  const { editor, type } = args
  const { selection } = editor

  if (!selection) {
    return // Nothing to do
  }

  const nodeEntries = Array.from(Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: n => !Editor.isEditor(n) && TextbitElement.isInline(n) && TextbitElement.isOfType(n, type)
  }))

  if (nodeEntries.length) {
    const node = nodeEntries[0][0]

    if (Element.isElement(node) && typeof node?.id === 'string') {
      // If we already have a link, focus on it's input
      args.event?.preventDefault()
      args.event?.stopPropagation()
      document.getElementById(node.id)?.focus()
    }
    return
  }

  if (Range.isCollapsed(selection)) {
    return // Nothing to do
  }

  const id = crypto.randomUUID()
  const link: Descendant = {
    class: 'inline',
    type,
    id,
    properties: {
      url: '',
      title: '',
      target: ''
    },
    children: []
  }

  args.event?.preventDefault()
  args.event?.stopPropagation()

  Editor.withoutNormalizing(editor, () => {
    Transforms.wrapNodes(editor, link, { split: true })
  })

  setTimeout(() => {
    document.getElementById(id)?.focus()
  }, 0)
}
