import React, {
  PropsWithChildren,
  Children
} from 'react'
import { useSlateStatic } from 'slate-react'
import { hasMark } from '@/lib/hasMark'
import { PluginRegistryAction } from '../PluginRegistry/lib/types'
import { toggleLeaf } from '@/lib/toggleLeaf'
import { Editor, Element } from 'slate'

export const Item = ({ action, className, children }: PropsWithChildren & {
  action: PluginRegistryAction
  className?: string
}) => {
  const editor = useSlateStatic()
  const isActive = hasMark(editor, action.plugin.name)
  const leafEntry = Editor.nodes(editor, {
    mode: 'lowest'
  }).next().value || undefined
  const isActiveInlineNode = leafEntry && Element.isElement(leafEntry[0]) && leafEntry[0].type === action.plugin.name

  // TODO: Correctly identify active items

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
        ? <Tool editor={editor} active={isActive} entry={leafEntry} />
        : <Tool editor={editor} active={isActive} entry={leafEntry}>{children}</Tool>
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
      ? <Tool editor={editor} active={isActive} entry={leafEntry}>{children}</Tool>
      : <Tool editor={editor} active={isActive} entry={leafEntry}>{children}</Tool>
    }
  </div >
}
