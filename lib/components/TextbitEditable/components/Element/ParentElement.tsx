import { useSelected, useSlateStatic, type RenderElementProps } from 'slate-react'
import { Droppable } from './Droppable'
import type { Plugin } from '../../../../types'


interface ParentElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
  options?: Record<string, unknown>
  isSelected?: boolean
}

/**
 * Render an ordinary parent element of class text, textblock, block, void)
 *
 * @param props RenderParentElementProps
 * @returns JSX.Element
 */
export const ParentElement = (renderProps: ParentElementProps) => {
  const active = useSelected() // Whether cursor is inside block
  const editor = useSlateStatic()
  const { element, attributes, entry, isSelected = false } = renderProps

  /*
   * Class "relative" is needed for slate default placeholder to be positioned correctly.
   * Class "group" add support for tailwind so that plugin components can use tw class
   * selectors like "group-data-[state='active']:ring-1"
   */

  /*
   * inactive : cursor is elsewhere
   * active   : cursor is inside
   * selected : cursor is "around", whole block is selected
   */
  let dataState
  if (isSelected) {
    dataState = 'selected'
  } else {
    dataState = active ? 'active' : 'inactive'
  }

  return (
    <Droppable element={element}>
      <div
        lang={renderProps.element.lang || editor.lang}
        data-id={element.id}
        data-state={dataState}
        className={`${element.class} ${element.type} ${entry.class} relative group`}
        {...attributes}
        contentEditable={isSelected ? false : undefined}
      >
        <entry.component {...renderProps} editor={editor} />
      </div>
    </Droppable>
  )
}
