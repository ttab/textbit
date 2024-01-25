import React from 'react' // Necessary for esbuild
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { Droppable } from './Droppable'
import { Plugin } from '@/types'

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
        <div className={`textbit-block ${borderClass}`} style={style} >
          {entry.component(renderProps)}
        </div>
      </div>
    </Droppable>
  )
}
