import React, { PropsWithChildren, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GutterContext } from '../TextbitUI'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { MdCheck } from 'react-icons/md'

import './index.css'
import { BaseSelection, Editor, Element, Transforms } from 'slate'
import { useClickGlobal } from '@/hooks/useClickGlobal'
import { Plugin } from '@/types'
import { pipeFromFileInput } from '@/lib/pipes'
import { usePluginRegistry } from '@/components/PluginRegistry'

const Menu = ({ children }: PropsWithChildren) => {
  const { offset } = useContext(GutterContext)
  const editor = useSlateStatic()
  const [isOpen, setIsOpen] = useState(false)
  const { selection } = editor
  const ref = useRef<HTMLDivElement>(null)

  const triggerRef = useClickGlobal<HTMLAnchorElement>((e) => {
    setIsOpen(false)
  })

  if (!selection) {
    return
  }

  return (
    <div ref={ref} style={{ top: `${offset}px` }} className='textbit-contenttools-menu'>
      <a
        ref={triggerRef}
        className="textbit-contenttools-trigger"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
      >
        ⋮
      </a>

      {isOpen && ref?.current && createPortal(
        <MenuPopover>{children}</MenuPopover>,
        ref.current
      )}
    </div>
  )
}

const MenuPopover = ({ children }: PropsWithChildren) => {
  return (
    <div className="textbit-contenttools-popover">
      {children}
    </div >
  )
}

const Item = ({ children, action, active }: PropsWithChildren & {
  // tool: Plugin.ToolComponent<Plugin.ToolComponentProps> | null,
  action: Plugin.Action,
  active: boolean
}) => {
  const { plugins } = usePluginRegistry()
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const isActive = isBlockActive(editor, selection, action)
  const Tool = Array.isArray(action.tool) ? action.tool[0] || null : action.tool || null

  return <a
    className="textbit-contenttools-item"
    onMouseDown={(e) => {
      e.preventDefault()
      action.handler({
        editor,
        api: {
          // FIXME: This is not a good way to give access to an api...
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
    <div className={`textbit-contenttools-icon ${isActive ? 'active' : ''}`}>
      {isActive && <MdCheck />}
      {!isActive && Tool && <Tool editor={editor} />}
    </div>
    {children}
  </a>
}

const Label = ({ children }: PropsWithChildren) => {
  return <div className="textbit-contenttools-label">{children}</div>
}

const Hotkey = ({ children }: PropsWithChildren) => {
  return <div className="textbit-contenttools-hotkey">{children}</div>
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

export const ContentTools = {
  Menu,
  Item,
  Label,
  Hotkey
}
