import React from 'react' // Necessary for esbuild
import { Node } from "slate"
import { RenderElementProps } from "slate-react"
import { Renderer } from "../../../../../types"

type RenderChildElementProps = {
    renderer: Renderer
    parent: Node
} & RenderElementProps

/**
 * Render a child element of class text, textblock, block, void)
 * 
 * @param props RenderChildElementProps
 * @returns JSX.Element
 */
export const ChildElement = ({ attributes, children, element, renderer, parent }: RenderChildElementProps) => {
    return (
        <div
            className={`child ${renderer.name}`}
            data-id={element.id}
            {...attributes}
        >
            <div>
                {renderer.render({ element, attributes, children, parent })}
            </div>
        </div>
    )
}