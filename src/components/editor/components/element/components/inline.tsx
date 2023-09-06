import { RenderElementProps } from "slate-react"
import { RegistryComponent } from "../../../registry"

type RenderInlineElementProps = {
    component: RegistryComponent
} & RenderElementProps

/**
 * Render an inline child element (class inline)
 * 
 * @param props RenderInlineElementProps
 * @returns JSX.Element
 */
export const InlineElementComponent = ({ element, attributes, children, component }: RenderInlineElementProps) => {
    return component.component.render({ element, attributes, children })
}