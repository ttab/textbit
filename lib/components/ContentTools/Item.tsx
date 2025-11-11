import React, { type PropsWithChildren } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { type BaseSelection, Editor, Element } from 'slate'
import { pipeFromFileInput } from '../../utils/pipes'
import { TextbitElement } from '../../utils/textbit-element'
import type { PluginRegistryAction } from '../../contexts/PluginRegistry/lib/types'
import { usePluginRegistry } from '../../hooks/usePluginRegistry'
import { ItemContext } from './ItemContext'

export function Item({ children, className, action: actionName }: PropsWithChildren & {
  className?: string
  action: string
}) {
  const { plugins, actions } = usePluginRegistry()
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const action = actions.find((a) => a.name === actionName)

  if (!action) {
    return <></>
  }

  const [isVisible, , isActive] = visibilityBySelection(editor, selection, action) || [false, false, false]

  if (!isVisible) {
    return <></>
  }

  return (
    <ItemContext.Provider value={{ isActive: isActive ? true : false, action }}>
      <a
        className={className}
        data-state={isActive ? 'active' : 'inactive'}
        onMouseDown={(e) => {
          e.preventDefault()
          action.handler({
            editor,
            options: action.plugin.options,
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


function visibilityBySelection(editor: Editor, selection: BaseSelection, action: PluginRegistryAction): [boolean, boolean, boolean] {
  if (!selection) {
    return [false, false, false]
  }

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (el) => {
        return !Editor.isEditor(el) && Element.isElement(el)
      }
    })
  )

  if (!match.length) {
    return [false, false, false]
  }

  if (!action?.visibility) {
    return [false, false, false]
  }

  if (!TextbitElement.isElement(match[0])) {
    return [false, false, false]
  }

  const status = action?.visibility(match[0]) // [visible, enabled, active]
  return status || [[false, false, false]]
}
