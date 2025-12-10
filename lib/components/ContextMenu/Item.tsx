import { Children, useContext } from 'react'
import { ContextMenuHintsContext } from './ContextMenuHintsContext'
import { useSlateStatic } from 'slate-react'
import { Editor } from 'slate'

export function Item({
  children,
  className,
  func = undefined
}: {
  children: React.ReactNode
  className?: string
  func?: (editor: Editor) => void
}) {
  const editor = useSlateStatic()
  const menuCtx = useContext(ContextMenuHintsContext)

  if (!Children.count(children)) {
    return <></>
  }

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
