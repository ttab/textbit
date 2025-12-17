import { useRef, useContext, useCallback } from 'react'
import { type Descendant, Editor, Element as SlateElement } from 'slate'
import { useSlateStatic } from 'slate-react'

import { TextbitPlugin } from '../../utils/textbit-plugin'
import { DragstateContext } from '../../contexts/DragStateContext'
import { pipeFromDrop } from '../../utils/pipes'
import { usePluginRegistry } from '../../hooks/usePluginRegistry'
import { useTextbit } from '../../hooks/useTextbit'
import { hasDraggableDOMTarget } from '../../utils/hasDraggableTarget'
import { hasDraggableElementTarget } from '../../utils/hasDraggableElement'

type Position = ['above' | 'below', boolean] | undefined

interface MouseInfo {
  position?: Position
  bbox: DOMRect | undefined
}


export function Droppable({ children, element }: {
  children: React.ReactNode
  element?: SlateElement
}) {
  const { readOnly } = useTextbit()
  const editor = useSlateStatic()
  const ctx = useContext(DragstateContext)
  const { plugins } = usePluginRegistry()
  const ref = useRef<HTMLDivElement>(null)

  const plugin = plugins.find((p) => p.name === element?.type)
  const isDroppable = TextbitPlugin.isElementPlugin(plugin) && !!plugin?.componentEntry?.droppable

  /**
   * Drag start handler. When the event target node path includes an element
   * with the class "text" dragging should be prevented to allow the user
   * selecting text without accidentally dragging the ancestor block element.
   * If a DOM element ancestor has draggable="true" set it will still allow
   * dragging of the element even when it is class "text".
   */
  const onDragStartCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly || !element?.id) {
      return
    }

    // Check if we need to prevent dragging
    if (!hasDraggableDOMTarget(event) && !hasDraggableElementTarget(editor, event)) {
      event.stopPropagation()
      event.preventDefault()
      return
    }

    event.stopPropagation()
    if (ref?.current) {
      createDragImage(ref.current, event, element.id)
    }
  }, [readOnly, element?.id, editor])

  /**
   * Default handling of some events when in read only mode.
   */
  const handleDragEvent = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) {
      return false
    }

    event.preventDefault()
    event.stopPropagation()
    return true
  }, [readOnly])

  const onDragEnterCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (handleDragEvent(event)) {
      ctx?.onDragEnter()
    }
  }, [ctx, handleDragEvent])

  const onDragLeaveCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (handleDragEvent(event)) {
      ctx?.onDragLeave()
    }
  }, [ctx, handleDragEvent])

  const onDragOverCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (handleDragEvent(event)) {
      ctx.setOffset(dropHints(event, ref?.current, isDroppable))
    }
  }, [ctx, handleDragEvent, isDroppable])

  const onDropCapture = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) {
      event.preventDefault()
      return
    }

    if (ctx?.onDrop) {
      ctx.onDrop(event)
    }

    if (!ref.current || !element?.id) {
      return
    }

    // TODO: Name and node can in the future be used to let plugins say that the
    // node/plugin itself want to handle/hijack the drop for a component to handle.
    // const name = droppableRef.current?.dataset?.name || null
    // const [position /*, node */] = getDropPosition(editor, e, container, id, isDroppable)
    const [position] = dropPosition(editor, event, ref?.current, element.id, isDroppable) || {}
    pipeFromDrop(editor, plugins, event, position)
  }, [ctx, element?.id, editor, isDroppable, plugins, ref, readOnly])

  const onDragEnd = useCallback(() => {
    if (readOnly) {
      return
    }

    ctx?.onDragLeave()

    if (ref?.current) {
      ref.current.style.opacity = '1'
      cleanup()
    }
  }, [readOnly, ctx])

  return (
    <div
      data-id={element?.id || ''}
      ref={ref}
      draggable={['block', 'void'].includes(element?.class || '') ? 'true' : 'false'}
      onDragStartCapture={onDragStartCapture}
      onDragEnterCapture={onDragEnterCapture}
      onDragLeaveCapture={onDragLeaveCapture}
      onDragOverCapture={onDragOverCapture}
      onDropCapture={onDropCapture}
      onDragEnd={onDragEnd}
    >
      {children}
    </div>
  )
}



/*
 * Remove temporarily created drag images
 */
function cleanup() {
  const temps = document.getElementsByClassName('textbit-dragged-temp')
  if (temps.length) {
    for (const t of temps) {
      if (t.parentNode) {
        t.parentNode.removeChild(t)
      }
    }
  }
}


/**
 * Create a dragImage by cloning the dragged element
 */
function createDragImage(el: HTMLDivElement, e: React.DragEvent<HTMLDivElement>, dataId: string) {
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
  e.dataTransfer.setData('textbit/droppable-id', dataId)
  e.dataTransfer.setDragImage(
    clone,
    (e.clientX - left),
    (e.clientY - top)
  )
}


/**
 * This function currently only give you a drop position above or below the target node.
 *
 * TODO: Allow for nodes to receive and handle drops.
 */
function dropPosition(editor: Editor, e: React.DragEvent, container: HTMLDivElement, id: string, isDroppable: boolean): [number, Descendant | undefined] {
  let position = -1
  const node = editor.children.find((el, idx: number) => {
    position = idx
    return el.id === id
  })

  const hints = dropHints(e, container, isDroppable)
  return [position + (hints?.position?.[0] === 'above' ? 0 : 1), node]
}


/**
 * Calculate bounding box of current dom element as well as whether the pointer
 * position will result in a drop above or below or 'on' the hovered element
 */
function dropHints(event: React.DragEvent, domEl: HTMLDivElement | null, isDroppable: boolean): MouseInfo | undefined {
  if (!domEl) {
    return undefined
  }

  const bbox = domEl.getBoundingClientRect()
  const mouseY = event.clientY

  // If mouse is outside horizontal bounds
  if (event.clientX < bbox.left || event.clientX > bbox.right) {
    return {
      position: undefined,
      bbox
    }
  }

  // Calculate relative position as percentage from top of element
  const relativeY = mouseY - bbox.top
  const percentage = (relativeY / bbox.height) * 100

  let position: Position

  if (percentage <= 20) {
    position = ['above', false]
  } else if (percentage <= 50) {
    position = ['above', isDroppable]
  } else if (percentage >= 80) {
    position = ['below', isDroppable]
  } else {
    position = ['below', false]
  }

  return {
    position,
    bbox
  }
}
