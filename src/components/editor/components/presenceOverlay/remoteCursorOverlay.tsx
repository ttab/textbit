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

function Caret({ caretPosition, data }: CaretProps): React.ReactElement {
  const caretStyle: CSSProperties = {
    ...caretPosition,
    background: data?.color || 'gray',
    width: '2px'
  }

  const labelStyle: CSSProperties = {
    transform: 'translateY(-91%)',
    width: 'max-content',
    padding: '0px 6px 1px 6px',
    opacity: '0.9',
    backgroundColor: data?.color || 'gray',
    whiteSpace: 'nowrap',
    top: '0',
    borderBottomLeftRadius: '0'
  }

  return (
    <div style={caretStyle} className="absolute">
      <div
        className={`text-sans-serif absolute text-xs fg-base r-base b-weak`}
        style={labelStyle}
      >
        {data?.name || '?'}
      </div>
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
    <React.Fragment>
      {selectionRects.map((position, i) => (
        <div
          style={{ ...selectionStyle, ...position }}
          className="absolute pointer-events-none"
          key={i}
        />
      ))}
      {caretPosition && <Caret caretPosition={caretPosition} data={data} />}
    </React.Fragment>
  )
}

type RemoteCursorsProps = PropsWithChildren<{
  className?: string
}>

export function RemoteCursorOverlay({ className, children }: RemoteCursorsProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cursors] = useRemoteCursorOverlayPositions<CursorData>({
    containerRef
  })

  return (
    <div className={`relative ${className || ''}`} ref={containerRef}>
      {children}
      {cursors.map((cursor) => (
        <RemoteSelection key={cursor.clientId} {...cursor} />
      ))}
    </div>
  )
}
