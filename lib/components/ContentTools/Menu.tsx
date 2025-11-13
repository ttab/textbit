import { useLayoutEffect, useRef, useState } from 'react'
import { useSelectionBounds } from '../../hooks/useSelectionBounds'
import { useFocused } from 'slate-react'
import { MenuContext } from './MenuContext'
import { useTextbit } from '../../hooks/useTextbit'

export function Menu({ children, className, style: inStyle = {} }: {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useSelectionBounds()
  const isFocused = useFocused()
  const { readOnly } = useTextbit()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !bounds || readOnly || !isFocused) {
      return
    }

    const offsetParent = el.offsetParent as HTMLElement
    if (!offsetParent) {
      return
    }

    const containerRect = offsetParent.getBoundingClientRect()
    const selectionTop = bounds.box?.top ?? bounds.top

    // Calculate position relative to the gutter container
    const top = selectionTop - containerRect.top

    el.style.top = `${top}px`
  }, [bounds, readOnly, isFocused])

  // Don't render if editor not focused or no selection
  if (readOnly || !isFocused || !bounds) {
    return null
  }

  return (
    <MenuContext.Provider value={[isOpen, setIsOpen]}>
      <div
        ref={ref}
        className={className}
        data-state={isOpen ? 'open' : 'closed'}
        style={{
          position: 'absolute',
          top: 0,
          zIndex: 9909,
          ...inStyle
        }}
      >
        {children}
      </div>
    </MenuContext.Provider>
  )
}
