import React, {
  PropsWithChildren, useCallback, useContext, useEffect, useLayoutEffect, useRef
} from 'react'
import { createPortal } from 'react-dom'
import { useContextMenuHints } from './useContextMenuHints'
import { ContextMenuHintsContext } from './ContextMenuHintsContext'


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
  const contextMenuContext = useContext(ContextMenuHintsContext)
  const ref = useRef<HTMLDivElement>(null)
  const { menu, spelling } = useContextMenuHints()

  const hidePopover = useCallback(() => {
    if (!ref?.current) {
      return
    }

    ref.current.style.opacity = '0'
    ref.current.style.zIndex = '-1'
  }, [ref?.current])

  const revealPopover = useCallback(() => {
    if (!ref?.current || !menu?.position) {
      return
    }

    const { top, left } = calculatePosition(
      menu.position.x,
      menu.position.y,
      ref.current?.getBoundingClientRect()
    )

    ref.current.style.opacity = '1'
    ref.current.style.zIndex = ''
    ref.current.style.top = `${top}px`
    ref.current.style.left = `${left}px`
  }, [ref?.current, menu?.position])

  useEffect(() => {
    const clearContextMenu = (event: Event) => {
      if (!ref?.current) {
        return
      }

      if (ref.current.contains(event.target as Node)) {
        return
      }

      if (!contextMenuContext.menu) {
        return
      }

      contextMenuContext?.dispatch({
        menu: undefined,
        spelling: undefined
      })
    }

    window.addEventListener('keydown', clearContextMenu, { passive: true, capture: true })
    window.addEventListener('click', clearContextMenu, { passive: true, capture: true })

    return () => {
      window.removeEventListener('keydown', clearContextMenu, { capture: true })
      window.removeEventListener('click', clearContextMenu, { capture: true })
    }
  }, [contextMenuContext])

  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) {
      return
    }

    if (!menu?.position) {
      return hidePopover()
    }
    else if (spelling === undefined) {
      return hidePopover()
    }
    else {
      revealPopover()
    }
  }, [ref?.current, menu?.position])

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
