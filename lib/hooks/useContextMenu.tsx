import { getDecorationRangeFromMouseEvent, getNodeEntryFromDomNode } from '../lib/utils'
import { type RefObject, useContext, useEffect, useState } from 'react'
import { Range, Editor, Element as SlateElement } from 'slate'
import { ReactEditor, useFocused, useSlateStatic } from 'slate-react'
import { TextbitEditor } from '../lib/textbit-editor'
import { type SpellingError } from '../types/extends'
import { ContextMenuHintsContext } from '../components/ContextMenu/ContextMenuHintsContext'

export function useContextMenu(
  ref: RefObject<HTMLElement>,
  preventDefault = true
) {
  const editor = useSlateStatic()
  const isFocused = useFocused()
  const [range, setRange] = useState<Range | undefined>()
  const contextMenuHintsContext = useContext(ContextMenuHintsContext)

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

      const [targetNode, targetPath] = getNodeEntryFromDomNode(editor, targetElement) || []
      if (!targetNode || !Array.isArray(targetPath)) {
        return
      }

      const topNode = editor.children[targetPath[0]]
      if (!SlateElement.isElement(topNode)) {
        return
      }

      const slateRange = ReactEditor.findEventRange(editor, event)
      if (Range.isCollapsed(slateRange)) {
        setRange(slateRange)
      }

      const spelling = getSpellingHints(editor, topNode, targetElement, event)
      if (preventDefault) {
        event.preventDefault()
      }

      contextMenuHintsContext?.dispatch({
        menu: {
          position: {
            x: event.clientX,
            y: event.clientY
          },
          target: targetElement,
          originalEvent: event,
          nodeEntry: [targetNode, targetPath]
        },
        spelling
      })
    }

    window.addEventListener('contextmenu', contextMenuHandler)

    return () => window.removeEventListener('contextmenu', contextMenuHandler)
  }, [ref, contextMenuHintsContext, preventDefault, setRange])
}

function getSpellingHints(
  editor: Editor,
  topNode: SlateElement,
  element: HTMLElement,
  event: MouseEvent
): SpellingError & {
  range: Range | undefined
  apply: (replacement: string) => void
} | undefined {
  const ancestor = element.closest('[data-spelling-error]') as HTMLElement | null
  const errorId = ancestor?.dataset['spellingError']
  if (!topNode.id || !errorId) {
    return
  }

  const spelling = editor.spellingLookupTable.get(topNode.id)?.errors || []
  const spellingError = spelling.find(error => error.id === errorId)

  try {
    return (spellingError)
      ? {
        ...spellingError,
        range: getDecorationRangeFromMouseEvent(editor, event),
        apply: (replacement: string) => {
          TextbitEditor.replaceStringAtPosition(
            editor,
            spellingError.text,
            replacement
          )
        }
      }
      : undefined
  } catch (_) {
    // Ignored
  }
}
