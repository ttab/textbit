import { useSelected, useSlateStatic, type RenderElementProps } from 'slate-react'
import { Droppable } from './Droppable'
import type { ComponentEntry } from '../../types'
import { useAdjacentBlock } from '../../hooks/useAdjacentBlock'
import { useBlockSelection } from '../../hooks/useBlockSelection'
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
  const blockSelection = useBlockSelection()
  const { element, attributes, entry } = renderProps
  if (entry.asOwnElement) return null

  // Block-level selection: check if this element is within the selected range
  const isBlockSelected = (() => {
    if (!blockSelection) return false
    const myIndex = editor.children.findIndex(c => c === element)
    if (myIndex === -1) return false
    const lo = Math.min(blockSelection.anchorIndex, blockSelection.focusIndex)
    const hi = Math.max(blockSelection.anchorIndex, blockSelection.focusIndex)
    return myIndex >= lo && myIndex <= hi
  })()

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
   * inactive : cursor is elsewhere
   * active   : cursor is inside
   * before   : cursor is parked adjacent, before this block (arrived from preceding block)
   * after    : cursor is parked adjacent, after this block (arrived from following block)
   */
  const dataState = adjacentState === 'before'
    ? 'before'
    : adjacentState === 'after'
      ? 'after'
      : active
        ? 'active'
        : 'inactive'

  return (
    <Droppable element={element}>
      <div
        lang={renderProps.element.lang || editor.lang}
        data-id={element.id}
        data-type={element.type}
        data-state={dataState}
        {...(isBlockSelected ? { 'data-block-selected': '' } : {})}
        className={`${element.class} ${element.type} ${entry.class} relative group`}
        style={{ position: 'relative', ...(isBlockSelected ? { userSelect: 'none' } : {}) }}
        {...attributes}
      >
        <entry.component element={element} options={renderProps.options} editor={editor}>
          {renderProps.children}
        </entry.component>
        {element.class !== 'text' && element.class !== 'inline' && (
          <div
            contentEditable={false}
            className='tb-focus-ring'
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
            }}
          />
        )}
        {isBlockSelected && (
          <div
            contentEditable={false}
            className='tb-block-selected'
            style={{
              position: 'absolute',
              inset: -2,
              pointerEvents: 'none',
              outline: '2px solid Highlight',
              outlineOffset: '2px',
              borderRadius: 'var(--tb-focus-ring-radius, 5px)',
            }}
          />
        )}
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
