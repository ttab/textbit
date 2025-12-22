import { Children } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import type { PluginRegistryAction } from '../../contexts/PluginRegistry/lib/types'
import { Editor } from 'slate'
import { TextbitElement } from '../../utils/textbit-element'
import { hasMark } from '../../utils/hasMark'
import { toggleLeaf } from '../../utils/toggleLeaf'

export function Item({ action, className, children }: {
  action: PluginRegistryAction
  className?: string
  children?: React.ReactNode
}) {
  const editor = useSlateStatic()
  useSlateSelection()

  const isActive = hasMark(editor, action.plugin.name)
  const leafEntry = Editor.nodes(editor, {
    mode: 'lowest'
  }).next().value || undefined

  const inlineNode = Editor.nodes(editor, {
    match: (n) => TextbitElement.isElement(n) && n.class === 'inline'
  }).next().value

  const isActiveInlineNode = TextbitElement.isElement(inlineNode?.[0]) && inlineNode[0].type === action.plugin.name

  const Tool = !Array.isArray(action.tool)
    ? action.tool
    : (action.tool.length === 2 && isActiveInlineNode)
      ? action.tool[1]
      : action.tool[0]

  if (!Tool) {
    return
  }

  if (isActiveInlineNode) {
    return (
      <div data-state='active'>
        {!Children.count(children)
          ? <Tool editor={editor} active={isActive} entry={inlineNode} />
          : <Tool editor={editor} active={isActive} entry={inlineNode}>{children}</Tool>
        }
        <em className='active'></em>
      </div>
    )
  }

  return (
    <div
      data-state={isActive ? 'active' : 'inactive'}
      className={className || ''}
      onMouseDown={(event) => {
        const defaultAccepted = action.handler({
          editor,
          event,
          type: action.plugin.name,
          options: {
            ...action.plugin.options
          }
        })

        if (defaultAccepted) {
          toggleLeaf(editor, action.plugin.name)
        }

        if (!event.defaultPrevented) {
          event.preventDefault()
        }
      }}
    >
      <Tool editor={editor} active={isActive} entry={leafEntry}>{children}</Tool>
    </div>
  )
}
