import { type PropsWithChildren, Children } from 'react'

export const Group = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  return (
    <>
      {Children.count(children) > 0 && (
        <div className={className}>{children}</div>
      )}
    </>
  )
}
