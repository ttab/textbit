import React, { PropsWithChildren, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSlateStatic } from 'slate-react'
import { useClickGlobal } from '@/hooks/useClickGlobal'
import { GutterContext } from '@/components/GutterProvider/GutterProvider'

import { Popover } from './Popover'
import './index.css'

export const Menu = ({ children }: PropsWithChildren) => {
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
        <Popover>{children}</Popover>,
        ref.current
      )}
    </div>
  )
}
