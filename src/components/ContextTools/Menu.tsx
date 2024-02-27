import React, { PropsWithChildren, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocused, useSlateStatic } from 'slate-react'
import { useKeydownGlobal, useClickGlobal } from '../../hooks'

import { Popover } from './Popover'
import './index.css'
import { PositionContext } from './PositionProvider'

export const Menu = ({ children }: PropsWithChildren) => {
  const { offset } = useContext(PositionContext)
  const editor = useSlateStatic()
  const [isOpen, setIsOpen] = useState(false)
  const { selection } = editor
  const focused = useFocused()
  const ref = useRef<HTMLDivElement>(null)

  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>((e) => {
    setIsOpen(false)
  })

  if (!selection || !offset || !focused) {
    return
  }

  return (
    <div ref={ref} style={{ left: `${offset.x}`, top: `${offset.y} px` }} className='textbit-contexttools-menu'>
      <a
        ref={mouseTriggerRef}
        className="textbit-contexttools-trigger"
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
