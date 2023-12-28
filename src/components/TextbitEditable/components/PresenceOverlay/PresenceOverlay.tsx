import React, { PropsWithChildren } from "react"
import { RemoteCursorOverlay } from "./RemoteCursorOverlay"
import './style.css'

type PresenceOverylayProps = PropsWithChildren<{ isCollaborative: boolean }>

export function PresenceOverlay({ children, isCollaborative }: PresenceOverylayProps): React.ReactElement {
  if (!isCollaborative) {
    return <>
      {children}
    </>
  }

  return <RemoteCursorOverlay>
    {children}
  </RemoteCursorOverlay>
}
