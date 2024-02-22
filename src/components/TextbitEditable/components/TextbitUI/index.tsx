import React, {
  useLayoutEffect,
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction
} from 'react' // Necessary for esbuild

type GutterContextInterface = [
  number,
  Dispatch<SetStateAction<number>>
]

export const GutterContext = createContext<GutterContextInterface>([0, () => { }])

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export const Wrapper = ({ dir, children }: PropsWithChildren & { dir?: 'ltr' | 'rtl' }) => {
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
    <GutterContext.Provider value={[offset - top, setOffset]}>
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
  return <div
    style={{
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
