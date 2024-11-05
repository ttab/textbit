import { usePluginRegistry } from '../../../../components/PluginRegistry'
import { TextbitPlugin } from '../../../../lib'
import {
  useRef,
  type PropsWithChildren,
  useContext
} from 'react'

import {
  type Descendant,
  Editor,
  Element as SlateElement
} from 'slate'
import { DragstateContext } from '../../DragStateProvider'
import { pipeFromDrop } from '../../../../lib/pipes'
import { useSlateStatic } from 'slate-react'


type Position = ['above' | 'below', boolean] | undefined

interface MouseInfo {
  position?: Position
  bbox: DOMRect | undefined
}


export const Droppable = ({ children, element }: PropsWithChildren & {
  element?: SlateElement
}) => {
  const editor = useSlateStatic()
  const ctx = useContext(DragstateContext)
  const { plugins } = usePluginRegistry()
  const ref = useRef<HTMLDivElement>(null)

  const plugin = plugins.find(p => p.name === element?.type)
  const isDroppable = TextbitPlugin.isElementPlugin(plugin) && !!plugin?.componentEntry?.droppable

  return (
    <div
      data-id={element?.id || ''}
      ref={ref}
      className="h-full w-full"
      draggable={['block', 'void'].includes(element?.class || '') ? 'true' : 'false'}
      onDragStartCapture={(e) => {
        if (!element?.id) {
          return
        }

        e.stopPropagation()
        if (ref?.current) {
          createDragImage(ref.current, e, element.id)
        }
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
        ctx.setOffset(dropHints(e, ref?.current, isDroppable))
      }}
      onDropCapture={(e) => {
        if (ctx?.onDrop) {
          ctx.onDrop(e)
        }

        if (!ref.current || !element?.id) {
          return
        }

        // TODO: Name and node can in the future be used to let plugins say that the
        // node/plugin itself want to handle/hijack the drop for a component to handle.
        // const name = droppableRef.current?.dataset?.name || null
        // const [position /*, node */] = getDropPosition(editor, e, container, id, isDroppable)
        const [position] = dropPosition(editor, e, ref?.current, element.id, isDroppable) || {}
        pipeFromDrop(editor, plugins, e, position)
      }}
      onDragEnd={() => {
        ctx?.onDragLeave()
        if (ref?.current) {
          ref.current.style.opacity = '1'
          cleanup()
        }
      }}
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
  e.dataTransfer.setData("textbit/droppable-id", dataId)
  e.dataTransfer.setDragImage(
    clone,
    (e.clientX - left),
    (e.clientY - top)
  )
}


/**
 * This function now only give you a drop position above or below the target node.
 *
 * TODO: Allow for nodes to receive and handle drops.
 */
function dropPosition(editor: Editor, e: React.DragEvent, container: HTMLDivElement, id: string, isDroppable: boolean): [number, Descendant | undefined] {
  let position = -1
  const node = editor.children.find((el: any, idx: number) => {
    position = idx
    return el.id === id
  })

  const hints = dropHints(e, container, isDroppable)
  return [position + (hints?.position?.[0] === 'above' ? 0 : 1), node]
}


/**
 * Calculate bounding box of current dom element as well as whether the pointer
 * position will result in a drop above or below or "on" the hovered element
 */
function dropHints(event: React.DragEvent, domEl: HTMLDivElement | null, isDroppable: boolean): MouseInfo | undefined {
  if (!domEl) {
    return undefined
  }

  const bbox = domEl.getBoundingClientRect()
  const mouseY = event.clientY

  // If mouse is within horizontal bounds
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
  }
  else if (percentage <= 50) {
    position = ['above', isDroppable]
  }
  else if (percentage >= 80) {
    position = ['below', isDroppable]
  }
  else {
    position = ['below', false]
  }

  return {
    position,
    bbox
  }
}
