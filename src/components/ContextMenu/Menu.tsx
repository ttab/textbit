import React, {
  PropsWithChildren, useCallback, useEffect, useLayoutEffect, useRef
} from 'react'
import { createPortal } from 'react-dom'
import { useContextMenuHints } from './useContextMenuHints'
import { useClickGlobal, useKeydownGlobal } from '@/hooks'


export const Menu = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  return (
    <>
      {createPortal(
        <Popover className={className}>
          {children}
        </Popover>,
        document.body)}
    </>
  )
}


function Popover({ children, className }: PropsWithChildren & {
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { isOpen, position, spelling } = useContextMenuHints()

  const closePopover = useCallback(() => {
    if (ref?.current) {
      ref.current.style.opacity = '0'
      ref.current.style.zIndex = '-1'
    }
  }, [ref?.current])

  useKeydownGlobal(() => {
    closePopover()
  })

  useClickGlobal(() => {
    closePopover()
  })

  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) {
      return
    }

    if (!isOpen || !position) {
      return closePopover()
    }

    if (spelling === undefined) {
      return closePopover()
    }

    const { top, left } = calculatePosition(
      position.x,
      position.y,
      ref.current?.getBoundingClientRect()
    )

    el.style.opacity = '1'
    el.style.zIndex = 'auto'
    el.style.top = `${top}px`
    el.style.left = `${left}px`
  }, [ref, position])

  return (
    <div ref={ref} className={className} style={{
      opacity: '0',
      zIndex: '-1',
      position: 'absolute'
    }}>
      {children}
    </div>
  )
}

function calculatePosition(x: number, y: number, popoverBounds: {
  top: number
  left: number
  width: number
  height: number
}) {
  const gap = 2

  // Calculate initial centered position
  let left = x
  let top = y

  // Constrain to viewport bounds
  const viewportWidth = window.innerWidth

  // Prevent going off left or right edges
  left = Math.max(gap, Math.min(left, viewportWidth - popoverBounds.width - gap))

  // When going above viewport, position below selection instead
  if (top + popoverBounds.height > window.innerHeight) {
    top = y - popoverBounds.height - gap
  }

  return { top, left }
}
