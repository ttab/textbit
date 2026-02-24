import React, { type PropsWithChildren } from 'react'
import { RemoteCursorOverlay } from './RemoteCursorOverlay'
import { useTextbit } from '../../hooks/useTextbit'

type PresenceOverylayProps = PropsWithChildren<{ isCollaborative: boolean }>

export function PresenceOverlay({ children, isCollaborative }: PresenceOverylayProps): React.ReactElement {
  const { readOnly } = useTextbit()

  return (
    <>
      {!isCollaborative || readOnly
        ? <>{children}</>
        : <RemoteCursorOverlay>{children}</RemoteCursorOverlay>
      }
    </>
  )
}
