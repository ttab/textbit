import React, { PropsWithChildren, useContext } from 'react'
import { useClickGlobal } from '@/hooks'
import { MenuContext } from './Menu'

export const Trigger = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useContext(MenuContext)

  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>((e) => {
    setIsOpen(false)
  })

  return (
    <a
      ref={mouseTriggerRef}
      className={className}
      onMouseDown={(e) => {
        e.preventDefault()
        setIsOpen(!isOpen)
      }}
    >
      {children}
    </a>
  )
}
