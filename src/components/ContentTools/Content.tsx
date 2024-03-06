import React, { PropsWithChildren, useContext, useEffect, useRef } from 'react'
import { MenuContext } from './Menu'
import { useKeydownGlobal } from '@/hooks'
import { createPortal } from 'react-dom'

export const Content = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const ref = useRef<HTMLDivElement>(null)

  const keyTriggerRef = useKeydownGlobal<HTMLDivElement>((e) => {
    if (isOpen && (e.key === 'Escape' || e.key === 'Tab')) {
      e.preventDefault()
      setIsOpen(false)
    }
  })

  return <div ref={keyTriggerRef}>
    <div ref={ref}>
      {
        isOpen && ref?.current && createPortal(
          <div className={className}>
            {children}
          </div>,
          ref.current
        )
      }
    </div>
  </div>
}
