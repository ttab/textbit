import React, { useContext, useRef } from 'react'
import { DragstateContext } from './DragStateProvider'
import { GutterContext } from '../GutterProvider'

export const DropMarker = ({ className }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { box: gutterBox, width: gutterWidth } = useContext(GutterContext)
  const { offset, dragOver } = useContext(DragstateContext)
  const { top = 0, bottom = 0, position = ['above', false] } = offset || {}

  const def = !!className ? {} : {
    height: '3px',
    backgroundColor: 'rgb(191, 191, 191)',
    borderRadius: '2px'
  }

  const pos: React.CSSProperties = {
    display: 'none'
  }

  let dragOverState: 'none' | 'around' | 'between' = 'none'

  if (!!position[1]) {
    // Position around element
    dragOverState = 'around'

    const xPos = top - (gutterBox?.top || 0)
    pos.top = `${xPos}px`
    pos.left = `${gutterWidth || 0}px`
    pos.width = `${(gutterBox?.right || 0) - (gutterBox?.left || 0) - (gutterWidth)}px`
    pos.height = `${bottom - top}px`
    if (!className) {
      pos.backgroundColor = 'rgba(191, 191, 191, 0.4)'
      pos.borderRadius = '4px'
    }
  }
  else {
    // Position above or below element
    dragOverState = 'between'

    const xPos = (position[0] === 'above' ? top : bottom) - (gutterBox?.top || 0)
    pos.top = `${xPos}px`
    pos.left = `${gutterWidth || 0}px`
    pos.width = `${(gutterBox?.right || 0) - (gutterBox?.left || 0) - (gutterWidth)}px`
  }

  pos.display = dragOver ? 'block' : 'none'

  return <div
    ref={ref}
    className={className}
    data-dragover={dragOver ? dragOverState : 'none'}
    style={{
      pointerEvents: 'none',
      position: 'absolute',
      userSelect: 'none',
      ...def,
      ...pos
    }} />
}
