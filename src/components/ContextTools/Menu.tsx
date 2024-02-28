import React, { PropsWithChildren, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocused, useSlateSelection, useSlateStatic } from 'slate-react'
import { useClickGlobal } from '../../hooks'

import './index.css'
import { PositionContext } from './PositionProvider'
import { Editor, Element, Range } from 'slate'

export const Menu = ({ children }: PropsWithChildren) => {
  const { position: offset } = useContext(PositionContext)
  const editor = useSlateStatic()
  const [display, setDisplay] = useState<[boolean, number, number]>([false, 0, 0])
  const selection = useSlateSelection()
  const focused = useFocused()
  const ref = useRef<HTMLDivElement>(null)

  const mouseTriggerRef = useClickGlobal<HTMLDivElement>(() => {
    setDisplay([false, display[1], display[2]])
  })

  useEffect(() => {
    const currWidth = display[1]
    const currHeight = display[2]

    if (!selection || !Range.isRange(selection) || !offset || !focused) {
      setDisplay([false, currWidth, currHeight])
      return
    }

    if (Range.isCollapsed(selection)) {
      const nodes = Array.from(Editor.nodes(editor, {
        at: selection,
        match: n => Element.isElement(n) && n.class === 'inline'
      }))

      if (!nodes.length) {
        setDisplay([false, currWidth, currHeight])
        return
      }
    }

    const { width, height } = ref?.current?.getBoundingClientRect() || { width: 0 }
    setDisplay([true, width ? width / 2 : 0, height || 0])
  }, [selection, focused])

  if (!offset) {
    return
  }

  return (
    <div ref={mouseTriggerRef}>
      <div ref={ref} style={{
        left: `${offset.x - display[1]}px`,
        top: `${offset.y - display[2]}px`,
        opacity: display[0] ? '1' : '0',
        zIndex: display[0] ? 'auto' : '-1'
      }} className='textbit-contexttools-menu'>

        {ref?.current && createPortal(
          <>{children}</>,
          ref.current
        )}
      </div>
    </div >
  )
}
