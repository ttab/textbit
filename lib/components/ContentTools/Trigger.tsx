import { type PropsWithChildren, useContext, useLayoutEffect } from 'react'
import { useClickGlobal } from '../../hooks/useClickGlobal'
import { MenuContext } from './MenuContext'
import { GutterContext } from '../GutterProvider/GutterContext'

export function Trigger({ children, className }: PropsWithChildren & {
  className?: string
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const { setTriggerBox } = useContext(GutterContext)
  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>(() => {
    setIsOpen(false)
  })

  useLayoutEffect(() => {
    if (mouseTriggerRef?.current) {
      const rect = mouseTriggerRef.current.getBoundingClientRect()
      setTriggerBox(rect)
    }
  }, [mouseTriggerRef, setTriggerBox, isOpen])

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
