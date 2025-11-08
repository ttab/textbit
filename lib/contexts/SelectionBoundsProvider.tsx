import {
  useEffect,
  useRef,
  type PropsWithChildren,
  useCallback
} from 'react'
import { SelectionBoundsCallback, SelectionBoundsContext, type SelectionBounds, } from './SelectionBoundsContext'

export function TextbitSelectionBoundsProvider({ children }: PropsWithChildren) {
  const boundsRef = useRef<SelectionBounds | undefined>(undefined)
  const subscribersRef = useRef(new Set<SelectionBoundsCallback>())

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
