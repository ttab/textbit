import { useContext, useLayoutEffect, useRef } from 'react'
import { MenuContext } from './Menu'
import { useKeydownGlobal } from '../../hooks/useKeydownGlobal'
import { createPortal } from 'react-dom'
import { useTextbitSelectionBoundsState } from '../../hooks/useSelectionBounds'
import { GutterContext } from '../GutterProvider/GutterContext'

export function Content({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useContext(MenuContext)
  const keyTriggerRef = useKeydownGlobal<HTMLDivElement>((e) => {
    if (isOpen && (e.key === 'Escape' || e.key === 'Tab')) {
      e.preventDefault()
      setIsOpen(false)
    }
  })

  return (
    <div ref={keyTriggerRef}>
      {isOpen && createPortal(
        <Popover className={className}>
          {children}
        </Popover>,
        document.body)}
    </div>
  )
}

function Popover({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const { triggerSize, gutterBox } = useContext(GutterContext)
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useTextbitSelectionBoundsState()

  useLayoutEffect(() => {
    const el = ref?.current
    if (!gutterBox || !bounds || !el) {
      return
    }

    const { top, left } = (ref.current)
      ? calculatePosition(
        ref.current?.getBoundingClientRect(),
        bounds,
        gutterBox
      )
      : {
        top: 0,
        left: 0
      }

    el.style.top = `${top}px`
    el.style.left = `${left}px`
  }, [bounds, gutterBox, triggerSize])

  return (
    <div ref={ref} className={className} style={{ position: 'absolute' }}>
      {children}
    </div>
  )
}


type Rect = Omit<DOMRect, 'toJSON'>

function calculatePosition(
  popoverBounds: Rect,
  selectionBounds: Rect,
  gutterBounds: Rect) {
  const gap = 2

  // Calculate initial position
  let left = gutterBounds.right - window.scrollX
  let top = selectionBounds.top - gap

  // Constrain to viewport bounds
  const viewportWidth = window.innerWidth

  // Prevent going off left or right edges
  left = Math.max(gap, Math.min(left, viewportWidth - popoverBounds.width - gap))

  // When going above viewport, position below selection instead
  if (top + popoverBounds.height > window.innerHeight) {
    top = selectionBounds.top - popoverBounds.height
  }

  return { top, left }
}
