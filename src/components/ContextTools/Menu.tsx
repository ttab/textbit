import React, { PropsWithChildren, useCallback, useContext, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFocused, useSlateStatic } from 'slate-react'

import './index.css'
import { PositionContext } from './PositionProvider'
import { Editor, Element, Range } from 'slate'

export const Menu = ({ children }: PropsWithChildren) => {
  const { position } = useContext(PositionContext)
  const editor = useSlateStatic()
  const focused = useFocused()
  const ref = useRef<HTMLDivElement>(null)

  const setVisibility = useCallback((opacity: string, zIndex: string): void => {
    setTimeout(() => {
      if (ref?.current) {
        ref.current.style.opacity = opacity
        ref.current.style.zIndex = zIndex
      }
    }, 0)
  }, [])

  useLayoutEffect(() => {
    const el = ref?.current
    if (!el) {
      return
    }

    const { selection } = editor
    if (!focused || !selection || !Range.isRange(selection) || !position || !focused) {
      return setVisibility('0', '-1')
    }

    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(Editor.nodes(editor, {
        at: selection,
        match: n => Element.isElement(n) && n.class === 'inline'
      }))

      if (!nodes.length) {
        return setVisibility('0', '-1')
      }
    }

    const { width, height } = ref?.current?.getBoundingClientRect() || { width: 0 }
    el.style.left = `${position.x - (width ? width / 2 : 0)}px`
    el.style.top = `${position.y - height}px`
    setVisibility('1', 'auto')
  }, [ref, position, focused])

  if (!position) {
    return
  }

  return (
    <div ref={ref} style={{
      opacity: '0',
      zIndex: '-1'
    }} className='textbit-contexttools-menu'>

      {ref?.current && createPortal(
        <>{children}</>,
        ref.current
      )}
    </div>
  )
}
