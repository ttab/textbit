import React, { PropsWithChildren } from 'react'

export const Popover = ({ children }: PropsWithChildren) => {
  return (
    <div className="textbit-contenttools-popover">
      {children}
    </div >
  )
}
