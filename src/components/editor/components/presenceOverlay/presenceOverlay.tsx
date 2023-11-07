import { PropsWithChildren } from "react"
import { RemoteCursorOverlay } from "./remoteCursorOverlay"

type PresenceOverylayProps = PropsWithChildren<{ isCollaborative: boolean }>

export function PresenceOverlay({ children, isCollaborative }: PresenceOverylayProps): React.ReactElement {
  if (!isCollaborative) {
    return <div style={{ border: '1px solid red' }}>
      {children}
    </div>
  }

  return <RemoteCursorOverlay className="flex justify-center my-32 mx-10">
    <div style={{ border: '1px solid green' }}>
      {children}
    </div>
  </RemoteCursorOverlay>
}
