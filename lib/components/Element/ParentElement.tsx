import { useSelected, useSlateStatic, type RenderElementProps } from 'slate-react'
import { Droppable } from './Droppable'
import type { ComponentEntry } from '../../types'
import { useAdjacentBlock } from '../../hooks/useAdjacentBlock'
import { CSSProperties } from 'react'

interface ParentElementProps extends RenderElementProps {
  entry: ComponentEntry
  options?: Record<string, unknown>
}

/**
 * Render an ordinary parent element of class text, textblock, block, void)
 *
 * @param props RenderParentElementProps
 * @returns JSX.Element
 */
export function ParentElement(renderProps: ParentElementProps) {
  const active = useSelected() // Whether cursor is inside block
  const editor = useSlateStatic()
  const adjacentBlock = useAdjacentBlock()
  const { element, attributes, entry } = renderProps

  const adjacentState: 'before' | 'after' | null = adjacentBlock && adjacentBlock.blockId === element.id
    ? adjacentBlock.direction
    : null

  const blockCaretStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    insetInlineEnd: -5,
    width: 1,
    backgroundColor: 'currentColor',
    pointerEvents: 'none',
    animation: 'block-caret-blink 1s step-end infinite'
  }

  /*
   * Class "relative" is needed for slate default placeholder to be positioned correctly.
   * Class "group" add support for tailwind so that plugin components can use tw class
   * selectors like "group-data-[state='active']:ring-1"
   */

  /*
   * inactive : cursor is elsewhere
   * active   : cursor is inside
   * before   : cursor is parked adjacent, before this block (arrived from preceding block)
   * after    : cursor is parked adjacent, after this block (arrived from following block)
   */
  const dataState = active
    ? 'active'
    : adjacentState === 'before'
      ? 'before'
      : adjacentState === 'after'
        ? 'after'
        : 'inactive'

  return (
    <Droppable element={element}>
      <div
        lang={renderProps.element.lang || editor.lang}
        data-id={element.id}
        data-state={dataState}
        className={`${element.class} ${element.type} ${entry.class} relative group`}
        style={{ position: 'relative' }}
        {...attributes}
      >
        <entry.component {...renderProps} editor={editor} />
        {adjacentState === 'before' && (
          <div
            aria-hidden
            style={{
              ...blockCaretStyle,
              insetInlineEnd: 'unset',
              insetInlineStart: -5
            }}
          />
        )}
        {adjacentState === 'after' && (
          <div
            aria-hidden
            style={blockCaretStyle}
          />
        )}
      </div>
    </Droppable>
  )
}
