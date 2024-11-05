import { Children, type PropsWithChildren, useContext } from 'react'
import { ItemContext } from './Item'

export const Label = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const { action } = useContext(ItemContext)

  return <div className={className}>
    {Children.count(children)
      ? children
      : action?.title || ''
    }
  </div>
}
