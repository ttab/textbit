import React, { useContext, useRef } from 'react'
import { PropsWithChildren } from "react"
import { Descendant, Editor, Element, Transforms } from 'slate'
import { useSlateStatic } from 'slate-react'

import { Registry } from '../../../registry'
import { DragstateContext } from '../../dragndrop'
import { handleDrop } from '../../../../../lib/hookableEvents'

type DroppableProps = {
    element: Element
}

export const Droppable = ({ children, element }: PropsWithChildren & DroppableProps) => {
    const droppableRef = useRef<HTMLDivElement>(null)
    const ctx = useContext(DragstateContext)
    const editor = useSlateStatic()

    const dataId = element?.id || ''
    const draggable = ['block', 'void'].includes(element?.class || '') ? 'true' : 'false'


    return <div
        ref={droppableRef}
        className="droppable-block"
        draggable={draggable}
        data-id={dataId}
        onDragEnd={(e) => {
            ctx?.onDragLeave(e)

            const el = droppableRef.current
            if (!el) {
                return
            }
            el.style.opacity = '1'

            // Remove the temporary element
            const temps = document.getElementsByClassName('mimer-dragged-temp')
            if (temps.length) {
                for (const t of temps) {
                    if (t.parentNode) {
                        t.parentNode.removeChild(t)
                    }
                }
            }
        }}
        onDragStartCapture={(e) => {
            if (!dataId) {
                return
            }

            e.stopPropagation()
            const el = droppableRef.current
            if (!el) {
                return
            }

            // Create cloned element to force as drag image
            const clone = el.cloneNode(true) as HTMLDivElement
            const { left, top } = el.getBoundingClientRect()

            clone.style.transform = "translateX(-10000px)"
            clone.style.width = `${el.offsetWidth * 0.4}px`
            clone.style.height = `${el.offsetHeight * 0.4}px`

            clone.classList.add('mimer-dragged-temp') // Used to clean out in dragEnd()
            document.body.appendChild(clone)

            el.style.opacity = '0.5'
            e.dataTransfer.clearData()
            e.dataTransfer.setData("mimer/droppable-id", dataId)
            e.dataTransfer.setDragImage(
                clone,
                (e.clientX - left) * 0.2,
                (e.clientY - top) * 0.2
            )
        }}
        onDragEnterCapture={(e) => {
            e.preventDefault()
            e.stopPropagation()
            ctx?.onDragEnter(e)
        }}
        onDragLeaveCapture={(e) => {
            e.preventDefault()
            e.stopPropagation()
            ctx?.onDragLeave(e)
        }}
        onDragOverCapture={(e) => {
            const container = droppableRef.current
            if (container && ctx?.setPosition) {
                const topHalf = isTopHalf(e, container)
                if (topHalf) {
                    ctx.setPosition(container.offsetTop)
                }
                else {
                    ctx.setPosition(container.offsetTop + container.offsetHeight)
                }
            }

            e.stopPropagation()
            e.preventDefault()
        }}
        onDropCapture={(e) => {
            const container = droppableRef.current
            if (!container || !ctx?.onDrop) {
                return
            }

            const id = droppableRef.current?.dataset?.id || null
            if (id === null) {
                return
            }

            // TODO: Name and node can in the future be used to let plugins say that the
            // node/plugin itself want to handle/hijack the drop - not implemented yet
            // const name = droppableRef.current?.dataset?.name || null
            const [position, node] = getDropPosition(editor, e, container, id)

            // Handle internal drag'n drops...
            const nativeDataTransfer = e.nativeEvent.dataTransfer
            if (nativeDataTransfer) {
                const id = nativeDataTransfer.getData('mimer/droppable-id')
                if (id) {
                    e.stopPropagation()
                    e.preventDefault()
                    ctx?.onDrop(e)
                    moveNode(editor, id, position)
                    return
                }
            }

            // Second, see if any dropHandlers want to handle it
            // FIXME: Let more than one answer to the drop. Show dialog to user who can choose hemself.
            const dropHandler = Registry.events.find(dh => dh.on === 'drop' && dh.match && dh.match(e))
            if (!dropHandler) {
                return
            }

            e.stopPropagation()
            e.preventDefault()
            ctx?.onDrop(e)

            handleDrop(editor, e, position, dropHandler)
        }}>
        <div className="droppable-area">
            {children}
        </div>
    </div >
}

function moveNode(editor: Editor, id: string, to: number) {
    let from: number = 0
    let node: Element | undefined = undefined

    for (const child of editor.children as Element[]) {
        if (child.id === id) {
            node = child
            break
        }
        from++
    }

    if (!node) {
        return
    }

    Transforms.moveNodes(editor, { at: [from], to: [to] })
}

function getDropPosition(editor: Editor, e: React.DragEvent, container: HTMLDivElement, id: string): [number, Descendant | undefined] {
    let position = -1
    const node = editor.children.find((el: any, idx: number) => {
        position = idx
        return el.id === id
    })

    return [position + (isTopHalf(e, container) ? 0 : 1), node]
}

function isTopHalf(e: React.DragEvent, container: HTMLDivElement) {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = Math.round(e.clientY - rect.top)

    return (y < container.offsetHeight / 2) ? true : false
}