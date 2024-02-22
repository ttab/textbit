import React, { PropsWithChildren, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GutterContext } from '../TextbitUI'
import { useSlateStatic } from 'slate-react'
import { MdCheck } from 'react-icons/md'

import './index.css'
import { Transforms } from 'slate'
import { useClickGlobal } from '@/hooks/useClickGlobal'
import { Plugin } from '@/types'

const Menu = ({ children }: PropsWithChildren) => {
  const [offset] = useContext(GutterContext)
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

const Item = ({ children, tool, active }: PropsWithChildren & {
  tool: Plugin.ToolComponent<Plugin.ToolComponentProps> | null,
  active: boolean
}) => {
  const editor = useSlateStatic()
  const Tool = Array.isArray(tool) ? tool[0] || null : tool || null

  return <div className="textbit-contenttools-item">
    <div className={`textbit-contenttools-icon ${active ? 'active' : ''}`}>
      {active
        ? <MdCheck />
        : <Tool editor={editor} />
      }
    </div>
    {children}
  </div>
}

const Label = ({ children }: PropsWithChildren) => {
  return <div className="textbit-contenttools-label">{children}</div>
}


const Hotkey = ({ children }: PropsWithChildren) => {
  return <div className="textbit-contenttools-hotkey">{children}</div>
}

export const ContentTools = {
  Menu,
  Item,
  Label,
  Hotkey
}
