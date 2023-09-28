import React from 'react' // Necessary for esbuild
import { PropsWithChildren, useRef, useMemo, createContext, DragEvent } from "react"

import DropMarker from "./dropMarker"

type DragAndDropProps = PropsWithChildren //& { expandHeight: boolean }

type DragState = {
    onDragEnter: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
    setPosition: (offsetTop: number) => void
}

const DragstateContext = createContext<DragState | null>(null)

const DragAndDrop = ({ children }: DragAndDropProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const markerRef = useRef<HTMLDivElement | null>(null)
    const counter = useRef(0)

    const onDragEnter = () => {
        containerRef.current?.classList.add('textbit-drag-over')
        markerRef.current?.classList.add('active')
        counter.current++
    }

    const onDragLeave = () => {
        setTimeout(() => {
            if (--counter.current === 0) {
                containerRef.current?.classList.remove('textbit-drag-over')
                markerRef.current?.classList.remove('active')
            }
        })
    }

    const onDrop = (e: DragEvent) => {
        containerRef.current?.classList.remove('textbit-drag-over')
        markerRef.current?.classList.remove('active')
    }

    const setMarkerPosition = (offsetTop: number) => {
        const top = `${offsetTop}px`
        if (!markerRef.current || top === markerRef.current?.style.top) {
            return
        }

        markerRef.current.style.top = top
    }

    return (
        <DragstateContext.Provider value={{ onDragEnter, onDragLeave, onDrop, setPosition: setMarkerPosition }}>
            <div
                ref={containerRef}
                className="textbit-drag-container"
            >
                <DropMarker ref={markerRef} />
                {children}
            </div>
        </DragstateContext.Provider >
    )
}

export { DragAndDrop, DragstateContext }