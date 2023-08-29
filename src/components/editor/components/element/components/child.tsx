import React from 'react' // Necessary for esbuild
import { Node } from "slate"
import { RenderElementProps } from "slate-react"
import { RenderElementFunction, Renderer } from "../../../../../types"

type RenderChildElementProps = {
    renderer: Renderer
    rootNode: Node
} & RenderElementProps

/**
 * Render a child element of class text, textblock, block, void)
 * 
 * @param props RenderChildElementProps
 * @returns JSX.Element
 */
export const ChildElementComponent = ({ attributes, children, element, renderer, rootNode }: RenderChildElementProps) => {
    const render = renderer.render as RenderElementFunction

    return (
        <div
            className={`child ${renderer.type}`}
            data-id={element.id}
            {...attributes}
        >
            <div>
                {render({ element, attributes, children, rootNode })}
            </div>
        </div>
    )
}