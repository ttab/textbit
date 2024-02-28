import React, {
  PropsWithChildren,
  Children
} from 'react'

export const Group = ({ children }: PropsWithChildren) => {
  const hasChildren = Children.count(children) > 0

  return <>
    {hasChildren
      ? <div className="textbit-contenttools-group">{children}</div>
      : <></>
    }
  </>
}
