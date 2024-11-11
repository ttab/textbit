import { type PropsWithChildren, Children } from 'react'

export const Group = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const hasChildren = Children.count(children) > 0

  return (
    <>
      {hasChildren
        ? <div className={className}>{children}</div>
        : <></>
      }
    </>
  )
}
