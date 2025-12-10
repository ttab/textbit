import { Children } from 'react'

export function Group({ children, className }: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <>
      {Children.count(children) > 0 && (
        <div className={className}>{children}</div>
      )}
    </>
  )
}
