import { type Dispatch, type SetStateAction, createContext, type DragEvent } from 'react'

export type Offset = {
  bbox?: DOMRect
  position?: ['above' | 'below', boolean] // Drop should be above/below, or boolean true then could be inside)
}

export type DragStateContextInterface = {
  dragOver: boolean
  offset?: Offset
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
  setOffset: Dispatch<SetStateAction<Offset | undefined>>
}

export const DragstateContext = createContext<DragStateContextInterface>({
  dragOver: false,
  onDragEnter: () => { },
  onDragLeave: () => { },
  onDrop: () => { },
  setOffset: () => { }
})
