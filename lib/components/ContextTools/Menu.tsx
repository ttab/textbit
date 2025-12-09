import { useCallback, useContext, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocused, useSlateSelection, useSlateStatic } from 'slate-react'
import { Editor, Range } from 'slate'
import { TextbitElement } from '../../utils/textbit-element'
import { useSelectionBounds } from '../../hooks/useSelectionBounds'
import { ContextMenuHintsContext } from '../ContextMenu/ContextMenuHintsContext'

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
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const bounds = useSelectionBounds()
  const focused = useFocused()
  const ref = useRef<HTMLDivElement>(null)
  const contextMenuHintsContext = useContext(ContextMenuHintsContext)
  const isContextMenuOpen = contextMenuHintsContext?.menu != null

  const shouldShow = useCallback(() => {
    if (!focused || !bounds || !selection) {
      return false
    }

    // If selection is collapsed, only show if on an inline element
    if (Range.isCollapsed(selection)) {
      const node = Editor.nodes(editor, {
        at: selection,
        match: (n) => TextbitElement.isElement(n) && n.class === 'inline'
      }).next().value

      return !!node
    }

    // Selection is expanded (text selected), show it
    return true
  }, [focused, bounds, selection, editor])

  const updatePosition = useCallback(() => {
    const el = ref.current
    const selectionBounds = bounds

    if (!el || !selectionBounds) {
      return
    }

    const rect = el.getBoundingClientRect()
    const gap = 8

    // Center horizontally on selection, position above by default
    let left = selectionBounds.left + (selectionBounds.width / 2) - (rect.width / 2)
    let top = selectionBounds.top - rect.height - gap

    // Horizontal bounds
    const maxLeft = window.innerWidth - rect.width - gap
    left = Math.max(gap, Math.min(left, maxLeft))

    // Vertical bounds - flip to below if not enough space above
    if (top < gap) {
      top = selectionBounds.top + selectionBounds.height + gap
    }

    el.style.transform = `translate(${left}px, ${top}px)`
    el.style.opacity = '1'
    el.style.pointerEvents = 'auto'
  }, [bounds])

  const hide = useCallback(() => {
    const el = ref.current
    if (el) {
      el.style.opacity = '0'
      el.style.pointerEvents = 'none'
    }
  }, [])

  // Update position or hide based on whether menu should show
  useEffect(() => {
    if (shouldShow() && !isContextMenuOpen) {
      requestAnimationFrame(updatePosition)
    } else {
      hide()
    }
  }, [selection, focused, shouldShow, updatePosition, hide, isContextMenuOpen])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        opacity: 0,
        pointerEvents: 'none',
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  )
}
