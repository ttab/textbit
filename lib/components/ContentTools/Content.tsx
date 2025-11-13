import { useContext, useLayoutEffect, useRef } from 'react'
import { MenuContext } from './MenuContext'
import { useKeydownGlobal } from '../../hooks/useKeydownGlobal'
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
      {isOpen && (
        <Popover className={className}>
          {children}
        </Popover>
      )}
    </div>
  )
}

function Popover({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const { triggerRef } = useContext(GutterContext)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const trigger = triggerRef?.current

    if (!trigger || !el) {
      return
    }

    // Get the bounding box of the trigger element
    const triggerBox = trigger.getBoundingClientRect()
    const popoverRect = el.getBoundingClientRect()
    const gap = 8

    // Position to the right of the trigger button
    let left = triggerBox.right + gap
    let top = triggerBox.top

    // Constrain to viewport
    const maxLeft = window.innerWidth - popoverRect.width - gap
    left = Math.min(left, maxLeft)

    // Flip down if not enough space
    if (top + popoverRect.height > window.innerHeight - gap) {
      top = Math.max(gap, window.innerHeight - popoverRect.height - gap)
    }

    el.style.transform = `translate(${left}px, ${top}px)`
  }, [triggerRef])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  )
}
