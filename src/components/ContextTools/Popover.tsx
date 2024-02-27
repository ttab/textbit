import React, { PropsWithChildren } from 'react'

export const Popover = ({ children }: PropsWithChildren) => {
  return (
    <div className="textbit-contexttools-popover">
      {children}
    </div >
  )
}
