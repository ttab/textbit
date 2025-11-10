import { useContext, useEffect, useLayoutEffect, useRef } from 'react'
import { GutterContext } from './GutterContext'

export function Content({ children }: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { setGutterBox } = useContext(GutterContext)

  useLayoutEffect(() => {
    if (ref?.current) {
      setGutterBox(ref.current.getBoundingClientRect())
    }
  }, [setGutterBox])

  useEffect(() => {
    const handleScroll = () => {
      if (ref?.current) {
        setGutterBox(ref.current.getBoundingClientRect())
      }
    }

    window.addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true
    })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [setGutterBox])

  return (
    <div ref={ref} style={{ flexGrow: 1, position: 'relative' }}>
      {children}
    </div>
  )
}
