import React, { useContext, useRef, useLayoutEffect, useState } from 'react'
import { DragstateContext } from '../contexts/DragStateContext'

export function DropMarker({ className, style = {} }: {
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { offset, dragOver } = useContext(DragstateContext)
  const [editableRect, setEditableRect] = useState<DOMRect | null>(null)

  // Get the editable container dimensions
  useLayoutEffect(() => {
    if (!ref.current || !dragOver) return

    // Find the contenteditable element (the actual Slate editable area)
    const container = ref.current.parentElement
    if (container) {
      const editable = Array.from(container.children).find(
        child => child.getAttribute('contenteditable') === 'true'
      ) as HTMLElement

      if (editable) {
        setEditableRect(editable.getBoundingClientRect())
      }
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

  if (dragOver && offset && editableRect) {
    const { bbox, position } = offset

    if (!bbox) {
      return null
    }

    // Calculate position relative to the editable element
    // bbox is already the bounding rect of the Slate element node
    const relativeLeft = bbox.left - editableRect.left
    const relativeTop = bbox.top - editableRect.top

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
