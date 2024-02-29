import React, {
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext
} from 'react' // Necessary for esbuild

type Offset = {
  left: number
  top: number
}

type GutterContextInterface = {
  offset?: Offset,  // content menu y offset in gutter
  gutter: boolean // has gutter
  setOffset: Dispatch<SetStateAction<Offset | undefined>>
}

export const GutterContext = createContext<GutterContextInterface>({ gutter: false, setOffset: () => { } })

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export const Wrapper = ({ dir = 'ltr', gutter = true, children }: PropsWithChildren & {
  dir?: 'ltr' | 'rtl',
  gutter?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<Offset | undefined>(undefined)
  const { scrollX, scrollY } = window
  const { top, left } = ref?.current?.getBoundingClientRect() || { top: 0, left: 0 }

  return (
    <GutterContext.Provider value={{
      gutter,
      setOffset,
      offset: offset ? {
        left: offset.left - left - scrollX,
        top: offset.top - top - scrollY
      } : undefined
    }}>
      <div
        contentEditable={false}
        style={{
          position: 'absolute',
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

const Gutter = ({ children }: PropsWithChildren) => {
  const { gutter } = useContext(GutterContext)

  return <div
    style={{
      display: gutter ? 'block' : 'none',
      position: 'relative',
      width: '3rem',
      flexShrink: 0
    }}
  >
    {children}
  </div>
}

const Content = ({ children }: PropsWithChildren) => {
  return <div style={{ flexGrow: 1, position: 'relative' }}>{children}</div>
}

export const GutterProvider = {
  Wrapper,
  Gutter,
  Content
}
