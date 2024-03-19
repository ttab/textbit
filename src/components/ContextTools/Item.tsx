import React, {
  PropsWithChildren,
  Children,
  useContext
} from 'react'
import { useSlateStatic } from 'slate-react'
import { hasMark } from '@/lib/hasMark'
import { PluginRegistryAction } from '../PluginRegistry/lib/types'
import { toggleLeaf } from '@/lib/toggleLeaf'
import { PositionContext } from './PositionProvider'
import { Element } from 'slate'


export const Item = ({ action, className, children }: PropsWithChildren & {
  action: PluginRegistryAction
  className?: string
}) => {
  const editor = useSlateStatic()
  const isActive = hasMark(editor, action.plugin.name)
  const { nodeEntry } = useContext(PositionContext)
  const isActiveInlineNode = nodeEntry && Element.isElement(nodeEntry[0]) && nodeEntry[0].type === action.plugin.name

  const Tool = !Array.isArray(action.tool)
    ? action.tool
    : (action.tool.length === 2 && isActiveInlineNode)
      ? action.tool[1]
      : action.tool[0]

  if (!Tool) {
    return
  }

  if (isActiveInlineNode) {
    return <>
      {!Children.count
        ? <Tool editor={editor} active={isActive} entry={nodeEntry} />
        : <Tool editor={editor} active={isActive} entry={nodeEntry}>{children}</Tool>
      }
      <em className={`${isActive ? 'active' : ''}`}></em>
    </>
  }

  // FIXME: Here is an weird logic error (Children.count without func call or parameter) and both ways is always the same output...
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
    {!Children.count
      ? <Tool editor={editor} active={isActive} entry={nodeEntry}>{children}</Tool>
      : <Tool editor={editor} active={isActive} entry={nodeEntry}>{children}</Tool>
    }
  </div >
}
