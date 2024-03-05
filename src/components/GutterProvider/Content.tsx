import React, { PropsWithChildren } from 'react'

export const Content = ({ children }: PropsWithChildren) => {
  return <div style={{ flexGrow: 1, position: 'relative' }}>
    {children}
  </div>
}
