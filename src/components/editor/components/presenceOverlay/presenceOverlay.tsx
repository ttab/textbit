import React, { PropsWithChildren } from "react"
import { RemoteCursorOverlay } from "./remoteCursorOverlay"

type PresenceOverylayProps = PropsWithChildren<{ isCollaborative: boolean }>

export function PresenceOverlay({ children, isCollaborative }: PresenceOverylayProps): React.ReactElement {
  if (!isCollaborative) {
    return <>
      {children}
    </>
  }

  return <RemoteCursorOverlay className="flex justify-center my-32 mx-10">
    {children}
  </RemoteCursorOverlay>
}
