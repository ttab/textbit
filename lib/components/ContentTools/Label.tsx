import { Children, useContext } from 'react'
import { ItemContext } from './Item'

export function Label({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  const { action } = useContext(ItemContext)

  return (
    <div className={className}>
      {Children.count(children)
        ? children
        : action?.title || ''
      }
    </div>
  )
}
