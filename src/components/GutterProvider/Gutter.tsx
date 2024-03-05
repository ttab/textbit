import React, { PropsWithChildren, useContext, useLayoutEffect, useRef } from 'react'
import { GutterContext } from './GutterProvider'

export const Gutter = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const { gutter, setOffsetX } = useContext(GutterContext)

  useLayoutEffect(() => {
    const reportWidth = () => {
      const { right, left } = ref?.current?.getBoundingClientRect() || { right: 0, left: 0 }
      setOffsetX(right - left)
    }

    reportWidth()
    window.addEventListener('resize', reportWidth)
    return () => {
      window.removeEventListener('resize', reportWidth)
    }
  }, [ref])

  return <div
    ref={ref}
    className={className}
    style={{
      display: gutter ? 'block' : 'none',
      position: 'relative',
      flexShrink: 0
    }}
  >
    {children}
  </div>
}
