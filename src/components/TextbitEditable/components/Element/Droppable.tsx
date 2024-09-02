import React, { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { PropsWithChildren } from "react"
import { Descendant, Editor, Element } from 'slate'
import { useSlateSelection, useSlateStatic } from 'slate-react'

import { DragstateContext } from '../../DragStateProvider'
import { pipeFromDrop } from '../../../../lib/pipes'
import { usePluginRegistry } from '@/components/PluginRegistry'
import { TextbitPlugin } from '@/lib'

type Box = {
  top: number
  right: number
  bottom: number
  left: number
}

type DroppableProps = {
  element?: Element
}

export const Droppable = ({ children, element }: PropsWithChildren & DroppableProps) => {
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const ref = useRef<HTMLDivElement>(null)
  const ctx = useContext(DragstateContext)
  const { plugins } = usePluginRegistry()
  const [box, setBox] = useState<Box>({ top: 0, right: 0, bottom: 0, left: 0 })
  const dataId = element?.id || ''
  const draggable = ['block', 'void'].includes(element?.class || '') ? 'true' : 'false'
  const plugin = plugins.find(p => p.name === element?.type)
  const isDroppable = TextbitPlugin.isElementPlugin(plugin) && !!plugin?.componentEntry?.droppable
  const calculateBox = useCallback(() => {
    const { top, right, bottom, left } = ref?.current?.getBoundingClientRect() || { top: 0, right: 0, bottom: 0, left: 0 }
    setBox({ top, right, bottom, left })
  }, [])

  useLayoutEffect(() => {
    calculateBox()

    window.addEventListener('resize', calculateBox)
    return () => {
      window.removeEventListener('resize', calculateBox)
    }
  }, [ref, selection])

  return <div
    ref={ref}
    draggable={draggable}
    data-id={dataId}
    onDragEnd={() => {
      ctx?.onDragLeave()

      const el = ref.current
      if (!el) {
        return
      }
      el.style.opacity = '1'

      // Remove the temporary element
      const temps = document.getElementsByClassName('textbit-dragged-temp')
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
      const el = ref.current
      if (!el) {
        return
      }

      // Create cloned element to force as drag image
      const clone = el.cloneNode(true) as HTMLDivElement
      const { left, top } = el.getBoundingClientRect()

      const clonedChild = clone.firstChild as HTMLDivElement
      clonedChild.style.transform = 'scale(0.6) rotate(2deg)'
      clone.style.width = `${el.offsetWidth}px`
      clone.style.height = `${el.offsetHeight}px`
      clone.style.position = 'absolute'
      clone.style.top = '-9999px'
      clone.classList.add('textbit-dragged-temp') // Used to clean out in dragEnd()

      document.body.appendChild(clone)

      el.style.opacity = '0.5'
      e.dataTransfer.clearData()
      e.dataTransfer.setData("textbit/droppable-id", dataId)
      e.dataTransfer.setDragImage(
        clone,
        (e.clientX - left),
        (e.clientY - top)
      )
    }}
    onDragEnterCapture={(e) => {
      e.preventDefault()
      e.stopPropagation()
      ctx?.onDragEnter()
    }}
    onDragLeaveCapture={(e) => {
      e.preventDefault()
      e.stopPropagation()
      ctx?.onDragLeave()
    }}
    onDragOverCapture={(e) => {
      e.stopPropagation()
      e.preventDefault()

      const position = getDropPlacement(e, ref?.current, isDroppable)
      ctx?.setOffset({
        position,
        ...box
      })
    }}
    onDropCapture={(e) => {
      if (ctx?.onDrop) {
        ctx.onDrop(e)
      }

      const container = ref.current
      if (!container) {
        return
      }

      const id = ref.current?.dataset?.id || null
      if (id === null) {
        return
      }

      // TODO: Name and node can in the future be used to let plugins say that the
      // node/plugin itself want to handle/hijack the drop for a component to handle.
      // const name = droppableRef.current?.dataset?.name || null
      const [position /*, node */] = getDropPosition(editor, e, container, id, isDroppable)

      pipeFromDrop(editor, plugins, e, position)
    }}>
    {children}
  </div >
}

function getDropPosition(editor: Editor, e: React.DragEvent, container: HTMLDivElement, id: string, isDroppable: boolean): [number, Descendant | undefined] {
  let position = -1
  const node = editor.children.find((el: any, idx: number) => {
    position = idx
    return el.id === id
  })

  return [position + (getDropPlacement(e, container, isDroppable) ? 0 : 1), node]
}

function getDropPlacement(e: React.DragEvent, container: HTMLDivElement | null, isDroppable: boolean): ['above' | 'below', boolean] {
  if (!container) {
    return ['above', false]
  }

  const rect = e.currentTarget.getBoundingClientRect()
  const y = Math.round(e.clientY - rect.top)

  if (y < container.offsetHeight * 0.2) {
    return ['above', false]
  }
  else if (y < container.offsetHeight * 0.5) {
    return ['above', isDroppable]
  }
  else if (y < container.offsetHeight * 0.8) {
    return ['below', isDroppable]
  }
  else {
    return ['below', false]
  }
}
