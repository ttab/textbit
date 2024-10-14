import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef } from 'react' // Necessary for esbuild
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
  const selected = useSelected()
  const focused = useFocused()
  const { setOffsetY } = useContext(GutterContext)
  const ref = useRef<HTMLDivElement>(null)

  const recalculateTop = useCallback(() => {
    if (!focused || !selected || !ref?.current) {
      return
    }

    const { top } = ref.current.getBoundingClientRect()
    setOffsetY(top)
  }, [focused, selected, ref?.current])

  // Recalculate position if something have scrolled
  useEffect(() => {
    addEventListener('scroll', recalculateTop, {
      passive: true,
      capture: true
    })

    return () => window.removeEventListener('scroll', recalculateTop)
  })

  // Recalculate position on rerenders (i.e. user moves selection/cursor)
  useLayoutEffect(() => {
    recalculateTop()
  }, [focused, selected, ref])

  const { element, attributes, entry } = renderProps

  // Relative position is needed for slate default placeholder to be positioned correctly
  return (
    <Droppable element={element}>
      <div
        className={`${element.class} ${element.type} ${entry.class} relative`}
        data-id={element.id}
        ref={ref}
      >
        <div {...attributes}>
          {entry.component(renderProps)}
        </div>
      </div>
    </Droppable>
  )
}
