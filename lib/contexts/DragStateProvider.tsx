import { useState, useRef } from 'react'
import { DragstateContext, type Offset } from './DragStateContext'

export function DragStateProvider({ children }: {
  children: React.ReactNode
}) {
  const counter = useRef(0)
  const [offset, setOffset] = useState<Offset | undefined>(undefined)
  const [dragOver, setDragOver] = useState<boolean>(false)

  const onDragEnter = () => {
    setDragOver(true)
    counter.current++
  }

  const onDragLeave = () => {
    setTimeout(() => {
      if (--counter.current === 0) {
        setDragOver(false)
      }
    })
  }

  const onDrop = () => {
    setDragOver(false)
  }

  // Div relative is necessary for DropMarker positioning
  return (
    <DragstateContext.Provider value={{ dragOver, offset, setOffset, onDragEnter, onDragLeave, onDrop }}>
    <div style={{
      height: '100%',
      position: 'relative'
    }}>
      {children}
    </div>
    </DragstateContext.Provider>
  )
}
