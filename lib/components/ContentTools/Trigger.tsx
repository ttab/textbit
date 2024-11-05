import { type PropsWithChildren, useContext, useLayoutEffect } from 'react'
import { useClickGlobal } from '../../hooks'
import { MenuContext } from './Menu'
import { GutterContext } from '../GutterProvider'

export const Trigger = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const { gutterBox, setTriggerSize } = useContext(GutterContext)
  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>(() => {
    setIsOpen(false)
  })

  useLayoutEffect(() => {
    if (!gutterBox || !mouseTriggerRef?.current) {
      return
    }

    const { width: triggerWidth } = mouseTriggerRef?.current?.getBoundingClientRect() || {}
    setTriggerSize(triggerWidth || 0)
  }, [mouseTriggerRef, gutterBox, setTriggerSize])

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
