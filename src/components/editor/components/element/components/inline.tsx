import { RenderElementProps } from "slate-react"

type RenderInlineElementProps = {
    renderer: any
} & RenderElementProps

/**
 * Render an inline child element (class inline)
 * 
 * @param props RenderInlineElementProps
 * @returns JSX.Element
 */
export const InlineElement = ({ element, attributes, children, renderer }: RenderInlineElementProps) => {
    return renderer.render({ element, attributes, children })
}