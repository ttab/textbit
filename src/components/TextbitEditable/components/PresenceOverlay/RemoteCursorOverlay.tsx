import React, { useRef } from 'react'
import type { CSSProperties, PropsWithChildren } from 'react'

import { useRemoteCursorOverlayPositions } from '@slate-yjs/react'
import type { CursorOverlayData } from '@slate-yjs/react'


interface CursorData {
  [key: string]: string
  color: string
  initials: string
  name: string
  avatar: string
}

type CaretProps = Pick<CursorOverlayData<CursorData>, 'caretPosition' | 'data'>


export function RemoteCursorOverlay({ children }: PropsWithChildren): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cursors] = useRemoteCursorOverlayPositions<CursorData>({
    containerRef
  })

  return (
    <div style={{ height: '100%' }} className="textbit-y-overlay" ref={containerRef}>
      {children}
      {cursors.map((cursor) => (
        <RemoteSelection key={cursor.clientId} {...cursor} />
      ))}
    </div>
  )
}


function RemoteSelection({ data, selectionRects, caretPosition }: CursorOverlayData<CursorData>): React.ReactElement | null {
  if (!data) {
    return null
  }

  const selectionStyle: CSSProperties = {
    backgroundColor: data?.color || 'gray',
    opacity: 0.5
  }

  return (
    <>
      {selectionRects.map((position, i) => (
        <div
          className="textbit-y-selection"
          style={{ ...selectionStyle, ...position }}
          key={i}
        />
      ))}
      {caretPosition && <Caret caretPosition={caretPosition} data={data} />}
    </>
  )
}


function Caret({ caretPosition, data }: CaretProps): React.ReactElement {
  const caretStyle: CSSProperties = {
    ...caretPosition,
    background: data?.color || 'gray',
    width: '2px'
  }

  const labelStyle: CSSProperties = {
    backgroundColor: data?.color || 'gray'
  }

  return (
    <div style={caretStyle} className="textbit-y-caret">
      <div style={labelStyle}>
        {data?.name || '?'}
      </div>
    </div>
  )
}
