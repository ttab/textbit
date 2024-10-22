import React, { // Necessary for esbuild
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction
} from 'react'

type GutterContextInterface = {
  triggerSize: number
  setTriggerSize: Dispatch<SetStateAction<number>>
  gutterBox?: DOMRect,
  setGutterBox: React.Dispatch<React.SetStateAction<DOMRect | undefined>>
}


export const GutterContext = createContext<GutterContextInterface>({
  triggerSize: 0,
  setTriggerSize: () => { },
  gutterBox: undefined,
  setGutterBox: () => { }
})

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export const GutterProvider = ({ dir = 'ltr', gutter = true, children }: PropsWithChildren & {
  dir?: 'ltr' | 'rtl',
  gutter?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [triggerSize, setTriggerSize] = useState<number>(0)
  const [gutterBox, setGutterBox] = useState<DOMRect | undefined>(undefined)

  return (
    <GutterContext.Provider value={{
      triggerSize,
      setTriggerSize,
      gutterBox,
      setGutterBox
    }}>
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
      </div >
    </GutterContext.Provider>
  )
}
