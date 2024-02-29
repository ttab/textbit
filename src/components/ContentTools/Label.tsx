import React, { PropsWithChildren } from 'react'

export const Label = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  return <div className={className}>{children}</div>
}
