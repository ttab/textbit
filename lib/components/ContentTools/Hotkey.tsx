import { Children, type PropsWithChildren, useContext } from 'react'
import { modifier } from '../../lib/modifier'
import { ItemContext } from './Item'

export const Hotkey = ({ className, children }: PropsWithChildren & {
  className?: string
}) => {
  const { action } = useContext(ItemContext)

  return <div className={className}>
    {Children.count(children)
      ? children
      : modifier(action?.hotkey || '')
    }
  </div>
}
