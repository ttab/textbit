import { Children } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import type { PluginRegistryAction } from '../../contexts/PluginRegistry/lib/types'
import { Editor } from 'slate'
import { TextbitElement } from '../../utils/textbit-element'
import { hasMark } from '../../utils/hasMark'
import { toggleLeaf } from '../../utils/toggleLeaf'

//
// FIXME: This does not update selection on click (i.e links)
// FIXME: Implement disabled
//
export function Item({ action, className, children }: {
  action: PluginRegistryAction
  className?: string
  children?: React.ReactNode
}) {
  const editor = useSlateStatic()
  const selection = useSlateSelection()

  const isActive = hasMark(editor, action.plugin.name)
  const leafEntry = Editor.nodes(editor, {
    mode: 'lowest'
  }).next().value || undefined

  const inlineNodes = Array.from(Editor.nodes(editor, {
    match: (n) => TextbitElement.isElement(n) && n.class === 'inline' && n.type === action.plugin.name,
    at: selection ?? undefined
  }))

  // Multiple inline nodes can't be handled simultaneously, marked as disabled
  const Tool = (!Array.isArray(action.tool))
    ? action.tool
    : (action.tool.length === 2 && inlineNodes.length === 1)
      ? action.tool[1]
      : action.tool[0]

  if (!Tool) {
    return
  }

  if (inlineNodes.length === 1) {
    const inlineNode = inlineNodes[0]
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
        if (inlineNodes.length > 1) {
          return
        }

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
      <Tool editor={editor} active={isActive} entry={leafEntry}>
        {children}
      </Tool>
    </div>
  )
}
