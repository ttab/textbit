import { getNodeEntryFromDomNode } from '@/lib/utils'
import { RefObject, useEffect } from 'react'
import { NodeEntry } from 'slate'
import { useSlateStatic } from 'slate-react'

interface ContextMenuEvent {
  x: number
  y: number
  target: HTMLElement
  originalEvent: MouseEvent,
  nodeEntry: NodeEntry
}

type ContextMenuHandler = (event: ContextMenuEvent) => void

export function useContextMenu(
  ref: RefObject<HTMLElement>,
  onContextMenu: ContextMenuHandler,
  preventDefault = true
) {
  const editor = useSlateStatic()

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const contextMenuHandler = (event: MouseEvent) => {
      const targetElement = (event.target as Node).nodeType === Node.TEXT_NODE
        ? (event.target as Text).parentElement
        : (event.target as HTMLElement)

      if (!targetElement || !element.contains(targetElement)) {
        return
      }
      debugger
      if (preventDefault) {
        event.preventDefault()
      }

      const nodeEntry = getNodeEntryFromDomNode(editor, targetElement)
      if (!nodeEntry) {
        return
      }

      onContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: targetElement,
        originalEvent: event,
        nodeEntry
      })
    }

    window.addEventListener('contextmenu', contextMenuHandler)

    return () => window.removeEventListener('contextmenu', contextMenuHandler)
  }, [ref, onContextMenu, preventDefault])
}
