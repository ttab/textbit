import React, { Dispatch, SetStateAction, useState } from 'react' // Necessary for esbuild
import { PropsWithChildren, useRef, createContext, DragEvent } from "react"

type Offset = {
  top: number
  right: number
  bottom: number
  left: number
  position: ['above' | 'below', boolean] // Drop should be above/below, or boolean true then could be inside)
}

type DragStateContextInterface = {
  dragOver: boolean
  offset?: Offset
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
  setOffset: Dispatch<SetStateAction<Offset | undefined>>
}

const DragstateContext = createContext<DragStateContextInterface>({
  dragOver: false,
  onDragEnter: () => { },
  onDragLeave: () => { },
  onDrop: () => { },
  setOffset: () => { },
})

const DragStateProvider = ({ children }: PropsWithChildren) => {
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

  const onDrop = (e: DragEvent) => {
    setDragOver(false)
  }

  return (
    <DragstateContext.Provider value={{ dragOver, offset, setOffset, onDragEnter, onDragLeave, onDrop }}>
      {children}
    </DragstateContext.Provider >
  )
}

export { DragStateProvider, DragstateContext }
