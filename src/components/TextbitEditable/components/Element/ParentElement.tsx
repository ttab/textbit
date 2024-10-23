import React, { useCallback, useContext, useEffect, useRef } from 'react' // Necessary for esbuild
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { Droppable } from './Droppable'
import { Plugin } from '@/types'
import { GutterContext } from '../../../GutterProvider'


interface ParentElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
  options?: Record<string, unknown>
}

/**
 * Render an ordinary parent element of class text, textblock, block, void)
 *
 * @param props RenderParentElementProps
 * @returns JSX.Element
 */
export const ParentElement = (renderProps: ParentElementProps) => {
  const { element, attributes, entry } = renderProps

  // Relative position is needed for slate default placeholder to be positioned correctly
  return (
    <Droppable element={element}>
      <div
        className={`${element.class} ${element.type} ${entry.class} relative`}
        data-id={element.id}
      >
        <div {...attributes}>
          {entry.component(renderProps)}
        </div>
      </div>
    </Droppable>
  )
}
