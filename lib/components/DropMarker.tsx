import React, { useContext, useRef } from 'react'
import { GutterContext } from './GutterProvider'
import { DragstateContext } from '../contexts/DragStateContext'

export function DropMarker({ className, style = {} }: {
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { gutterBox } = useContext(GutterContext)
  const { offset, dragOver } = useContext(DragstateContext)

  const def = {
    height: '3px',
    backgroundColor: 'rgb(191, 191, 191)',
    borderRadius: '2px'
  }

  const pos: React.CSSProperties = {
    display: 'block'
  }

  const { bbox, position } = offset || {}
  let dragOverState: 'none' | 'around' | 'between' = 'none'

  pos.left = gutterBox?.width || 0
  pos.width = bbox?.width

  if (position?.[1]) {
    // Position around element
    dragOverState = 'around'
    pos.top = (bbox?.top || 0) - (gutterBox?.top || 0)
    pos.height = (bbox?.height || 0) + 2

    pos.backgroundColor = 'rgba(191, 191, 191, 0.4)'
    pos.borderRadius = '4px'
  } else {
    // Position above or below element
    dragOverState = 'between'
    pos.top = (
      (position?.[0] === 'above')
        ? (bbox?.top || 0) - (gutterBox?.top || 0) - 2
        : (bbox?.top || 0) - (gutterBox?.top || 0) - 2 + (bbox?.height || 0)
    )
  }

  pos.display = dragOver ? 'block' : 'none'

  return (
    <div
      ref={ref}
      className={className}
      data-dragover={dragOver ? dragOverState : 'none'}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        userSelect: 'none',
        ...def,
        ...pos,
        ...style,
      }}
    />
  )
}
