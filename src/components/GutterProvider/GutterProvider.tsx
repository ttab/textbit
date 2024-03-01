import React, {
  useRef,
  PropsWithChildren,
  createContext,
  useState,
  Dispatch,
  SetStateAction,
} from 'react' // Necessary for esbuild

type Offset = {
  top: number
  right: number
  bottom: number
  left: number
}

type GutterContextInterface = {
  offset?: Offset // content menu y offset in gutter
  gutter: boolean // has gutter
  dragOver: boolean // Dragging over active
  setOffset: Dispatch<SetStateAction<Offset | undefined>>
  setDragOver: Dispatch<SetStateAction<boolean>>
}

export const GutterContext = createContext<GutterContextInterface>({
  gutter: false,
  dragOver: false,
  setOffset: () => { },
  setDragOver: () => { }
})

/**
 * Set prop dir to "rtl" to put gutter on right hand side
 */
export const GutterProvider = ({ dir = 'ltr', gutter = true, children }: PropsWithChildren & {
  dir?: 'ltr' | 'rtl',
  gutter?: boolean
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState<Offset | undefined>(undefined)
  const { scrollX, scrollY } = window
  const { top, left } = ref?.current?.getBoundingClientRect() || { top: 0, right: 0, bottom: 0, left: 0 }
  const [dragOver, setDragOver] = useState<boolean>(false)

  return (
    <GutterContext.Provider value={{
      gutter,
      dragOver,
      setOffset,
      setDragOver,
      offset: offset ? {
        top: offset.top - top - scrollY,
        right: offset.right - left - scrollX,
        bottom: offset.bottom - top - scrollY,
        left: offset.left - left - scrollX
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
