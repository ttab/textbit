import React, {
  type PropsWithChildren,
  Children,
  useCallback,
  type ReactNode
} from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { Editor, Range } from 'slate'
import { PluginRegistryAction } from '../PluginRegistry'

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

      if (!React.isValidElement(child)) {
        return false
      }

      return (child.props as Record<string, PluginRegistryAction>)?.action?.plugin?.class === 'inline'
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
