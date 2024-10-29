import { getDecorationRangeFromMouseEvent, getNodeEntryFromDomNode } from '@/lib/utils'
import { RefObject, useEffect, useState } from 'react'
import { Range, NodeEntry } from 'slate'
import { ReactEditor, useFocused, useSlateStatic } from 'slate-react'

interface ContextMenuEvent {
  x: number
  y: number
  target: HTMLElement
  originalEvent: MouseEvent
  nodeEntry: NodeEntry
  spelling?: {
    text: string
    suggestions: string[]
    range: Range | undefined
  }
}

type ContextMenuHandler = (event: ContextMenuEvent | undefined) => void

export function useContextMenu(
  ref: RefObject<HTMLElement>,
  onContextMenu: ContextMenuHandler,
  preventDefault = true
) {
  const editor = useSlateStatic()
  const isFocused = useFocused()
  const [range, setRange] = useState<Range | undefined>()

  useEffect(() => {
    if (editor && range) {
      if (!isFocused) {
        ReactEditor.focus(editor)
      }
      editor.setSelection(range)
    }
  }, [editor, range])

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
        setRange(undefined)
        return
      }

      const nodeEntry = getNodeEntryFromDomNode(editor, targetElement)
      if (!nodeEntry) {
        return
      }

      const slateRange = ReactEditor.findEventRange(editor, event)
      if (Range.isCollapsed(slateRange)) {
        setRange(slateRange)
      }

      const spelling = getSpellingData(editor, targetElement, event)
      if (preventDefault) {
        event.preventDefault()
      }

      onContextMenu({
        x: event.clientX,
        y: event.clientY,
        target: targetElement,
        originalEvent: event,
        nodeEntry,
        spelling
      })
    }

    window.addEventListener('contextmenu', contextMenuHandler)

    return () => window.removeEventListener('contextmenu', contextMenuHandler)
  }, [ref, onContextMenu, preventDefault, setRange])
}

function getSpellingData(editor: ReactEditor, element: HTMLElement, event: MouseEvent): {
  text: string
  suggestions: string[],
  range: Range | undefined
} | undefined {
  const ancestor = element.closest('[data-spelling-error]') as HTMLElement | null
  if (!ancestor) {
    return
  }

  try {
    return {
      text: decodeURIComponent(ancestor.getAttribute('data-spelling-error') || ''),
      suggestions: JSON.parse(decodeURIComponent(ancestor.getAttribute('data-spelling-suggestions') || '')),
      range: getDecorationRangeFromMouseEvent(editor, event)
    }
  } catch (_) { }
}
