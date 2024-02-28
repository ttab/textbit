import React, { PropsWithChildren } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { hasMark } from '@/lib/hasMark'
import { PluginRegistryAction } from '../PluginRegistry/lib/types'
import { toggleLeaf } from '@/lib/toggleLeaf'


export const Item = ({ action }: PropsWithChildren & {
  action: PluginRegistryAction
}) => {
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const isActive = hasMark(editor, action.plugin.name)
  const Tool = !Array.isArray(action.tool) ? action.tool : action.tool[0]

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
      {!!Tool && <Tool editor={editor} />}
      <em className={`${isActive ? 'active' : ''}`}></em>
    </>
  </div >
}
