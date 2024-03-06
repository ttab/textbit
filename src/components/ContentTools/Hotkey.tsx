import React, { PropsWithChildren, useContext } from 'react' // Necessary for esbuild
import { modifier } from '@/lib/modifier'
import { ItemContext } from './Item'

export const Hotkey = ({ className, children }: PropsWithChildren & {
  className?: string
}) => {
  const { action } = useContext(ItemContext)

  return <div className={className}>
    {!!children
      ? children
      : modifier(action?.hotkey || '')
    }
  </div>
}
