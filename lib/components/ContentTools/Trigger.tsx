import { type PropsWithChildren, useContext, useLayoutEffect } from 'react'
import { useClickGlobal } from '../../hooks/useClickGlobal'
import { MenuContext } from './MenuContext'
import { GutterContext } from '../GutterProvider/GutterContext'

export function Trigger({ children, className }: PropsWithChildren & {
  className?: string
  children?: React.ReactNode
}) {
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
