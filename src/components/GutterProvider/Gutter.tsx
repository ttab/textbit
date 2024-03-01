import React, { PropsWithChildren, useContext } from 'react'
import { GutterContext } from './GutterProvider'

export const Gutter = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { gutter } = useContext(GutterContext)

  return <div
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
