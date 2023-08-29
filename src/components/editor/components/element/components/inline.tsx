import { RenderElementProps } from "slate-react"
import { RenderElementFunction, Renderer } from "../../../../../types"

type RenderInlineElementProps = {
    renderer: Renderer
} & RenderElementProps

/**
 * Render an inline child element (class inline)
 * 
 * @param props RenderInlineElementProps
 * @returns JSX.Element
 */
export const InlineElementComponent = ({ element, attributes, children, renderer }: RenderInlineElementProps) => {
    const render = renderer.render as RenderElementFunction
    return render({ element, attributes, children })
}