import React, {
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useLayoutEffect,
} from 'react' // Necessary for esbuild

type Box = {
  top: number
  right: number
  bottom: number
  left: number
}

type GutterContextInterface = {
  box?: Box
  offsetY: number
  offsetX: number
  gutter: boolean // has gutter
  setOffsetY: Dispatch<SetStateAction<number>>
  setOffsetX: Dispatch<SetStateAction<number>>
}

export const GutterContext = createContext<GutterContextInterface>({
  offsetX: 0,
  offsetY: 0,
  gutter: false,
  setOffsetY: () => { },
  setOffsetX: () => { }
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
  const [offsetX, setOffsetX] = useState<number>(0)

  useLayoutEffect(() => {
    const calculateBox = () => {
      const { top, right, bottom, left } = ref?.current?.getBoundingClientRect() || { top: 0, right: 0, bottom: 0, left: 0 }
      setBox({ top, right, bottom, left })
    }

    calculateBox()

    window.addEventListener('resize', calculateBox)
    return () => {
      window.removeEventListener('resize', calculateBox)
    }
  }, [ref])

  return (
    <GutterContext.Provider value={{
      gutter,
      offsetY,
      setOffsetY,
      offsetX,
      setOffsetX,
      box
    }}>
      <div
        contentEditable={false}
        style={{
          position: 'relative',
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
