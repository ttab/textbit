import { getDecorationRangeFromMouseEvent, getNodeEntryFromDomNode } from '../utils/utils'
import { type RefObject, useContext, useEffect, useState } from 'react'
import { Range, Editor, Element as SlateElement } from 'slate'
import { ReactEditor, useFocused, useSlateStatic } from 'slate-react'
import { TextbitEditor } from '../utils/textbit-editor'
import { type SpellingError } from '../types/slate'
import { ContextMenuHintsContext } from '../components/ContextMenu/ContextMenuHintsContext'

export function useContextMenu(
  ref: RefObject<HTMLDivElement>,
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
  }, [editor, range, isFocused]) // Keep isFocused here - this is fine

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const contextMenuHandler = (event: MouseEvent) => {
      const targetElement = (event.target as Node).nodeType === Node.TEXT_NODE
        ? (event.target as Text).parentElement
        : (event.target as HTMLElement)

      if (!targetElement) {
        return
      }

      const nodeEntry = getNodeEntryFromDomNode(editor, targetElement)
      const [targetNode, targetPath] = nodeEntry || []

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

    element.addEventListener('contextmenu', contextMenuHandler)

    return () => {
      element.removeEventListener('contextmenu', contextMenuHandler)
    }
  }, [ref, contextMenuHintsContext, preventDefault, editor]) // Remove isFocused from here!
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
  const ancestor = element.closest('[data-spelling-error]') as HTMLElement
  const errorId = ancestor?.dataset['spellingError']

  if (!topNode.id || !errorId) {
    return
  }

  const spelling = editor.spellingLookupTable.get(topNode.id)?.errors || []
  const spellingError = spelling.find((error) => error.id === errorId)

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
  } catch (error) {
    console.warn(error)
  }
}
