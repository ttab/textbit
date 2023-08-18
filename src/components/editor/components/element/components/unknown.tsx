import React from 'react' // Necessary for esbuild
import { RenderElementProps } from "slate-react"
import { Droppable } from "./droppable"

/**
 * Used when no renderer exists, unknown node
 * 
 * @param props RenderElementProps
 * @returns JSX.Element
 */
export const UnknownElement = ({ element, attributes, children }: RenderElementProps) => {
    return (
        <Droppable dataId={element?.id || ''}>
            <div
                contentEditable={false}
                className="parent unknown"
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