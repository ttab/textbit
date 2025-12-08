import { getDecorationRangeFromMouseEvent, getNodeEntryFromDomNode } from '../utils/utils'
import { MouseEventHandler, useContext, useMemo } from 'react'
import { Range, Editor, Element as SlateElement, Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { TextbitEditor } from '../utils/textbit-editor'
import { type SpellingError } from '../types/slate'
import { ContextMenuHintsContext } from '../components/ContextMenu/ContextMenuHintsContext'

export function useContextMenu(
  preventDefault = true
) {
  const editor = useSlateStatic()
  const contextMenuHintsContext = useContext(ContextMenuHintsContext)

  return useMemo(() => {

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

      const spelling = getSpellingHints(editor, topNode, targetElement, event)

      // Update the selection and ensure the editor is focused
      const range = getDecorationRangeFromMouseEvent(editor, event)
      if (range) {
        Transforms.select(editor, range)
        ReactEditor.focus(editor)
      }

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

    return contextMenuHandler as unknown as MouseEventHandler<HTMLDivElement>
  }, [contextMenuHintsContext, preventDefault, editor])
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
