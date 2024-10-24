import { getNodeEntryFromDomNode } from '@/lib/utils'
import { RefObject, useEffect } from 'react'
import { NodeEntry } from 'slate'
import { useSlateStatic } from 'slate-react'

interface ContextMenuEvent {
  x: number
  y: number
  target: HTMLElement
  originalEvent: MouseEvent
  nodeEntry: NodeEntry
  spelling?: {
    error: string
    suggestions: string[]
  }
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
        nodeEntry,
        spelling: getSpellingData(targetElement)
      })
    }

    window.addEventListener('contextmenu', contextMenuHandler)

    return () => window.removeEventListener('contextmenu', contextMenuHandler)
  }, [ref, onContextMenu, preventDefault])
}

function getSpellingData(element: HTMLElement): {
  error: string
  suggestions: string[]
} | undefined {
  const ancestor = element.closest('[data-spelling-error]') as HTMLElement | null
  if (!ancestor) {
    return
  }

  try {
    return {
      error: decodeURIComponent(ancestor.getAttribute('data-spelling-error') || ''),
      suggestions: JSON.parse(decodeURIComponent(ancestor.getAttribute('data-spelling-suggestions') || '')),
    }
  } catch (_) { }
}
