import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocused, useSlateSelection, useSlateStatic } from 'slate-react'
import { Editor, Range } from 'slate'
import { TextbitElement } from '../../utils/textbit-element'
import { useSelectionBoundsNonReactive } from '../../hooks/useSelectionBounds'


export function Menu({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
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


function Popover({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const bounds = useSelectionBoundsNonReactive()
  const focused = useFocused()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) {
      return
    }

    if (!focused || !bounds.current || !selection) {
      el.style.opacity = '0'
      el.style.zIndex = '-1'
      return
    }

    if (Range.isCollapsed(selection)) {
      const node = Editor.nodes(editor, {
        at: selection,
        match: (n) => TextbitElement.isElement(n) && n.class === 'inline'
      }).next().value

      if (!node) {
        el.style.opacity = '0'
        el.style.zIndex = '-1'
        return
      }
    }

    const { top, left } = (ref.current)
      ? calculatePosition(
        ref.current.getBoundingClientRect(),
        bounds.current
      )
      : {
        top: 0,
        left: 0
      }

    el.style.opacity = '1'
    el.style.zIndex = 'auto'
    el.style.top = `${top}px`
    el.style.left = `${left}px`
  }, [ref, bounds, editor.selection])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: '0',
        zIndex: '-1',
        position: 'absolute'
      }}
    >
      {children}
    </div>
  )
}

interface BoundingBox {
  top: number
  left: number
  width: number
  height: number
}

function calculatePosition(popoverBounds: BoundingBox, selectionBounds: BoundingBox) {
  const gap = 2

  // Calculate initial centered position
  let left = selectionBounds.left + (selectionBounds.width / 2) - (popoverBounds.width / 2)
  let top = selectionBounds.top - popoverBounds.height - gap

  // Constrain to viewport bounds
  const viewportWidth = window.innerWidth

  // Prevent going off left or right edges
  left = Math.max(gap, Math.min(left, viewportWidth - popoverBounds.width - gap))

  // When going above viewport, position below selection instead
  if (top < gap) {
    top = selectionBounds.top + selectionBounds.height + gap
  }

  return { top, left }
}
