import {
  useEffect,
  useRef,
  type PropsWithChildren,
  useCallback
} from 'react'
import { SelectionBoundsCallback, SelectionBoundsContext, type SelectionBounds, } from './SelectionBoundsContext'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { Editor, Element } from 'slate'

export function SelectionBoundsProvider({ children }: PropsWithChildren) {
  const boundsRef = useRef<SelectionBounds | undefined>(undefined)
  const subscribersRef = useRef(new Set<SelectionBoundsCallback>())
  const editor = useSlateStatic()

  const subscribe = useCallback((callback: SelectionBoundsCallback) => {
    subscribersRef.current.add(callback)
    callback(boundsRef.current)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const notifySubscribers = useCallback(() => {
    subscribersRef.current.forEach((callback) => {
      callback(boundsRef.current)
    })
  }, [])

  const calculateBounds = useCallback(() => {
    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      boundsRef.current = undefined
      notifySubscribers()
      return
    }

    const range = domSelection.getRangeAt(0)
    const { top, right, bottom, left, width, height, x, y } = range.getBoundingClientRect()

    // Get box dimensions from Slate element
    let box: DOMRect | undefined = undefined

    if (editor && ReactEditor.isFocused(editor) && editor.selection) {
      try {
        // Get the block element at the current selection
        const [match] = Editor.nodes(editor, {
          at: editor.selection,
          match: n => Element.isElement(n) && Editor.isBlock(editor, n)
        })

        if (match) {
          const [node] = match
          const domNode = ReactEditor.toDOMNode(editor, node)
          box = domNode.getBoundingClientRect()
        }
      } catch (error) {
        // If Slate operations fail, fall back to undefined
        console.warn('Failed to get Slate element bounds:', error)
      }
    }

    const newBounds = {
      top,
      right,
      bottom,
      left,
      width,
      height,
      x,
      y,
      isCollapsed: range.collapsed,
      box
    }

    if (JSON.stringify(boundsRef.current) !== JSON.stringify(newBounds)) {
      boundsRef.current = newBounds
      notifySubscribers()
    }
  }, [notifySubscribers, editor]) // Add editor to dependencies

  useEffect(() => {
    calculateBounds()

    const handleSelectionChange = () => {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        calculateBounds()
      })
    }

    const handleScroll = () => {
      calculateBounds()
    }

    document.addEventListener('selectionchange', handleSelectionChange, { capture: true, passive: true })
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange, { capture: true })
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [calculateBounds])

  const contextValue = {
    boundsRef,
    subscribe
  }

  return (
    <SelectionBoundsContext.Provider value={contextValue}>
      {children}
    </SelectionBoundsContext.Provider>
  )
}
