import { useCallback, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useContextMenuHints } from './useContextMenuHints'
import { ContextMenuHintsContext } from './ContextMenuHintsContext'
import { useTextbit } from '../../hooks/useTextbit'

export function Menu({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  return createPortal(
    <Popover className={className}>
      {children}
    </Popover>,
    document.body
  )
}

function Popover({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const { readOnly } = useTextbit()
  const contextMenuContext = useContext(ContextMenuHintsContext)
  const ref = useRef<HTMLDivElement>(null)
  const { menu } = useContextMenuHints()

  const updatePosition = useCallback(() => {
    const el = ref.current
    if (!el || !menu?.position) {
      return
    }

    const rect = el.getBoundingClientRect()
    const { x, y } = menu.position
    const gap = 8

    let left = x
    let top = y + gap // Position below by default

    // Horizontal bounds
    const maxLeft = window.innerWidth - rect.width - gap
    left = Math.max(gap, Math.min(left, maxLeft))

    // Vertical bounds - flip to below if not enough space above
    if (top + rect.height > window.innerHeight - gap) {
      top = y - rect.height - gap
    }

    el.style.transform = `translate(${left}px, ${top}px)`
  }, [menu?.position])

  // Close menu on outside interaction
  useEffect(() => {
    if (!menu?.position || readOnly) return

    const handleOutsideInteraction = (event: Event) => {
      if (ref.current?.contains(event.target as Node)) {
        return
      }
      contextMenuContext?.dispatch({
        menu: undefined,
        spelling: undefined
      })
    }

    // Use one handler for both events
    window.addEventListener('pointerdown', handleOutsideInteraction, { capture: true })
    window.addEventListener('keydown', handleOutsideInteraction, { capture: true })

    return () => {
      window.removeEventListener('pointerdown', handleOutsideInteraction, { capture: true })
      window.removeEventListener('keydown', handleOutsideInteraction, { capture: true })
    }
  }, [readOnly, menu?.position, contextMenuContext])

  // Update position when menu appears or position changes
  useEffect(() => {
    if (!readOnly && menu?.position) {
      // Use requestAnimationFrame for smooth positioning
      requestAnimationFrame(updatePosition)
    }
  }, [readOnly, menu?.position, updatePosition])

  if (!menu?.position || readOnly) {
    return null
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        willChange: 'transform',
        pointerEvents: 'auto',
        zIndex: 9702
      }}
    >
      {children}
    </div>
  )
}
