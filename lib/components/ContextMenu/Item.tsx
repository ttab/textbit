import { type PropsWithChildren, useContext } from 'react'
import { ContextMenuHintsContext } from './ContextMenuHintsContext'

type ItemProps = PropsWithChildren & {
  className?: string
  func?: () => void
}

export const Item = ({
  children,
  className,
  func = undefined
}: ItemProps) => {
  const menuCtx = useContext(ContextMenuHintsContext)

  return (
    <a
      className={className}
      onMouseDown={(e) => {
        e.preventDefault()
        if (func) {
          func()
        }
        menuCtx?.dispatch({
          menu: undefined,
          spelling: undefined
        })
      }}
    >
      {children}
    </a>
  )
}
