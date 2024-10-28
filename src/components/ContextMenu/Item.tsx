import React, { PropsWithChildren } from 'react'

type ItemProps = PropsWithChildren & {
  className?: string
  func?: () => void
}

export const Item = ({
  children,
  className,
  func = undefined
}: ItemProps) => {
  if (!func) {
    return <></>
  }

  return (
    <a
      className={className}
      onMouseDown={(e) => {
        e.preventDefault()
        func()
      }}
    >
      {children}
    </a>
  )
}
