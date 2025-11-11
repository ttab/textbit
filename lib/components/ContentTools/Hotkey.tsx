import { Children, useContext } from 'react'
import { modifier } from '../../utils/modifier'
import { ItemContext } from './ItemContext'

export function Hotkey({ className, children }: {
  className?: string
  children?: React.ReactNode
}) {
  const { action } = useContext(ItemContext)

  return (
    <div className={className}>
      {Children.count(children)
        ? children
        : modifier(action?.hotkey || '')
      }
    </div>
  )
}
