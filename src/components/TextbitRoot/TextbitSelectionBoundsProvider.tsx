import React, {
  createContext,
  useEffect,
  useRef,
  useContext,
  PropsWithChildren,
  useCallback,
  useState
} from 'react'
import { Editor, Node, NodeEntry } from 'slate'

type TextbitSelectionBounds = Omit<DOMRect & {
  isCollapsed: boolean
  leafEntry?: NodeEntry<Node>
  blockEntry?: NodeEntry<Node>
}, 'toJSON'>

type TextbitSelectionBoundsCallback = (param: TextbitSelectionBounds | undefined) => void

/**
 * Context
 */
const initialState = undefined
const TextbitSelectionBoundsContext = createContext<{
  boundsRef: React.MutableRefObject<TextbitSelectionBounds | undefined>
  subscribe: (callback: TextbitSelectionBoundsCallback) => () => void
} | undefined>(initialState)


/**
 * Non reactive hook
 */
export const useTextbitSelectionBounds = () => {
  const context = useContext(TextbitSelectionBoundsContext)

  if (!context) {
    throw new Error('useSelectionBounds must be used within a SelectionBoundsProvider')
  }

  return context.boundsRef
}


/**
 * Reactive hook
 */
export const useTextbitSelectionBoundsState = () => {
  const context = useContext(TextbitSelectionBoundsContext)

  if (!context) {
    throw new Error('useTextbitSelectionBoundsState must be used within a TextbitSelectionBoundsProvider')
  }

  const [bounds, setBounds] = useState(context.boundsRef.current)

  useEffect(() => {
    return context.subscribe(setBounds)
  }, [context])

  return bounds
}


/**
 * Provider
 */
export const TextbitSelectionBoundsProvider = ({ children }: PropsWithChildren) => {
  const boundsRef = useRef<TextbitSelectionBounds | undefined>(undefined)
  const subscribersRef = useRef(new Set<TextbitSelectionBoundsCallback>())

  const subscribe = useCallback((callback: TextbitSelectionBoundsCallback) => {
    subscribersRef.current.add(callback)
    callback(boundsRef.current)

    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const notifySubscribers = useCallback(() => {
    subscribersRef.current.forEach(callback => {
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

    const newBounds = {
      top: top + window.scrollY,
      right,
      bottom,
      left: left + window.scrollX,
      width,
      height,
      x,
      y,
      isCollapsed: range.collapsed
    }

    if (JSON.stringify(boundsRef.current) !== JSON.stringify(newBounds)) {
      boundsRef.current = newBounds
      notifySubscribers()
    }
  }, [notifySubscribers])

  useEffect(() => {
    calculateBounds()

    const handleSelectionChange = () => {
      calculateBounds()
    }

    const handleScroll = () => {
      calculateBounds()
    }

    document.addEventListener('selectionchange', handleSelectionChange, { capture: true })
    window.addEventListener('scroll', handleScroll, { capture: true })

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange, { capture: true })
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [])

  const contextValue = {
    boundsRef,
    subscribe
  }

  return (
    <TextbitSelectionBoundsContext.Provider value={contextValue}>
      {children}
    </TextbitSelectionBoundsContext.Provider>
  )
}

export default TextbitSelectionBoundsProvider
