import React from 'react' // Necessary for esbuild
import { RenderElementProps } from "slate-react"
import { Droppable } from "./Droppable"

/**
 * Used when no renderer exists, unknown node
 *
 * @param props RenderElementProps
 * @returns JSX.Element
 */
export const UnknownElement = ({ element, attributes, children }: RenderElementProps) => {
  return (
    // TODO: Investigate if this dataId should be there (as data-id - or at all)?
    // <Droppable dataId={element?.id || ''}>
    <Droppable>
      <div
        contentEditable={false}
        className="textbit-parent textbit-unknown"
        data-id={element.id}
        {...attributes}
      >
        <pre style={{ fontSize: '80%' }}> UNKNOWN OBJECT({element.type})</pre>
        <div style={{ opacity: '0.4' }}>
          {children}
        </div>
      </div>
    </Droppable>
  )
}
