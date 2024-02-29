import React, { PropsWithChildren, createContext } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { BaseSelection, Editor, Element } from 'slate'
import { Plugin } from '@/types'
import { pipeFromFileInput } from '@/lib/pipes'
import { usePluginRegistry } from '@/components/PluginRegistry'


export const ItemContext = createContext<{ isActive: boolean, action?: Plugin.Action }>({ isActive: false })

export const Item = ({ children, className, action }: PropsWithChildren & {
  className?: string
  action: Plugin.Action
}) => {
  const { plugins } = usePluginRegistry()
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const isActive = isBlockActive(editor, selection, action)

  return (
    <ItemContext.Provider value={{ isActive: isActive ? true : false, action }}>
      <a
        className={className}
        data-state={isActive ? 'active' : 'inactive'}
        onMouseDown={(e) => {
          e.preventDefault()
          action.handler({
            editor,
            api: {
              // FIXME: This is just to expose some functionality, but it is not a good way to give access to an api...
              consumeFileInputChangeEvent: (
                editor: Editor,
                e: React.ChangeEvent<HTMLInputElement>
              ) => {
                pipeFromFileInput(editor, plugins, e)
              }
            }
          })
        }}
      >
        {children}
      </a>
    </ItemContext.Provider>
  )
}


const isBlockActive = (editor: Editor, selection: BaseSelection, action: any): [boolean, boolean, boolean] => {
  if (!selection) {
    return [false, false, false]
  }

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: el => {
        return !Editor.isEditor(el) &&
          Element.isElement(el)
      }
    })
  )

  if (!match.length) {
    return [false, false, false]
  }

  if (!action?.visibility) {
    return [false, false, false]
  }

  const status = action?.visibility(match[0]) // [visible, enabled, active]
  return status[2]
}
