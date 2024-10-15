import React, { PropsWithChildren, useContext, useLayoutEffect, useState } from 'react'
import { useClickGlobal } from '@/hooks'
import { MenuContext } from './Menu'
import { GutterContext } from '../GutterProvider'

export const Trigger = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const [marginLeft, setMarginLeft] = useState(0)
  const { width: gutterWidth, setTriggerSize } = useContext(GutterContext)
  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>((e) => {
    setIsOpen(false)
  })

  useLayoutEffect(() => {
    const { width: triggerWidth } = mouseTriggerRef?.current?.getBoundingClientRect() || {}
    setMarginLeft(triggerWidth ? (gutterWidth - triggerWidth) / 2 : 0)
    setTriggerSize(triggerWidth || 0)
  }, [mouseTriggerRef])

  return (
    <a
      ref={mouseTriggerRef}
      className={className}
      onMouseDown={(e) => {
        e.preventDefault()
        setIsOpen(!isOpen)
      }}
      style={{
        marginLeft: marginLeft
      }}
    >
      {children}
    </a>
  )
}
