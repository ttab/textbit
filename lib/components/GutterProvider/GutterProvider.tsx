import { useState } from 'react'
import { GutterContext } from './GutterContext'

export function GutterProvider({ children }: {
  children: React.ReactNode
}) {
  const [triggerBox, setTriggerBox] = useState<DOMRect | undefined>(undefined)

  return (
    <GutterContext.Provider
      value={{
        triggerBox,
        setTriggerBox
      }}
    >
      {children}
    </GutterContext.Provider>
  )
}
