import React, { useContext, useLayoutEffect, useRef } from 'react' // Necessary for esbuild
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { Droppable } from './Droppable'
import { Plugin } from '@/types'
import { GutterContext } from '../../../GutterProvider'


interface ParentElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
}

/**
 * Render an ordinary parent element of class text, textblock, block, void)
 *
 * @param props RenderParentElementProps
 * @returns JSX.Element
 */
export const ParentElement = (renderProps: ParentElementProps) => {
  const selected = useSelected()
  const focused = useFocused()
  const { setOffset } = useContext(GutterContext)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!focused || !selected || !ref?.current) {
      return
    }

    const { top, right, bottom, left } = ref.current.getBoundingClientRect()

    setOffset({
      top: top + window.scrollY,
      right: right + window.scrollX,
      bottom: bottom + window.scrollX,
      left: left + window.scrollX
    })

  }, [focused, selected, ref])

  const { element, attributes, entry } = renderProps
  const style = {
    overflow: 'hidden',
    padding: ['block', 'textblock'].includes(entry.class) ? '8px' : '0 8px',
  }
  const borderClass = ['block', 'textblock'].includes(entry.class) && selected && focused ? 'textbit-active' : ''

  return (
    <Droppable element={element}>
      <div
        className={`textbit-parent ${element.class} ${element.type}`}
        data-id={element.id}
        {...attributes}
      >
        <div className={`textbit-block ${borderClass}`} style={style} ref={ref}>
          {entry.component(renderProps)}
        </div>
      </div>
    </Droppable>
  )
}
