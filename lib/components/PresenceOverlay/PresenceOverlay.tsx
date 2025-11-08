import React, { type PropsWithChildren } from 'react'
import { RemoteCursorOverlay } from './RemoteCursorOverlay'

type PresenceOverylayProps = PropsWithChildren<{ isCollaborative: boolean }>

export function PresenceOverlay({ children, isCollaborative }: PresenceOverylayProps): React.ReactElement {
  return (
    <>
      {!isCollaborative
        ? <>{children}</>
        : <RemoteCursorOverlay>{children}</RemoteCursorOverlay>
      }
    </>
  )
}
