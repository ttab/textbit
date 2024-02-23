import React, {
  useLayoutEffect,
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext
} from 'react' // Necessary for esbuild

type GutterContextInterface = {
  offset: number,  // content menu y offset in gutter
  gutter: boolean, // has gutter
  setOffset: Dispatch<SetStateAction<number>>
}

export const GutterContext = createContext<GutterContextInterface>({ offset: 0, gutter: false, setOffset: () => { } })

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export const Wrapper = ({ dir = 'ltr', gutter = true, children }: PropsWithChildren & {
  dir?: 'ltr' | 'rtl',
  gutter?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [top, setTop] = useState(0)

  useLayoutEffect(() => {
    if (ref?.current) {
      const { top } = ref.current.getBoundingClientRect()
      setTop(top + window.scrollY)
    }
  })

  return (
    <GutterContext.Provider value={{ offset: offset - top, gutter: gutter, setOffset }}>
      <div
        contentEditable={false}
        style={{
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
  return <div style={{ flexGrow: 1 }}>{children}</div>
}

export const TextbitUI = {
  Wrapper,
  Gutter,
  Content
}
