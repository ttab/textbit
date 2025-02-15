import { type PropsWithChildren, useContext } from 'react'
import { ContextMenuHintsContext } from './ContextMenuHintsContext'
import { useSlateStatic } from 'slate-react'
import { Editor } from 'slate'

type ItemProps = PropsWithChildren & {
  className?: string
  func?: (editor: Editor) => void
}

export const Item = ({
  children,
  className,
  func = undefined
}: ItemProps) => {
  const editor = useSlateStatic()
  const menuCtx = useContext(ContextMenuHintsContext)

  return (
    <a
      className={className}
      onMouseDown={(e) => {
        e.preventDefault()
        if (func) {
          func(editor)
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
