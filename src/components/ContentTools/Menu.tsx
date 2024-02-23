import React, { PropsWithChildren, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSlateStatic } from 'slate-react'
import { useKeydownGlobal, useClickGlobal } from '../../hooks'
import { GutterContext } from '@/components/GutterProvider/GutterProvider'

import { Popover } from './Popover'
import './index.css'

export const Menu = ({ children }: PropsWithChildren) => {
  const { offset } = useContext(GutterContext)
  const editor = useSlateStatic()
  const [isOpen, setIsOpen] = useState(false)
  const { selection } = editor
  const ref = useRef<HTMLDivElement>(null)

  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>((e) => {
    setIsOpen(false)
  })

  if (!selection) {
    return
  }

  return (
    <div ref={ref} style={{ top: `${offset}px` }} className='textbit-contenttools-menu'>
      <a
        ref={mouseTriggerRef}
        className="textbit-contenttools-trigger"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
      >
        ⋮
      </a>

      {isOpen && ref?.current && createPortal(
        <MenuPopover setIsOpen={setIsOpen}>
          {children}
        </MenuPopover>,
        ref.current
      )}
    </div>
  )
}


const MenuPopover = ({ children, setIsOpen }: PropsWithChildren & {
  setIsOpen: (open: boolean) => void
}) => {
  const keyTriggerRef = useKeydownGlobal<HTMLDivElement>((e) => {
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault()
      setIsOpen(false)
    }
  })

  return <div ref={keyTriggerRef}>
    <Popover>{children}</Popover>
  </div>
}
