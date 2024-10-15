import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef
} from 'react'
import { MenuContext } from './Menu'
import { useKeydownGlobal } from '@/hooks'
import { createPortal } from 'react-dom'
import { GutterContext } from '../GutterProvider'

export const Content = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const { offsetY, triggerSize } = useContext(GutterContext)
  const innerRef = useRef<HTMLDivElement>(null)

  const recalculateTop = useCallback(() => {
    if (!innerRef?.current) {
      return
    }

    const scrollOffset = window.scrollY
    let offset = offsetY + (triggerSize * 0.75) + scrollOffset
    innerRef.current.style.top = `${offset}px`

    // Ensure sure the menu is not hidden below viewport bottom
    const innerRect = innerRef.current.getBoundingClientRect()
    const diff = innerRect.bottom - window.innerHeight

    if (diff > 0) {
      offset -= diff
    }

    innerRef.current.style.top = `${offset}px`
  }, [isOpen, innerRef?.current])

  useLayoutEffect(() => {
    requestAnimationFrame(recalculateTop)
  })

  const keyTriggerRef = useKeydownGlobal<HTMLDivElement>((e) => {
    if (isOpen && (e.key === 'Escape' || e.key === 'Tab')) {
      e.preventDefault()
      setIsOpen(false)
    }
  })

  return <div ref={keyTriggerRef} style={{ height: 'full' }}>
    {isOpen && createPortal(
      <div
        ref={innerRef}
        className={className}
        style={{
          position: 'absolute'
        }}
      >
        {children}
      </div>,
      document.body
    )}
  </div>
}
