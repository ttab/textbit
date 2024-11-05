import { type PropsWithChildren, Children } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import type { PluginRegistryAction } from '../PluginRegistry/lib/types'
import { Editor } from 'slate'
import { TextbitElement } from '../../lib'
import { hasMark } from '../../lib/hasMark'
import { toggleLeaf } from '../../lib/toggleLeaf'

export const Item = ({ action, className, children }: PropsWithChildren & {
  action: PluginRegistryAction
  className?: string
}) => {
  const editor = useSlateStatic()
  useSlateSelection()

  const isActive = hasMark(editor, action.plugin.name)
  const leafEntry = Editor.nodes(editor, {
    mode: 'lowest'
  }).next().value || undefined

  const inlineNode = Editor.nodes(editor, {
    match: n => TextbitElement.isElement(n) && n.class === 'inline'
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
    return <div data-state='active'>
      {!Children.count(children)
        ? <Tool editor={editor} active={isActive} entry={inlineNode} />
        : <Tool editor={editor} active={isActive} entry={inlineNode}>{children}</Tool>
      }
      <em className='active'></em>
    </div>
  }

  return <div
    data-state={isActive ? 'active' : 'inactive'}
    className={className || ''}
    onMouseDown={(e) => {
      e.preventDefault()
      if (true === action.handler({ editor })) {
        toggleLeaf(editor, action.plugin.name)
      }
    }}
  >
    <Tool editor={editor} active={isActive} entry={leafEntry}>{children}</Tool>
  </div >
}
