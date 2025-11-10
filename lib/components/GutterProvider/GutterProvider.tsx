import {
  useRef,
  useState,
} from 'react'
import { GutterContext } from './GutterContext'

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export function GutterProvider({ dir = 'ltr', children }: {
  dir?: 'ltr' | 'rtl'
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [triggerSize, setTriggerSize] = useState<number>(0)
  const [gutterBox, setGutterBox] = useState<DOMRect | undefined>(undefined)

  return (
    <GutterContext.Provider
      value={{
        triggerSize,
        setTriggerSize,
        gutterBox,
        setGutterBox
      }}
    >
      <div
        contentEditable={false}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: dir === 'rtl' ? 'row' : 'row-reverse'
        }}
        ref={ref}
      >
        {children}
      </div>
    </GutterContext.Provider>
  )
}
