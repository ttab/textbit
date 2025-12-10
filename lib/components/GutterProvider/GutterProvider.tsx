import { useCallback, useRef } from 'react'
import { GutterContext } from './GutterContext'

export function GutterProvider({ children }: {
  children: React.ReactNode
}) {
  const triggerRef = useRef<HTMLElement>(undefined)

  const updateTriggerRef = useCallback((e: HTMLElement) => {
    triggerRef.current = e
  }, [])

  return (
    <GutterContext.Provider
      value={{
        triggerRef,
        updateTriggerRef
      }}
    >
      {children}
    </GutterContext.Provider>
  )
}
