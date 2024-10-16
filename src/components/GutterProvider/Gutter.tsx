import React, { PropsWithChildren, useContext, useLayoutEffect, useRef } from 'react'
import { GutterContext } from './GutterProvider'

export const Gutter = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const { gutter, setWidth } = useContext(GutterContext)

  useLayoutEffect(() => {
    const { right, left } = ref?.current?.getBoundingClientRect() || { right: 0, left: 0 }
    setWidth(right - left)
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
