import React from 'react'
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
export const InlineElementComponent = ({ attributes, children, element, component }: RenderInlineElementProps) => {
  return (
    <span
      className={`inline ${component.type}`}
      data-id={element.id}
      {...attributes}
    >
      {component.component.render({ element, attributes, children })}
    </span>
  )
}
