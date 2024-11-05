import {
  type PropsWithChildren, useContext, useEffect, useLayoutEffect, useRef
} from 'react'
import { GutterContext } from './GutterProvider'

export const Gutter = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const { setGutterBox } = useContext(GutterContext)

  useLayoutEffect(() => {
    if (ref?.current) {
      setGutterBox(ref?.current.getBoundingClientRect())
    }
  }, [ref?.current])

  useEffect(() => {
    const handleScroll = () => {
      if (ref?.current) {
        setGutterBox(ref.current.getBoundingClientRect())
      }
    }

    addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [ref?.current])

  return <div
    ref={ref}
    className={className}
    style={{
      position: 'relative',
      flexShrink: 0
    }}
  >
    {children}
  </div>
}
