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


export const Item = ({ action, children }: PropsWithChildren & {
  action: PluginRegistryAction
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

  return <div
    className={`textbit-contexttools-item`}
    onMouseDown={(e) => {
      e.preventDefault()
      if (true === action.handler({ editor })) {
        toggleLeaf(editor, action.plugin.name)
      }
    }}
  >
    <>
      {!Children.count
        ? <Tool editor={editor} active={isActive} entry={nodeEntry} />
        : <Tool editor={editor} active={isActive} entry={nodeEntry}>{children}</Tool>
      }
      <em className={`${isActive ? 'active' : ''}`}></em>
    </>
  </div >
}
