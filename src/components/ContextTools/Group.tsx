import React, {
  PropsWithChildren,
  Children,
  useCallback,
  ReactNode
} from 'react'
import { useSlateStatic } from 'slate-react'
import { Editor } from 'slate'

export const Group = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const editor = useSlateStatic()
  const leafEntry = Editor.nodes(editor, {
    mode: 'lowest'
  }).next().value || undefined

  const filter = useCallback((children: ReactNode) => {
    if (!leafEntry) {
      return children
    }

    return Children.toArray(children).filter(child => {
      // @ts-ignore
      const isInline = child?.props?.action?.plugin?.class === 'inline'
      // FiXME: This is wrong
      return true // isInline // === isCollapsed
    })

  }, [leafEntry, editor])

  const filteredChildren = filter(children)
  const hasChildren = Children.count(filteredChildren) > 0

  return <>
    {hasChildren
      ? <div className={className || ''}>{children}</div>
      : <></>
    }
  </>
}
