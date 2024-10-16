import React, {
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect
} from 'react' // Necessary for esbuild

type Box = {
  top: number
  right: number
  bottom: number
  left: number
}

type GutterContextInterface = {
  box?: Box
  width: number
  setWidth: Dispatch<SetStateAction<number>>
  offsetY: number
  setOffsetY: Dispatch<SetStateAction<number>>
  triggerSize: number
  setTriggerSize: Dispatch<SetStateAction<number>>
  gutter: boolean // has gutter
}

export const GutterContext = createContext<GutterContextInterface>({
  width: 0,
  setWidth: () => { },
  offsetY: 0,
  setOffsetY: () => { },
  triggerSize: 0,
  setTriggerSize: () => { },
  gutter: false
})

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export const GutterProvider = ({ dir = 'ltr', gutter = true, children }: PropsWithChildren & {
  dir?: 'ltr' | 'rtl',
  gutter?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<Box | undefined>(undefined)
  const [offsetY, setOffsetY] = useState<number>(0)
  const [gutterWidth, setGutterWidth] = useState<number>(0)
  const [triggerSize, setTriggerSize] = useState<number>(0)

  const recalculateTop = useCallback(() => {
    const { top, right, bottom, left } = ref?.current?.getBoundingClientRect() || { top: 0, right: 0, bottom: 0, left: 0 }

    // Take window scroll Y into account
    setBox({
      top: top - window.scrollY,
      right,
      bottom,
      left
    })
  }, [ref?.current])

  useEffect(() => {
    const handleScroll = () => {
      recalculateTop()
    }

    addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true
    })

    recalculateTop()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <GutterContext.Provider value={{
      gutter,
      offsetY,
      setOffsetY,
      width: gutterWidth,
      setWidth: setGutterWidth,
      triggerSize,
      setTriggerSize,
      box
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
