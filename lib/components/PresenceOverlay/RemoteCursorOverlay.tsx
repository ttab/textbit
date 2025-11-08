import { useEffect, useMemo, useRef, useState } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>
  const [cursors] = useRemoteCursorOverlayPositions<CursorData>({ containerRef })

  const overlayStyle: CSSProperties = {
    height: '100%',
    position: 'relative'
  }

  return (
    <div style={overlayStyle} className='textbit-y-overlay' ref={containerRef}>
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
    position: 'absolute',
    pointerEvents: 'none',
    backgroundColor: data?.color || 'gray',
    opacity: 0.5
  }

  return (
    <>
      {selectionRects.map((position, i) => (
        <div
          className='textbit-y-selection'
          style={{ ...selectionStyle, ...position }}
          key={i}
        />
      ))}
      {caretPosition && <Caret caretPosition={caretPosition} data={data} />}
    </>
  )
}

function Caret({ caretPosition, data }: CaretProps): React.ReactElement {
  const caretRef = useRef<HTMLDivElement>(null)
  const [placeAbove, setPlaceAbove] = useState(true)

  useEffect(() => {
    if (!caretRef.current) return

    const overlay = caretRef.current.closest('.textbit-y-overlay')
    if (!overlay) return

    const caretRect = caretRef.current.getBoundingClientRect()
    const overlayRect = overlay.getBoundingClientRect()

    setPlaceAbove((caretRect.top - overlayRect.top) > caretRect.height)
  }, [caretPosition])

  const caretStyle = useMemo<CSSProperties>(() => ({
    position: 'absolute',
    ...caretPosition,
    background: data?.color || 'gray',
    width: '2px'
  }), [caretPosition, data?.color])

  const labelStyle = useMemo<CSSProperties>(() => ({
    backgroundColor: data?.color?.trim() || 'gray',
    position: 'absolute',
    fontFamily: 'sans-serif',
    fontSize: '80%',
    borderRadius: '2px',
    transform: placeAbove
      ? 'translateY(-91%)'
      : `translateY(${caretPosition?.height || 44}px)`,
    width: 'max-content',
    padding: '0px 6px 1px 6px',
    opacity: 0.9,
    whiteSpace: 'nowrap',
    top: 0,
    borderBottomLeftRadius: 0
  }), [data?.color, placeAbove, caretPosition?.height])

  return (
    <div ref={caretRef} style={caretStyle} className='textbit-y-caret'>
      <div style={labelStyle}>
        {data?.name || '?'}
      </div>
    </div>
  )
}
