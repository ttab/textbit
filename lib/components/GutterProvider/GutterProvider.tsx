import { useRef } from 'react'
import { GutterContext } from './GutterContext'

export function GutterProvider({ children }: {
  children: React.ReactNode
}) {
  const triggerRef = useRef<HTMLElement>(undefined)

  return (
    <GutterContext.Provider
      value={{
        triggerRef
      }}
    >
      {children}
    </GutterContext.Provider>
  )
}
