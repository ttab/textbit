import React, {
  PropsWithChildren,
  useContext,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { MenuContext } from './Menu'
import { useKeydownGlobal } from '@/hooks'
import { createPortal } from 'react-dom'

export const Content = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const MIN_BOTTOM_MARGIN = 10

  // Ensure sure the menu is not displayed below browser window bottom
  useLayoutEffect(() => {
    if (!innerRef?.current) {
      return
    }

    let offset = 0
    if (isOpen) {
      const innerRect = innerRef.current.getBoundingClientRect()
      const { paddingBottom, borderBottomWidth } = window.getComputedStyle(innerRef.current!)
      const verticalSpace = parseFloat(paddingBottom) + parseFloat(borderBottomWidth)

      if (innerRect.bottom > window.innerHeight - verticalSpace - MIN_BOTTOM_MARGIN) {
        offset = Math.max(0, innerRect.height - (window.innerHeight - innerRect.top) + verticalSpace + MIN_BOTTOM_MARGIN)
      }
    }

    innerRef.current.style.marginTop = `-${offset}px`
  }, [isOpen, innerRef?.current])

  const keyTriggerRef = useKeydownGlobal<HTMLDivElement>((e) => {
    if (isOpen && (e.key === 'Escape' || e.key === 'Tab')) {
      e.preventDefault()
      setIsOpen(false)
    }
  })

  return <div ref={keyTriggerRef}>
    <div ref={outerRef}>
      {isOpen && outerRef?.current && createPortal(
        <div ref={innerRef} className={className}>
          {children}
        </div>,
        outerRef.current
      )}
    </div>
  </div>
}
