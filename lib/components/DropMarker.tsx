import React, { useContext, useRef, useLayoutEffect, useState } from 'react'
import { DragstateContext } from '../contexts/DragStateContext'

export function DropMarker({ className, style = {} }: {
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { offset, dragOver } = useContext(DragstateContext)
  // The marker is absolutely positioned, so its coordinates must be relative to
  // its offset parent (the nearest positioned ancestor), NOT the editable. When
  // the editable is inset from that ancestor (e.g. a left gutter margin) the two
  // differ, and measuring the editable would push the marker into the gutter.
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)

  // Measure the offset parent the marker is positioned against.
  useLayoutEffect(() => {
    if (!ref.current || !dragOver) return

    const container = ref.current.parentElement
    if (!container) return

    const origin = nearestPositionedAncestor(container)
    if (origin) {
      setOriginRect(origin.getBoundingClientRect())
    }
  }, [dragOver, offset])

  const def = {
    height: '3px',
    backgroundColor: 'rgb(191, 191, 191)',
    borderRadius: '2px'
  }

  const pos: React.CSSProperties = {
    display: 'none'
  }

  if (dragOver && offset && originRect) {
    const { bbox, position } = offset

    if (!bbox) {
      return null
    }

    // Calculate position relative to the offset parent (the positioned
    // ancestor the marker is absolutely positioned within). bbox is already
    // the bounding rect of the Slate element node.
    const relativeLeft = bbox.left - originRect.left
    const relativeTop = bbox.top - originRect.top

    pos.display = 'block'
    pos.left = relativeLeft
    pos.width = bbox.width

    if (position?.[1]) {
      // Position around element (droppable)
      pos.top = relativeTop
      pos.height = bbox.height + 2
      pos.backgroundColor = 'rgba(191, 191, 191, 0.4)'
      pos.borderRadius = '4px'
    } else {
      // Position above or below element
      pos.top = position?.[0] === 'above'
        ? relativeTop - 2
        : relativeTop + bbox.height - 2
    }
  }

  const dragOverState = !dragOver ? 'none' : offset?.position?.[1] ? 'around' : 'between'

  return (
    <div
      ref={ref}
      className={className}
      data-dragover={dragOverState}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        margin: 0,
        userSelect: 'none',
        ...def,
        ...pos,
        ...style,
      }}
    />
  )
}

/**
 * Nearest ancestor (including `el` itself) with a non-static `position`, i.e.
 * the offset parent that an absolutely-positioned descendant is placed
 * against. Returns null if none is found (no positioned ancestor in the tree).
 */
function nearestPositionedAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el
  while (node) {
    if (getComputedStyle(node).position !== 'static') return node
    node = node.parentElement
  }
  return null
}
