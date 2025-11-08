import { type RenderElementProps } from 'slate-react'
import { Droppable } from './Droppable'

/**
 * Used when no renderer exists, unknown node
 *
 * @param props RenderElementProps
 */
export function UnknownElement({ element, attributes, children }: RenderElementProps) {
  return (
    <Droppable>
      <div
        contentEditable={false}
        className='textbit-parent textbit-unknown'
        data-id={element.id}
        {...attributes}
      >
        <pre style={{ fontSize: '80%' }}>
          {' '}
          UNKNOWN OBJECT(
          {element.type}
          )
        </pre>
        <div style={{ opacity: '0.4' }}>
          {children}
        </div>
      </div>
    </Droppable>
  )
}
