import {
  type PropsWithChildren,
  useContext,
  useLayoutEffect,
  useRef
} from 'react'
import { MenuContext } from './Menu'
import { useKeydownGlobal } from '../../hooks'
import { createPortal } from 'react-dom'
import { GutterContext } from '../GutterProvider'
import { useTextbitSelectionBoundsState } from '../TextbitRoot'

export const Content = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
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


const Popover = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { triggerSize, gutterBox } = useContext(GutterContext)
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useTextbitSelectionBoundsState()

  useLayoutEffect(() => {
    const el = ref?.current
    if (!gutterBox || !bounds || !el) {
      return
    }

    const { top, left } = calculatePosition(
      ref.current?.getBoundingClientRect(),
      bounds,
      gutterBox
    )

    el.style.top = `${top}px`
    el.style.left = `${left}px`
  }, [bounds, gutterBox, triggerSize])

  return <div ref={ref} className={className} style={{ position: 'absolute' }}>
    {children}
  </div>
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
