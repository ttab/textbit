import { type PropsWithChildren, useContext, useEffect } from 'react'
import { useClickGlobal } from '../../hooks/useClickGlobal'
import { MenuContext } from './MenuContext'
import { GutterContext } from '../GutterProvider/GutterContext'

export function Trigger({ children, className }: PropsWithChildren & {
  className?: string
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const { triggerRef, updateTriggerRef } = useContext(GutterContext)
  const mouseTriggerRef = useClickGlobal<HTMLAnchorElement>(() => {
    setIsOpen(false)
  })

  // Sync the local ref to the context ref
  useEffect(() => {
    if (triggerRef && mouseTriggerRef.current) {
      updateTriggerRef(mouseTriggerRef.current)
    }
  }, [triggerRef, updateTriggerRef,mouseTriggerRef])

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
