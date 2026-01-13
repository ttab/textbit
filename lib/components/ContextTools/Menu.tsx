import { useCallback, useEffect, useContext, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocused, useSlateStatic } from 'slate-react'
import { Editor } from 'slate'
import { TextbitElement } from '../../utils/textbit-element'
import { useSelectionBounds } from '../../hooks/useSelectionBounds'
import { ContextMenuHintsContext } from '../ContextMenu/ContextMenuHintsContext'
import type { SelectionBounds } from '../../contexts/SelectionBoundsContext'

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
  const bounds = useSelectionBounds()
  const focused = useFocused()
  const ref = useRef<HTMLDivElement>(null)
  const contextMenuHintsContext = useContext(ContextMenuHintsContext)
  const isContextMenuOpen = contextMenuHintsContext?.menu != null

  const setVisibility = useCallback((visible: boolean) => {
    const el = ref.current
    if (el) {
      el.style.opacity = visible ? '1' : '0'
      el.style.pointerEvents = visible ? 'auto' : 'none'
    }
  }, [])

  useEffect(() => {
    if (!focused) {
      return
    }

    let showMenu = false
    if (!bounds?.isCollapsed) {
      // Non collapsed selections should always show the menu
      showMenu = true
    } else if (editor.selection) {
      // Collapsed selection should still show menu on inline nodes
      const node = Editor.nodes(editor, {
        at: editor.selection,
        match: (n) => TextbitElement.isElement(n) && n.class === 'inline'
      }).next().value
      showMenu = !!node
    }

    if (showMenu && !isContextMenuOpen) {
      setVisibility(true)
    } else {
      setVisibility(false)
    }
  }, [editor, bounds, focused, setVisibility, isContextMenuOpen])

  const move = useCallback((selectionBounds: SelectionBounds) => {
    if (!focused) {
      return
    }

    const el = ref.current

    if (!el || !selectionBounds || selectionBounds.left <= 0 || selectionBounds.top <= 0) {
      // Don't move it if we don't have a selection, this is necessary
      // to allow "secondary" context tools to show up as a result of
      // clicking the primary context tool, e.g link tool input field.
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
  }, [focused])

  useEffect(() => {
    if (bounds) {
      requestAnimationFrame(() => move(bounds))
    } else {
      setVisibility(false)
    }
  }, [move, bounds, setVisibility])

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
        willChange: 'transform',
        zIndex: 9701
      }}
    >
      {children}
    </div>
  )
}
