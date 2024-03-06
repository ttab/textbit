import React, { PropsWithChildren, useContext } from 'react'
import { ItemContext } from './Item'

export const Label = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { action } = useContext(ItemContext)

  return <div className={className}>
    {!!children
      ? children
      : action?.title || ''
    }
  </div>
}
