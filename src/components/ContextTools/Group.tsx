import React, {
  PropsWithChildren,
  Children,
  useContext,
  useCallback,
  ReactNode
} from 'react'
import { PositionContext } from './PositionProvider'
import { useSlateSelection } from 'slate-react'

export const Group = ({ children }: PropsWithChildren) => {
  const { nodeEntry, expanded } = useContext(PositionContext)
  const selection = useSlateSelection()

  const filter = useCallback((children: ReactNode) => {
    if (!nodeEntry) {
      return children
    }

    return Children.toArray(children).filter(child => {
      // @ts-ignore
      const isInline = child?.props?.action?.plugin?.class === 'inline'
      return isInline !== expanded
    })

  }, [nodeEntry, expanded, selection])

  const filteredChildren = filter(children)
  const hasChildren = Children.count(filteredChildren) > 0

  return <>
    {hasChildren
      ? <div className="textbit-contexttools-group">{children}</div>
      : <></>
    }
  </>
}
