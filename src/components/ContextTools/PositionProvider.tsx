import React, {
  useLayoutEffect,
  useRef,
  PropsWithChildren,
  createContext,
  useState
} from 'react' // Necessary for esbuild
import { useSlateSelection } from 'slate-react'

type Offset = {
  x: number
  y: number
  w: number
  h: number
}

type PositionContextInterface = {
  offset?: Offset
  inline: boolean
}

export const PositionContext = createContext<PositionContextInterface>({ inline: false })

export const PositionProvider = ({ inline = true, children }: PropsWithChildren & {
  inline: boolean
}) => {
  const [offset, setOffset] = useState<Offset | undefined>(undefined)
  const selection = useSlateSelection()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const { top, left } = ref?.current?.getBoundingClientRect() || { top: 0, left: 0 }
    const domSelection = window.getSelection()

    if (domSelection && domSelection.type !== 'None') {
      const domRange = domSelection?.getRangeAt(0)
      const rect = domRange.getBoundingClientRect()

      setOffset(!rect ? undefined : {
        x: rect.left - left + (rect.width / 2),
        y: rect.top - top - (rect.height || 0),
        w: rect.width,
        h: rect.height
      })
    }
    else {
      setOffset(undefined)
    }
  }, [selection])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <PositionContext.Provider value={{
        inline,
        offset
      }}>
        {children}
      </PositionContext.Provider>
    </div>
  )
}
