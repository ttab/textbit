import { useEffect, useRef } from 'react'
import { useSelectionBounds } from '../main'

/**
 * Display selection DOM bounds directly in the editor.
 * Used in verbose debug mode only.
 */
export function SelectionBoundsDetails() {
  const bounds = useSelectionBounds()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.style.top = `${bounds?.y}px`
    ref.current.style.left = `${bounds?.x}px`
    ref.current.style.width = `${bounds?.width}px`
    ref.current.style.height = `${bounds?.height}px`
  }, [bounds])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        outline: '1px solid rgba(191, 191, 99, 0.5',
        outlineOffset: '4px'
      }}
    >
      {bounds && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 1px)',
            left: 'calc(80% + 4px)',
            pointerEvents: 'none',
            background: 'rgb(255, 255, 255)',
            borderRadius: '2px',
            padding: '4px 6px',
            color: 'rgba(225, 99, 99, 0.8)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            border: '1px solid rgba(255, 99, 99, 0.8)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gridGap: '6px 10px'
          }}
        >
          <div>x:{Math.round(bounds.x)}</div>
          <div>y:{Math.round(bounds.y)}</div>
          <div>w:{Math.round(bounds.width)}</div>
          <div>h:{Math.round(bounds.height)}</div>
        </div>
      )}
    </div>
  )
}
