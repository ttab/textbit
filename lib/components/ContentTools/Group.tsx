import { Children } from 'react'

export function Group({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
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
