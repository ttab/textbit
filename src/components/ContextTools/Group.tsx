import React, {
  PropsWithChildren,
  Children,
  useCallback,
  ReactNode
} from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { Editor, Range } from 'slate'

export const Group = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const editor = useSlateStatic()
  const selection = useSlateSelection()
  const leafEntry = Editor.nodes(editor, {
    mode: 'lowest'
  }).next().value || undefined

  const filter = useCallback((children: ReactNode) => {
    if (!leafEntry || !selection) {
      return children
    }


    return Children.toArray(children).filter(child => {
      if (!Range.isCollapsed(selection)) {
        return true
      }

      // @ts-ignore
      return child?.props?.action?.plugin?.class === 'inline'
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
